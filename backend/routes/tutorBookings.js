import express from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

const router = express.Router();

// Middleware xác thực tutor
const verifyTutor = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ status: 'error', message: 'Chưa đăng nhập' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'tutor') {
      return res.status(403).json({ status: 'error', message: 'Chỉ gia sư mới có thể truy cập' });
    }
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ status: 'error', message: 'Token không hợp lệ' });
  }
};

router.use(verifyTutor);

// GET /api/tutor/bookings - Lấy tất cả booking của gia sư hiện tại (dùng tutor_id từ JWT)
router.get('/bookings', async (req, res) => {
  const tutorId = req.user.id; // JWT chứa id = tutor_id
  const { status } = req.query;

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
        u.email    AS student_email,
        u.phone_number AS student_phone
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
    res.json({ status: 'ok', data: result.rows });
  } catch (err) {
    console.error('tutor/bookings error:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server' });
  }
});

// GET /api/tutor/bookings/unread-count - Số booking pending
router.get('/bookings/unread-count', async (req, res) => {
  const tutorId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT COUNT(*) FROM bookings WHERE tutor_id = $1 AND status = 'pending'`,
      [tutorId]
    );
    res.json({ status: 'ok', count: parseInt(result.rows[0].count, 10) });
  } catch (err) {
    console.error('unread-count error:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server' });
  }
});

// PUT /api/tutor/bookings/:id/confirm - Gia sư xác nhận booking
router.put('/bookings/:id/confirm', async (req, res) => {
  const tutorId = req.user.id;
  const { id } = req.params;

  try {
    // Kiểm tra booking thuộc về tutor này và đang pending
    const check = await pool.query(
      `SELECT * FROM bookings WHERE id = $1 AND tutor_id = $2`,
      [id, tutorId]
    );
    if (check.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy lịch đặt' });
    }
    if (check.rows[0].status !== 'pending') {
      return res.status(400).json({ status: 'error', message: 'Chỉ có thể xác nhận lịch đang chờ' });
    }

    await pool.query(`UPDATE bookings SET status = 'confirmed' WHERE id = $1`, [id]);

    // Tự động gửi tin nhắn báo thành công cho học viên
    const autoMsg = `Chào bạn, mình đã xác nhận lịch học môn ${check.rows[0].subject}. Rất vui được hỗ trợ bạn!`;
    await pool.query(
      `INSERT INTO messages (sender_id, sender_type, receiver_id, receiver_type, content)
       VALUES ($1, 'tutor', $2, 'user', $3)`,
      [tutorId, check.rows[0].user_id, autoMsg]
    );

    res.json({ status: 'ok', message: 'Đã xác nhận lịch học thành công!' });
  } catch (err) {
    console.error('confirm booking error:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server' });
  }
});

export default router;
