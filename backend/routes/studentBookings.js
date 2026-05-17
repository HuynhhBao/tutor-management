import express from 'express';
import jwt from 'jsonwebtoken';
import { createBooking, getMyBookings } from '../controllers/studentBookingController.js';
import { cancelBooking } from '../controllers/studentCancelBookingController.js';

const router = express.Router();

// Middleware xác thực học viên
const verifyStudent = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ status: 'error', message: 'Chưa đăng nhập' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'user') {
      return res.status(403).json({ status: 'error', message: 'Chỉ học viên mới có thể thực hiện chức năng này' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ status: 'error', message: 'Token không hợp lệ' });
  }
};

router.use(verifyStudent);

router.post('/', createBooking);
router.get('/', getMyBookings);
router.put('/:id/cancel', cancelBooking);

export default router;
