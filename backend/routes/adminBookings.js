import express from 'express';
import jwt from 'jsonwebtoken';
import { getAllBookings, getBookingStats, cancelBooking } from '../controllers/adminBookingController.js';

const router = express.Router();

// Middleware xác thực & kiểm tra quyền admin
const verifyAdmin = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ status: 'error', message: 'Chưa đăng nhập' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin' && decoded.role !== 'staff') {
      return res.status(403).json({ status: 'error', message: 'Không có quyền truy cập' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ status: 'error', message: 'Token không hợp lệ' });
  }
};

router.use(verifyAdmin);

router.get('/', getAllBookings);
router.get('/stats', getBookingStats);
router.put('/:id/cancel', cancelBooking);

export default router;
