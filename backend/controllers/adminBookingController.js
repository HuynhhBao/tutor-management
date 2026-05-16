import pool from '../config/db.js';

// GET /api/admin/bookings - Lấy tất cả lịch đặt (kèm filter)
export const getAllBookings = async (req, res) => {
  const { status, search } = req.query;
  try {
    let query = `
      SELECT 
        b.id,
        b.subject,
        b.schedule_time,
        b.message,
        b.status,
        b.created_at,
        u.full_name AS student_name,
        u.email AS student_email,
        u.phone_number AS student_phone,
        u.avatar_url AS student_avatar,
        t.full_name AS tutor_name,
        t.email AS tutor_email,
        t.avatar_url AS tutor_avatar
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
    res.json({ status: 'ok', data: result.rows });
  } catch (err) {
    console.error('Admin getAllBookings error:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server khi lấy danh sách lịch đặt' });
  }
};

// GET /api/admin/bookings/stats - Thống kê lịch đặt
export const getBookingStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'pending') AS pending,
        COUNT(*) FILTER (WHERE status = 'confirmed') AS confirmed,
        COUNT(*) FILTER (WHERE status = 'completed') AS completed,
        COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled
      FROM bookings
    `);
    res.json({ status: 'ok', data: result.rows[0] });
  } catch (err) {
    console.error('Admin getBookingStats error:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server khi lấy thống kê' });
  }
};

// PUT /api/admin/bookings/:id/cancel - Admin hủy lịch
export const cancelBooking = async (req, res) => {
  const { id } = req.params;
  const BOOKING_FEE = 100000;

  try {
    await pool.query('BEGIN');

    const bookingResult = await pool.query('SELECT * FROM bookings WHERE id = $1', [id]);
    if (bookingResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy lịch đặt' });
    }

    const booking = bookingResult.rows[0];
    if (booking.status === 'cancelled') {
      await pool.query('ROLLBACK');
      return res.status(400).json({ status: 'error', message: 'Lịch đặt này đã bị hủy trước đó' });
    }
    if (booking.status === 'completed') {
      await pool.query('ROLLBACK');
      return res.status(400).json({ status: 'error', message: 'Không thể hủy lịch đã hoàn thành' });
    }

    // Cập nhật trạng thái thành cancelled
    await pool.query('UPDATE bookings SET status = $1 WHERE id = $2', ['cancelled', id]);

    // Hoàn tiền cho học viên nếu chưa completed
    if (booking.status === 'pending' || booking.status === 'confirmed') {
      await pool.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [BOOKING_FEE, booking.user_id]);
      await pool.query(`
        INSERT INTO transactions (user_id, user_type, amount, type, description)
        VALUES ($1, 'user', $2, 'deposit', 'Hoàn tiền do Admin hủy lịch')
      `, [booking.user_id, BOOKING_FEE]);
    }

    await pool.query('COMMIT');
    res.json({ status: 'ok', message: 'Đã hủy lịch và hoàn tiền cho học viên thành công' });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Admin cancelBooking error:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server khi hủy lịch' });
  }
};
