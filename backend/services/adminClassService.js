import pool from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

class AdminClassService {
  /**
   * Lấy danh sách toàn bộ các lớp học có phân loại & tìm kiếm
   */
  async getAllClasses(status, search) {
    let query = `
      SELECT 
        b.id, 
        b.user_id, 
        b.tutor_id, 
        b.subject, 
        b.schedule_time, 
        b.message, 
        b.admin_note, 
        b.status, 
        b.created_at,
        u.full_name AS student_name, 
        u.email AS student_email, 
        u.phone_number AS student_phone, 
        u.avatar_url AS student_avatar,
        t.full_name AS tutor_name, 
        t.email AS tutor_email, 
        t.avatar_url AS tutor_avatar,
        t.subjects AS tutor_subjects,
        t.qualification AS tutor_qualification
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

    // Lấy thống kê số lượng lớp theo từng trạng thái
    const statsResult = await pool.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed,
        COUNT(*) FILTER (WHERE status = 'disputed') AS disputed,
        COUNT(*) FILTER (WHERE status = 'resolved') AS resolved,
        COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending
      FROM bookings
    `);

    return {
      classes: result.rows,
      stats: statsResult.rows[0] || {}
    };
  }

  /**
   * Lấy chi tiết một lớp học theo ID
   */
  async getClassById(id) {
    const query = `
      SELECT 
        b.id, 
        b.user_id, 
        b.tutor_id, 
        b.subject, 
        b.schedule_time, 
        b.message, 
        b.admin_note, 
        b.status, 
        b.created_at,
        u.full_name AS student_name, 
        u.email AS student_email, 
        u.phone_number AS student_phone, 
        u.avatar_url AS student_avatar,
        t.full_name AS tutor_name, 
        t.email AS tutor_email, 
        t.avatar_url AS tutor_avatar,
        t.subjects AS tutor_subjects,
        t.qualification AS tutor_qualification
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN tutors t ON b.tutor_id = t.id
      WHERE b.id = $1
    `;
    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      throw new ApiError(404, 'Không tìm thấy thông tin lớp học');
    }
    return result.rows[0];
  }

  /**
   * Cập nhật trạng thái, ghi chú và tùy chọn hoàn tiền lớp học
   */
  async updateClassStatus(id, status, adminNote = '', isRefund = false) {
    const validStatuses = ['confirmed', 'completed', 'disputed', 'resolved', 'cancelled', 'pending'];
    if (!validStatuses.includes(status)) {
      throw new ApiError(400, `Trạng thái '${status}' không hợp lệ`);
    }

    const BOOKING_FEE = 100000;

    try {
      await pool.query('BEGIN');

      const checkQuery = `SELECT * FROM bookings WHERE id = $1`;
      const checkResult = await pool.query(checkQuery, [id]);

      if (checkResult.rows.length === 0) {
        throw new ApiError(404, 'Không tìm thấy thông tin lớp học');
      }

      const booking = checkResult.rows[0];

      // Update booking status & admin_note
      const updateQuery = `
        UPDATE bookings 
        SET status = $1, admin_note = $2 
        WHERE id = $3 
        RETURNING *
      `;
      const updateResult = await pool.query(updateQuery, [status, adminNote, id]);
      const updatedBooking = updateResult.rows[0];

      // Xử lý hoàn tiền nếu Admin tích chọn hoàn tiền
      if (isRefund) {
        await pool.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [BOOKING_FEE, booking.user_id]);
        await pool.query(
          `INSERT INTO transactions (user_id, user_type, amount, type, description)
           VALUES ($1, 'user', $2, 'deposit', $3)`,
          [booking.user_id, BOOKING_FEE, `Hoàn tiền phí đặt lịch lớp học môn ${booking.subject} (Lý do: Admin xử lý - ${adminNote || 'Hủy lớp/Tranh chấp'})`]
        );
      }

      // Gửi thông báo cho Học viên
      const refundNotice = isRefund ? ' (Hệ thống đã hoàn 100.000đ vào ví của bạn).' : '';
      const studentMsg = `Admin đã cập nhật trạng thái lớp học môn ${booking.subject} sang: "${status}". Ghi chú: ${adminNote || 'Không có'}${refundNotice}`;
      await pool.query(
        `INSERT INTO notifications (user_id, user_type, title, message) VALUES ($1, 'user', 'Cập nhật trạng thái lớp học', $2)`,
        [booking.user_id, studentMsg]
      );

      // Gửi thông báo cho Gia sư
      const tutorMsg = `Admin đã cập nhật trạng thái lớp học môn ${booking.subject} sang: "${status}". Ghi chú: ${adminNote || 'Không có'}`;
      await pool.query(
        `INSERT INTO notifications (user_id, user_type, title, message) VALUES ($1, 'tutor', 'Cập nhật trạng thái lớp học', $2)`,
        [booking.tutor_id, tutorMsg]
      );

      await pool.query('COMMIT');

      return updatedBooking;
    } catch (err) {
      await pool.query('ROLLBACK');
      throw err;
    }
  }
}

export default new AdminClassService();
