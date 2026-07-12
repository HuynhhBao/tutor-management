import walletService from '../services/walletService.js';
import { sendSuccess } from '../utils/response.js';

export const getWalletInfo = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const data = await walletService.getWalletInfo(userId);
    
    return sendSuccess(res, 200, 'Thành công', { data });
  } catch (err) {
    next(err);
  }
};

export const depositMoney = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { amount, paymentMethod } = req.body;

    const data = await walletService.depositMoney(userId, { amount, paymentMethod });

    return sendSuccess(res, 200, `Nạp thành công ${amount.toLocaleString('vi-VN')}đ vào tài khoản!`, { data });
  } catch (err) {
    next(err);
  }
};
