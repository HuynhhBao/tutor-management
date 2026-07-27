import pool from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import notificationService from './notificationService.js';

const BOOKING_FEE = 100000;

class BookingService {
  async createBooking(userId, { tutorId, subject, scheduleTime, message, duration = 1, recurringDays = '' }) {
    try {
      await pool.query('BEGIN');

      const hourlyRate = 100000;
      const parsedDuration = Number(duration) || 1;
      const totalFee = hourlyRate * parsedDuration;

      // Kiểm tra gia sư có tồn tại không
      const tutorCheck = await pool.query('SELECT * FROM tutors WHERE id = $1', [tutorId]);
      if (tutorCheck.rows.length === 0) {
        throw new ApiError(404, 'Không tìm thấy gia sư');
      }

      // Kiểm tra số dư ví
      const userResult = await pool.query('SELECT balance FROM users WHERE id = $1', [userId]);
      const balance = parseFloat(userResult.rows[0]?.balance || 0);
      if (balance < totalFee) {
        throw new ApiError(400, `Số dư ví không đủ. Cần ít nhất ${totalFee.toLocaleString('vi-VN')}đ để đặt lịch (${parsedDuration} giờ). Số dư hiện tại: ${balance.toLocaleString('vi-VN')}đ`);
      }

      // Kiểm tra trùng lịch cá nhân (chính học viên đã đặt gia sư này mà chưa duyệt chưa)
      const dupCheck = await pool.query(`
        SELECT id FROM bookings 
        WHERE user_id = $1 AND tutor_id = $2 AND status IN ('pending', 'confirmed')
      `, [userId, tutorId]);
      if (dupCheck.rows.length > 0) {
        throw new ApiError(400, 'Bạn đã có lịch đặt đang chờ xác nhận với gia sư này');
      }

      // Kiểm tra xung đột ca dạy của gia sư (Strict Slot Lock - Khóa buồng giờ tuyệt đối)
      const slotCheck = await pool.query(`
        SELECT id, status 
        FROM bookings 
        WHERE tutor_id = $1 
          AND status IN ('pending', 'confirmed')
          AND schedule_time = $2
      `, [tutorId, scheduleTime]);
      if (slotCheck.rows.length > 0) {
        const statusText = slotCheck.rows[0].status === 'confirmed' ? 'đã có lịch dạy (Đã xác nhận)' : 'đang có học viên khác chờ xác nhận';
        const formattedTime = scheduleTime.replace('T', ' lúc ');
        throw new ApiError(400, `Khung giờ [${formattedTime}] của gia sư này ${statusText}. Vui lòng chọn thời gian khác!`);
      }

      // Trừ tiền ví học viên
      await pool.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [totalFee, userId]);
      await pool.query(`
        INSERT INTO transactions (user_id, user_type, amount, type, description)
        VALUES ($1, 'user', $2, 'payment', $3)
      `, [userId, totalFee, `Thanh toán phí đặt lịch gia sư (${parsedDuration} giờ)`]);

      // Tạo booking
      const result = await pool.query(`
        INSERT INTO bookings (user_id, tutor_id, subject, schedule_time, message, status, total_fee, duration, recurring_days)
        VALUES ($1, $2, $3, $4, $5, 'pending', $6, $7, $8) RETURNING *
      `, [userId, tutorId, subject, scheduleTime, message || '', totalFee, parsedDuration, recurringDays || '']);

      await pool.query('COMMIT');
      
      // Gửi thông báo cho gia sư
      await notificationService.sendNotification(tutorId, 'tutor', 'Lịch học mới', 'Bạn vừa nhận được yêu cầu học!');
      
      return result.rows[0];
    } catch (err) {
      await pool.query('ROLLBACK');
      throw err;
    }
  }

  async getStudentBookings(userId, status) {
    let query = `
      SELECT 
        b.id, b.subject, b.schedule_time, b.message, b.status, b.created_at, b.total_fee, b.duration, b.recurring_days,
        t.id AS tutor_id,
        t.full_name AS tutor_name,
        t.email AS tutor_email,
        t.subjects AS tutor_subjects,
        t.qualification AS tutor_qualification,
        t.avatar_url AS tutor_avatar
      FROM bookings b
      JOIN tutors t ON b.tutor_id = t.id
      WHERE b.user_id = $1
    `;
    const params = [userId];

    if (status && status !== 'all') {
      params.push(status);
      query += ` AND b.status = $${params.length}`;
    }

    query += ' ORDER BY b.created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  async cancelStudentBooking(userId, bookingId) {
    try {
      await pool.query('BEGIN');

      const bookingResult = await pool.query(
        'SELECT * FROM bookings WHERE id = $1 AND user_id = $2',
        [bookingId, userId]
      );

      if (bookingResult.rows.length === 0) {
        throw new ApiError(404, 'Không tìm thấy lịch đặt');
      }

      const booking = bookingResult.rows[0];

      if (!['pending', 'confirmed'].includes(booking.status)) {
        throw new ApiError(400, 'Chỉ có thể hủy lịch khi đang ở trạng thái "Chờ xác nhận" hoặc "Đã xác nhận"');
      }

      // Hủy lịch
      await pool.query('UPDATE bookings SET status = $1 WHERE id = $2', ['cancelled', bookingId]);

      if (booking.status === 'confirmed') {
        // Hủy khi đã xác nhận: Không hoàn tiền
        await pool.query('COMMIT');
        await notificationService.sendNotification(booking.tutor_id, 'tutor', 'Hủy lịch học', 'Học viên đã hủy lịch học với bạn.');
        return 'Hủy lịch thành công. (Lưu ý: Hủy lịch đã xác nhận sẽ không được hoàn tiền theo quy định).';
      }

      // Hủy khi đang chờ xác nhận: Hoàn tiền 100%
      const refundAmount = parseFloat(booking.total_fee || BOOKING_FEE);
      await pool.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [refundAmount, userId]);
      await pool.query(`
        INSERT INTO transactions (user_id, user_type, amount, type, description)
        VALUES ($1, 'user', $2, 'deposit', 'Hoàn tiền do học viên hủy lịch')
      `, [userId, refundAmount]);

      await pool.query('COMMIT');
      await notificationService.sendNotification(booking.tutor_id, 'tutor', 'Hủy lịch học', 'Học viên đã hủy lịch học chờ xác nhận với bạn.');
      return 'Hủy lịch thành công! Tiền đã được hoàn vào ví của bạn.';
    } catch (err) {
      await pool.query('ROLLBACK');
      throw err;
    }
  }

  async getAllBookings(status, search) {
    let query = `
      SELECT 
        b.id, b.subject, b.schedule_time, b.message, b.status, b.created_at, b.total_fee, b.duration, b.recurring_days,
        u.full_name AS student_name, u.email AS student_email, u.phone_number AS student_phone, u.avatar_url AS student_avatar,
        t.full_name AS tutor_name, t.email AS tutor_email, t.avatar_url AS tutor_avatar
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN tutors t ON b.tutor_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (status && status !== 'all') {
      params.push(status);
      query += ` AND b.status = $${params.length}`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (u.full_name ILIKE $${params.length} OR t.full_name ILIKE $${params.length} OR b.subject ILIKE $${params.length})`;
    }

    query += ` ORDER BY b.created_at DESC`;

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getBookingStats() {
    const result = await pool.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending,
        COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed,
        COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled
      FROM bookings
    `);
    return result.rows[0];
  }

  async cancelBookingAsAdmin(id) {
    try {
      await pool.query('BEGIN');

      const bookingResult = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
      if (bookingResult.rows.length === 0) {
        throw new ApiError(404, 'Không tìm thấy lịch đặt');
      }

      const booking = bookingResult.rows[0];
      if (booking.status === 'cancelled') {
        throw new ApiError(400, 'Lịch đặt này đã bị hủy trước đó');
      }
      if (booking.status === 'completed') {
        throw new ApiError(400, 'Không thể hủy lịch đã hoàn thành');
      }

      await pool.query('UPDATE bookings SET status = $1 WHERE id = $2', ['cancelled', id]);

      if (booking.status === 'pending' || booking.status === 'confirmed') {
        const adminRefundAmount = parseFloat(booking.total_fee || BOOKING_FEE);
        await pool.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [adminRefundAmount, booking.user_id]);
        await pool.query(`
          INSERT INTO transactions (user_id, user_type, amount, type, description)
          VALUES ($1, 'user', $2, 'deposit', 'Hoàn tiền do Admin hủy lịch')
        `, [booking.user_id, adminRefundAmount]);
      }

      await pool.query('COMMIT');
      return 'Đã hủy lịch và hoàn tiền cho học viên thành công';
    } catch (err) {
      await pool.query('ROLLBACK');
      throw err;
    }
  }

  async getTutorBookings(tutorId, status) {
    let query = `
      SELECT
        b.id, b.subject, b.schedule_time, b.message, b.status, b.created_at, b.total_fee, b.duration, b.recurring_days,
        u.full_name AS student_name, u.email AS student_email, u.phone_number AS student_phone
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      WHERE b.tutor_id = $1
    `;
    const params = [tutorId];

    if (status && status !== 'all') {
      params.push(status);
      query += ` AND b.status = $${params.length}`;
    }

    query += ' ORDER BY b.created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  async getTutorUnreadCount(tutorId) {
    const result = await pool.query(
      `SELECT COUNT(*) FROM bookings WHERE tutor_id = $1 AND status = 'pending'`,
      [tutorId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  async confirmBookingAsTutor(tutorId, bookingId) {
    const check = await pool.query(
      `SELECT * FROM bookings WHERE id = $1 AND tutor_id = $2`,
      [bookingId, tutorId]
    );
    
    if (check.rows.length === 0) {
      throw new ApiError(404, 'Không tìm thấy lịch đặt');
    }
    if (check.rows[0].status !== 'pending') {
      throw new ApiError(400, 'Chỉ có thể xác nhận lịch đang chờ');
    }

    await pool.query(`UPDATE bookings SET status = 'confirmed' WHERE id = $1`, [bookingId]);

    const autoMsg = `Chào bạn, mình đã xác nhận lịch học môn ${check.rows[0].subject}. Rất vui được hỗ trợ bạn!`;
    await pool.query(
      `INSERT INTO messages (sender_id, sender_type, receiver_id, receiver_type, content)
       VALUES ($1, 'tutor', $2, 'user', $3)`,
      [tutorId, check.rows[0].user_id, autoMsg]
    );

    await notificationService.sendNotification(check.rows[0].user_id, 'user', 'Lịch học được xác nhận', 'Gia sư đã xác nhận lịch học của bạn.');

    return 'Đã xác nhận lịch học thành công!';
  }

  async completeBookingAsTutor(tutorId, bookingId) {
    const check = await pool.query(
      `SELECT * FROM bookings WHERE id = $1 AND tutor_id = $2`,
      [bookingId, tutorId]
    );

    if (check.rows.length === 0) {
      throw new ApiError(404, 'Không tìm thấy lớp học');
    }
    if (check.rows[0].status !== 'confirmed') {
      throw new ApiError(400, 'Chỉ có thể hoàn thành lớp đang ở trạng thái "Đã xác nhận"');
    }

    await pool.query(`UPDATE bookings SET status = 'completed' WHERE id = $1`, [bookingId]);

    const autoMsg = `Lớp học môn ${check.rows[0].subject} đã được đánh dấu hoàn thành. Cảm ơn bạn đã học cùng mình! 🎉`;
    await pool.query(
      `INSERT INTO messages (sender_id, sender_type, receiver_id, receiver_type, content)
       VALUES ($1, 'tutor', $2, 'user', $3)`,
      [tutorId, check.rows[0].user_id, autoMsg]
    );

    await notificationService.sendNotification(
      check.rows[0].user_id, 
      'user', 
      '🎓 Hoàn thành Buổi 1 & Gia hạn', 
      `Gia sư đã xác nhận hoàn thành ca học môn ${check.rows[0].subject}. Hãy vào mục "Lịch của tôi" để tiếp tục gia hạn hoặc đăng ký chặng học mới nhằm bảo lưu khung giờ của bạn nhé!`
    );

    return 'Đã hoàn thành lớp học thành công!';
  }

  async reportDisputeStudent(userId, bookingId, reason) {
    const check = await pool.query(
      'SELECT * FROM bookings WHERE id = $1 AND user_id = $2',
      [bookingId, userId]
    );
    if (check.rows.length === 0) {
      throw new ApiError(404, 'Không tìm thấy lớp học');
    }
    const booking = check.rows[0];
    if (booking.status !== 'confirmed') {
      throw new ApiError(400, 'Chỉ có thể báo tranh chấp với lớp học đang ở trạng thái "Đã xác nhận"');
    }

    const note = `[Học viên báo tranh chấp]: ${reason || 'Không có lý do chi tiết'}`;
    await pool.query(
      'UPDATE bookings SET status = $1, admin_note = $2 WHERE id = $3',
      ['disputed', note, bookingId]
    );

    return 'Đã gửi báo cáo tranh chấp tới Quản trị viên xử lý!';
  }
}

export default new BookingService();
