import pool from '../config/db.js';

const BOOKING_FEE = 100000;

/**
 * Controller xử lý hủy đặt lịch của học viên theo yêu cầu Sequence Diagram
 * Điều kiện hoàn tiền: 
 * - Đủ điều kiện: Hủy khi gia sư chưa xác nhận (pending) HOẶC báo trước 24h so với giờ học.
 * - Không đủ điều kiện: Gia sư đã xác nhận và hủy dưới 24h trước giờ học.
 */
export const cancelBooking = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    await pool.query('BEGIN');

    // 1. Lấy thông tin đặt lịch
    const bookingResult = await pool.query(
      `SELECT b.*, t.full_name as tutor_name 
       FROM bookings b 
       JOIN tutors t ON b.tutor_id = t.id 
       WHERE b.id = $1 AND b.user_id = $2`,
      [id, userId]
    );

    if (bookingResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy thông tin đặt lịch' });
    }

    const booking = bookingResult.rows[0];

    // Kiểm tra trạng thái hợp lệ để hủy
    if (!['pending', 'confirmed'].includes(booking.status)) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ 
        status: 'error', 
        message: 'Chỉ có thể hủy lịch đang ở trạng thái Chờ xác nhận hoặc Đã xác nhận' 
      });
    }

    // 2. Kiểm tra điều kiện hoàn tiền
    const now = new Date();
    const scheduleTime = new Date(booking.schedule_time);
    
    // Kiểm tra tính hợp lệ của ngày tháng
    const isValidDate = scheduleTime instanceof Date && !isNaN(scheduleTime);
    const timeDiff = isValidDate ? scheduleTime.getTime() - now.getTime() : -1;
    const hoursDifference = timeDiff / (1000 * 60 * 60);

    // Đủ điều kiện: trạng thái pending HOẶC (đã confirmed và báo trước >= 24h)
    const isEligibleForRefund = booking.status === 'pending' || (isValidDate && hoursDifference >= 24);

    // 3. Cập nhật trạng thái đặt lịch sang cancelled
    await pool.query(
      'UPDATE bookings SET status = $1 WHERE id = $2',
      ['cancelled', id]
    );

    let message = 'Hủy lịch thành công.';
    
    if (isEligibleForRefund) {
      // 4. Thực hiện hoàn tiền nếu đủ điều kiện
      await pool.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [BOOKING_FEE, userId]);
      
      // Lưu giao dịch hoàn tiền
      await pool.query(`
        INSERT INTO transactions (user_id, user_type, amount, type, description)
        VALUES ($1, 'user', $2, 'refund', $3)
      `, [userId, BOOKING_FEE, `Hoàn tiền phí đặt lịch (Mã lịch: ${id})`]);

      message += ' Tiền đã được hoàn lại vào ví của bạn.';

      // Gửi thông báo hoàn tiền cho học viên
      await pool.query(`
        INSERT INTO notifications (user_id, user_type, title, message)
        VALUES ($1, 'user', $2, $3)
      `, [userId, 'Hoàn tiền thành công', `Bạn đã được hoàn ${BOOKING_FEE.toLocaleString('vi-VN')}đ do hủy lịch đặt ${booking.subject}.`]);
    } else {
      message += ' (Lưu ý: Bạn không được hoàn phí đặt lịch do hủy sát giờ học < 24h).';
    }

    // 5. Gửi thông báo hủy cho gia sư
    const displayDate = isValidDate 
      ? scheduleTime.toLocaleString('vi-VN') 
      : booking.schedule_time;

    await pool.query(`
      INSERT INTO notifications (user_id, user_type, title, message)
      VALUES ($1, 'tutor', $2, $3)
    `, [booking.tutor_id, 'Lịch đặt đã bị hủy', `Học viên đã hủy lịch đặt môn ${booking.subject} vào lúc ${displayDate}.`]);

    await pool.query('COMMIT');
    res.json({ status: 'ok', message });

  } catch (err) {
    if (pool) await pool.query('ROLLBACK');
    console.error('Cancel booking error:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server khi thực hiện hủy lịch: ' + err.message });
  }
};
