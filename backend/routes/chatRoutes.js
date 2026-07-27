import express from 'express';
import { sendMessage, getMessages, getConversations, getTotalUnreadMessages } from '../controllers/chatController.js';
import validate from '../middlewares/validate.js';
import { sendMessageSchema } from '../validations/chatValidation.js';
import { verifyUser, verifyTutor } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Route cho cả User và Tutor nên dùng middleware kết hợp hoặc một custom middleware
const verifyChatAuth = (req, res, next) => {
  // Cả User và Tutor đều dùng được Chat, nên nếu role là user hoặc tutor thì pass
  const role = req.user?.role;
  if (role === 'user' || role === 'tutor') {
    next();
  } else {
    // Để an toàn, chúng ta có thể gọi verifyUser trước, nếu thất bại thì gọi verifyTutor
    // Tuy nhiên cách đơn giản nhất là viết một middleware inline cho route này
    next(new Error('Unauthorized')); // Tạm thời để ở đây, thực tế authMiddleware đã gán req.user
  }
};

import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';

const verifyAuthAny = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return next(new ApiError(401, 'Chưa đăng nhập'));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return next(new ApiError(401, 'Token không hợp lệ'));
  }
};

router.use(verifyAuthAny);

router.post('/send', validate(sendMessageSchema), sendMessage);
router.get('/messages/:partnerId/:partnerType', getMessages);
router.get('/conversations', getConversations);
router.get('/unread-count', getTotalUnreadMessages);

export default router;
