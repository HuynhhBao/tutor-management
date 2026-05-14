import express from 'express';
import jwt from 'jsonwebtoken';
import { getWalletInfo, depositMoney } from '../controllers/walletController.js';

const router = express.Router();

// Middleware xác thực user
const verifyUser = (req, res, next) => {
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

router.use(verifyUser);

router.get('/', getWalletInfo);
router.post('/deposit', depositMoney);

export default router;
