import express from 'express';
import jwt from 'jsonwebtoken';
import { sendMessage, getMessages, getConversations } from '../controllers/chatController.js';

const router = express.Router();

// Middleware xác thực chung cho cả User và Tutor
const verifyAuth = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ status: 'error', message: 'Chưa đăng nhập' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ status: 'error', message: 'Token không hợp lệ' });
  }
};

router.use(verifyAuth);

router.post('/send', sendMessage);
router.get('/messages/:partnerId/:partnerType', getMessages);
router.get('/conversations', getConversations);

export default router;
