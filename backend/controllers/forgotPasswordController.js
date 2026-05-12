import pool from '../config/db.js';
import transporter from '../utils/mailer.js';
import bcrypt from 'bcryptjs';

// In-memory OTP store: email -> { otp, expiresAt, verified? }
const otpStore = new Map();

// POST /api/auth/forgot-password  — Step 1: Gửi OTP
export const forgotPassword = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ status: 'error', message: 'Vui lòng nhập email' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Email không tồn tại trong hệ thống' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 phút
    otpStore.set(email, { otp, expiresAt });

    await transporter.sendMail({
      from: `"EduMatch" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔐 Mã OTP đặt lại mật khẩu - EduMatch',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: #f9fafb; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #7c3aed; margin: 0; font-size: 28px;">🎓 EduMatch</h1>
          </div>
          <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h2 style="color: #1e293b; margin-top: 0;">Đặt lại mật khẩu</h2>
            <p style="color: #475569;">Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
            <p style="color: #475569;">Mã OTP của bạn là:</p>
            <div style="background: #f1f5f9; border: 2px dashed #7c3aed; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
              <span style="font-size: 40px; font-weight: bold; letter-spacing: 10px; color: #7c3aed;">${otp}</span>
            </div>
            <p style="color: #ef4444; font-weight: bold;">⏰ Mã này có hiệu lực trong <strong>5 phút</strong></p>
            <p style="color: #94a3b8; font-size: 13px;">Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
          </div>
          <p style="color: #cbd5e1; font-size: 12px; text-align: center; margin-top: 20px;">© 2025 EduMatch. All rights reserved.</p>
        </div>
      `,
    });

    res.json({ status: 'ok', message: 'Mã OTP đã được gửi đến email của bạn' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ status: 'error', message: 'Không thể gửi email, vui lòng thử lại' });
  }
};

// POST /api/auth/verify-otp  — Step 2: Xác thực OTP
export const verifyOtp = (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ status: 'error', message: 'Thiếu thông tin xác thực' });
  }

  const record = otpStore.get(email);

  if (!record) {
    return res.status(400).json({ status: 'error', message: 'Mã OTP không hợp lệ hoặc đã được sử dụng' });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ status: 'error', message: 'Mã OTP đã hết hạn, vui lòng yêu cầu mã mới' });
  }

  if (record.otp !== otp) {
    return res.status(400).json({ status: 'error', message: 'Mã OTP không chính xác' });
  }

  otpStore.set(email, { ...record, verified: true });
  res.json({ status: 'ok', message: 'Xác thực OTP thành công' });
};

// POST /api/auth/reset-password  — Step 3: Đặt lại mật khẩu
export const resetPassword = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ status: 'error', message: 'Thiếu thông tin' });
  }

  const record = otpStore.get(email);
  if (!record?.verified) {
    return res.status(400).json({ status: 'error', message: 'Phiên đặt lại mật khẩu không hợp lệ' });
  }

  const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ status: 'error', message: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa và ký tự đặc biệt' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);

    otpStore.delete(email);
    res.json({ status: 'ok', message: 'Đặt lại mật khẩu thành công' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server' });
  }
};
