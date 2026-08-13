import walletService from '../services/wallet.service.js';
import paymentService from '../services/payment.service.js';
import { sendSuccess } from '../../../utils/response.js';

export const getWalletInfo = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const ownerType = req.user.role === 'tutor' ? 'tutor' : 'user';

    const wallet = await walletService.getWalletBalance(ownerId, ownerType);
    
    // Phân trang đơn giản cho lịch sử giao dịch
    const page = Number.parseInt(req.query.page) || 1;
    const limit = Number.parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    
    const transactions = await walletService.getTransactions(wallet.id, limit, offset);

    return sendSuccess(res, 200, 'Lấy thông tin ví thành công', { 
      data: {
        balance: Number.parseFloat(wallet.balance),
        currency: wallet.currency,
        status: wallet.status,
        transactions 
      }
    });
  } catch (err) {
    next(err);
  }
};

export const depositMoney = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const ownerType = req.user.role === 'tutor' ? 'tutor' : 'user';
    const { amount, paymentMethod } = req.body;

    const normalizedMethod = paymentMethod ? paymentMethod.toUpperCase() : '';

    if (normalizedMethod === 'VNPAY') {
      const vnpUrl = await paymentService.createVNPayUrl(req, amount, ownerId, ownerType);
      return sendSuccess(res, 200, 'Tạo URL thanh toán thành công', { data: { paymentUrl: vnpUrl } });
    }

    // Backdoor dành cho môi trường Test (Black-box testing)
    if (normalizedMethod === 'SYSTEM_TEST' && (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development' || !process.env.NODE_ENV)) {
      const result = await walletService.addFunds(ownerId, ownerType, amount, 'Nạp tiền hệ thống (Test Mode)');
      return sendSuccess(res, 200, `Nạp thành công ${amount.toLocaleString('vi-VN')}đ (Test Mode)`, { data: result });
    }

    // Các phương thức khác bị từ chối
    return res.status(400).json({ status: 'error', message: 'Phương thức thanh toán không hợp lệ hoặc không được hỗ trợ.' });
  } catch (err) {
    next(err);
  }
};

export const requestWithdrawal = async (req, res, next) => {
  try {
    const ownerId = req.user.id;
    const ownerType = req.user.role === 'tutor' ? 'tutor' : 'user';
    const { amount, description } = req.body;

    const result = await walletService.requestWithdrawal(ownerId, ownerType, amount, description || 'Yêu cầu rút tiền');
    
    return sendSuccess(res, 200, 'Tạo yêu cầu rút tiền thành công, vui lòng chờ duyệt', { data: result });
  } catch (err) {
    next(err);
  }
};

export const vnpayWebhook = async (req, res, next) => {
  try {
    const result = await paymentService.handleVNPayIPN(req);
    // VNPay yêu cầu trả về chuẩn format JSON có thuộc tính RspCode, Message
    res.status(200).json({ RspCode: result.code, Message: result.message });
  } catch (err) {
    console.error('Webhook Error:', err);
    res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
  }
};

export const vnpayReturnUrl = async (req, res, next) => {
  try {
    // Tái sử dụng logic IPN để cộng tiền vào DB (do local không nhận được Webhook)
    const result = await paymentService.handleVNPayIPN(req);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    // Nếu giao dịch thành công (00) hoặc đã được cộng tiền trước đó (02)
    if (result.code === '00' || result.code === '02') {
      return res.redirect(`${frontendUrl}/student-dashboard/wallet?payment=success`);
    } else {
      return res.redirect(`${frontendUrl}/student-dashboard/wallet?payment=failed`);
    }
  } catch (err) {
    console.error('VNPay Return Error:', err);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/student-dashboard/wallet?payment=error`);
  }
};
