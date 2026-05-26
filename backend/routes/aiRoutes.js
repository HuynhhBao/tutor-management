import express from 'express';
import jwt from 'jsonwebtoken';
import { sendMessageToAI, getAIChatHistory, clearAIChatHistory } from '../controllers/aiController.js';

const router = express.Router();

// Middleware xác thực Học viên (Student)
const verifyStudentAuth = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ status: 'error', message: 'Chưa đăng nhập' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Chỉ cho phép học viên truy cập chatbox AI
    if (decoded.role !== 'user') {
      return res.status(403).json({ 
        status: 'error', 
        message: 'Quyền truy cập bị từ chối: Tính năng Trợ lý AI chỉ dành riêng cho Học viên.' 
      });
    }

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ status: 'error', message: 'Phiên làm việc hết hạn, vui lòng đăng nhập lại' });
  }
};

router.use(verifyStudentAuth);

router.post('/send', sendMessageToAI);
router.get('/history', getAIChatHistory);
router.post('/clear', clearAIChatHistory);

export default router;
