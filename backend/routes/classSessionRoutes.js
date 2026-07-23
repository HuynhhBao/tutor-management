import express from 'express';
import { uploadClassroomFile } from '../config/cloudinaryConfig.js';
import { sendSuccess } from '../utils/response.js';
import pool from '../config/db.js';

const router = express.Router();

// Route cố định PHẢI đặt TRƯỚC các route có :param để Express không nhầm lẫn
router.post('/upload', uploadClassroomFile.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng chọn file cần tải lên.' });
    }

    let fileUrl = req.file.path;

    // Nếu chạy chế độ local fallback (diskStorage), tạo URL đường dẫn tương đối qua HTTP
    if (!fileUrl.startsWith('http') && !fileUrl.startsWith('https')) {
      const serverUrl = `${req.protocol}://${req.get('host')}`;
      // Thay thế ký tự gạch chéo ngược Windows thành gạch chéo xuôi cho URL
      const cleanPath = req.file.path.replace(/\\/g, '/');
      fileUrl = `${serverUrl}/${cleanPath}`;
    }

    return sendSuccess(res, 200, 'Tải tài liệu lên thành công', {
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size
    });
  } catch (err) {
    next(err);
  }
});

// Lấy lịch sử tin nhắn của lớp học
router.get('/:classId/messages', async (req, res, next) => {
  try {
    const { classId } = req.params;
    const result = await pool.query(
      `SELECT id, booking_id as "classId", sender_id as "senderId", sender_name as "senderName", 
              sender_role as "senderRole", content as "text", file_url as "fileUrl", 
              file_name as "fileName", file_size as "fileSize", created_at as "createdAt"
       FROM classroom_messages
       WHERE booking_id = $1
       ORDER BY created_at ASC`,
      [classId]
    );
    return sendSuccess(res, 200, 'Lấy lịch sử tin nhắn thành công', { data: result.rows });
  } catch (err) {
    next(err);
  }
});

// Lấy snapshot bảng vẽ của lớp học
router.get('/:classId/snapshot', async (req, res, next) => {
  try {
    const { classId } = req.params;
    const result = await pool.query(
      'SELECT canvas_snapshot FROM bookings WHERE id = $1',
      [classId]
    );
    const snapshot = result.rows[0]?.canvas_snapshot || null;
    return sendSuccess(res, 200, 'OK', { snapshot });
  } catch (err) {
    next(err);
  }
});

// Lưu snapshot bảng vẽ của lớp học
router.post('/:classId/snapshot', async (req, res, next) => {
  try {
    const { classId } = req.params;
    const { snapshot } = req.body;
    if (!snapshot) {
      return res.status(400).json({ status: 'error', message: 'Thiếu dữ liệu snapshot' });
    }
    await pool.query(
      'UPDATE bookings SET canvas_snapshot = $1 WHERE id = $2',
      [snapshot, classId]
    );
    console.log(`Canvas snapshot saved for booking ${classId}`);
    return sendSuccess(res, 200, 'Đã lưu bảng vẽ thành công');
  } catch (err) {
    next(err);
  }
});

export default router;
