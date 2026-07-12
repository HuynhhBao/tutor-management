import authService from '../services/authService.js';
import { sendSuccess } from '../utils/response.js';
import { ApiError } from '../utils/ApiError.js';

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) throw new ApiError(400, 'Vui lòng nhập email');

    await authService.forgotPassword(email);
    return sendSuccess(res, 200, 'Mã OTP đã được gửi đến email của bạn');
  } catch (err) {
    next(err);
  }
};

export const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) throw new ApiError(400, 'Thiếu thông tin xác thực');

    await authService.verifyOtp(email, otp);
    return sendSuccess(res, 200, 'Xác thực OTP thành công');
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) throw new ApiError(400, 'Thiếu thông tin');

    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!passwordRegex.test(password)) {
      throw new ApiError(400, 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa và ký tự đặc biệt');
    }

    await authService.resetPassword(email, password);
    return sendSuccess(res, 200, 'Đặt lại mật khẩu thành công');
  } catch (err) {
    next(err);
  }
};
