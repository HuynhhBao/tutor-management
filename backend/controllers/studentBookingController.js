import pool from '../config/db.js';

const BOOKING_FEE = 100000;

// POST /api/student/bookings - Học viên đặt lịch
export const createBooking = async (req, res) => {
  const userId = req.user.id;
  const { tutorId, subject, scheduleTime, message } = req.body;

  if (!tutorId || !subject || !scheduleTime) {
    return res.status(400).json({ status: 'error', message: 'Vui lòng điền đầy đủ thông tin đặt lịch' });
  }

  try {
    await pool.query('BEGIN');

    // Kiểm tra gia sư có tồn tại và đang hoạt động không
    const tutorCheck = await pool.query('SELECT * FROM tutors WHERE id = $1', [tutorId]);
    if (tutorCheck.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy gia sư' });
    }

    // Kiểm tra số dư ví
    const userResult = await pool.query('SELECT balance FROM users WHERE id = $1', [userId]);
    const balance = parseFloat(userResult.rows[0]?.balance || 0);
    if (balance < BOOKING_FEE) {
      await pool.query('ROLLBACK');
      return res.status(400).json({
        status: 'error',
        message: `Số dư ví không đủ. Cần ít nhất ${BOOKING_FEE.toLocaleString('vi-VN')}đ để đặt lịch. Số dư hiện tại: ${balance.toLocaleString('vi-VN')}đ`
      });
    }

    // Kiểm tra không được đặt lịch trùng với gia sư đó trong trạng thái pending/confirmed
    const dupCheck = await pool.query(`
      SELECT id FROM bookings 
      WHERE user_id = $1 AND tutor_id = $2 AND status IN ('pending', 'confirmed')
    `, [userId, tutorId]);
    if (dupCheck.rows.length > 0) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ status: 'error', message: 'Bạn đã có lịch đặt đang chờ xác nhận với gia sư này' });
    }

    // Trừ tiền ví học viên
    await pool.query('UPDATE users SET balance = balance - $1 WHERE id = $2', [BOOKING_FEE, userId]);
    await pool.query(`
      INSERT INTO transactions (user_id, user_type, amount, type, description)
      VALUES ($1, 'user', $2, 'payment', 'Thanh toán phí đặt lịch gia sư')
    `, [userId, BOOKING_FEE]);

    // Tạo booking
    const result = await pool.query(`
      INSERT INTO bookings (user_id, tutor_id, subject, schedule_time, message, status)
      VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *
    `, [userId, tutorId, subject, scheduleTime, message || '']);

    await pool.query('COMMIT');
    res.status(201).json({
      status: 'ok',
      data: result.rows[0],
      message: 'Đặt lịch thành công! Vui lòng chờ gia sư xác nhận.'
    });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('createBooking error:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server khi đặt lịch' });
  }
};

// GET /api/student/bookings - Học viên xem lịch sử đặt của mình
export const getMyBookings = async (req, res) => {
  const userId = req.user.id;
  const { status } = req.query;

  try {
    let query = `
      SELECT 
        b.id, b.subject, b.schedule_time, b.message, b.status, b.created_at,
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
    res.json({ status: 'ok', data: result.rows });
  } catch (err) {
    console.error('getMyBookings error:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server khi lấy lịch đặt' });
  }
};

// PUT /api/student/bookings/:id/cancel - Học viên tự hủy lịch
export const cancelMyBooking = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  try {
    await pool.query('BEGIN');

    const bookingResult = await pool.query(
      'SELECT * FROM bookings WHERE id = $1 AND user_id = $2',
      [id, userId]
    );

    if (bookingResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy lịch đặt' });
    }

    const booking = bookingResult.rows[0];

    if (!['pending', 'confirmed'].includes(booking.status)) {
      await pool.query('ROLLBACK');
      return res.status(400).json({
        status: 'error',
        message: 'Chỉ có thể hủy lịch khi đang ở trạng thái "Chờ xác nhận" hoặc "Đã xác nhận"'
      });
    }

    // Hủy lịch
    await pool.query('UPDATE bookings SET status = $1 WHERE id = $2', ['cancelled', id]);

    if (booking.status === 'confirmed') {
      // Hủy khi đã xác nhận: Không hoàn tiền (bồi thường gia sư)
      await pool.query('COMMIT');
      return res.json({ status: 'ok', message: 'Hủy lịch thành công. (Lưu ý: Hủy lịch đã xác nhận sẽ không được hoàn tiền theo quy định).' });
    }

    // Hủy khi đang chờ xác nhận: Hoàn tiền 100% cho học viên
    await pool.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [BOOKING_FEE, userId]);
    await pool.query(`
      INSERT INTO transactions (user_id, user_type, amount, type, description)
      VALUES ($1, 'user', $2, 'deposit', 'Hoàn tiền do học viên hủy lịch')
    `, [userId, BOOKING_FEE]);

    await pool.query('COMMIT');
    res.json({ status: 'ok', message: 'Hủy lịch thành công! Tiền đã được hoàn vào ví của bạn.' });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('cancelMyBooking error:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server khi hủy lịch' });
  }
};
