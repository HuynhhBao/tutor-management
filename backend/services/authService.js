import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import transporter from '../utils/mailer.js';
import crypto from 'crypto';

// In-memory OTP store: email -> { otp, expiresAt, verified? }
const otpStore = new Map();

class AuthService {
  async registerUser({ email, fullName, password }) {
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      throw new ApiError(400, 'Email đã được sử dụng');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (email, full_name, password) VALUES ($1, $2, $3)',
      [email, fullName, hashedPassword]
    );
    return true;
  }

  async loginUser({ email, password }) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      throw new ApiError(401, 'Tài khoản không tồn tại');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new ApiError(401, 'Mật khẩu không chính xác');
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return {
      token,
      user: { id: user.id, email: user.email, fullName: user.full_name, phoneNumber: user.phone_number, role: 'user', avatarUrl: user.avatar_url }
    };
  }

  async adminLogin({ username, password }) {
    const result = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
    const admin = result.rows[0];

    if (!admin) {
      throw new ApiError(401, 'Tài khoản quản trị không tồn tại');
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      throw new ApiError(401, 'Mật khẩu không chính xác');
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.username, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return {
      token,
      user: { id: admin.id, email: admin.username, fullName: admin.full_name, role: admin.role, avatarUrl: admin.avatar_url }
    };
  }

  async tutorLogin({ username, password }) {
    const result = await pool.query(`
      SELECT a.*, t.full_name, t.email as tutor_email, t.avatar_url, t.status 
      FROM tutor_accounts a 
      JOIN tutors t ON a.tutor_id = t.id 
      WHERE a.username = $1
    `, [username]);

    const account = result.rows[0];

    if (!account) {
      throw new ApiError(401, 'Tài khoản gia sư không tồn tại');
    }

    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) {
      throw new ApiError(401, 'Mật khẩu không chính xác');
    }

    const token = jwt.sign(
      { id: account.tutor_id, accountId: account.id, username: account.username, role: 'tutor' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return {
      token,
      user: { 
        id: account.tutor_id, 
        accountId: account.id, 
        username: account.username, 
        fullName: account.full_name, 
        email: account.tutor_email, 
        role: 'tutor', 
        avatarUrl: account.avatar_url,
        status: account.status
      }
    };
  }

  async getUserProfile(decoded) {
    let userResult;
    if (decoded.role === 'admin' || decoded.role === 'staff') {
      userResult = await pool.query('SELECT id, username as email, full_name, role, avatar_url FROM admins WHERE id = $1', [decoded.id]);
    } else if (decoded.role === 'tutor') {
      userResult = await pool.query(`
        SELECT t.id, a.id as account_id, a.username, t.full_name, t.email, t.avatar_url, t.status 
        FROM tutors t 
        JOIN tutor_accounts a ON t.id = a.tutor_id 
        WHERE t.id = $1
      `, [decoded.id]);
    } else {
      userResult = await pool.query('SELECT id, email, full_name, phone_number, avatar_url FROM users WHERE id = $1', [decoded.id]);
    }

    const user = userResult.rows[0];
    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    if (decoded.role === 'tutor') {
      return { id: user.id, accountId: user.account_id, username: user.username, email: user.email, fullName: user.full_name, role: 'tutor', avatarUrl: user.avatar_url, status: user.status };
    } else {
      return { id: user.id, email: user.email, fullName: user.full_name, phoneNumber: user.phone_number, role: user.role || 'user', avatarUrl: user.avatar_url };
    }
  }

  async updateProfile(decoded, { fullName, phoneNumber }) {
    if (decoded.role === 'admin' || decoded.role === 'staff') {
      await pool.query('UPDATE admins SET full_name = $1 WHERE id = $2', [fullName, decoded.id]);
    } else {
      await pool.query('UPDATE users SET full_name = $1, phone_number = $2 WHERE id = $3', [fullName, phoneNumber, decoded.id]);
    }
    return true;
  }

  async updateAvatar(decoded, file) {
    const avatarUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

    if (decoded.role === 'admin' || decoded.role === 'staff') {
      await pool.query('UPDATE admins SET avatar_url = $1 WHERE id = $2', [avatarUrl, decoded.id]);
    } else if (decoded.role === 'tutor') {
      await pool.query('UPDATE tutors SET avatar_url = $1 WHERE id = $2', [avatarUrl, decoded.id]);
    } else {
      await pool.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [avatarUrl, decoded.id]);
    }

    return avatarUrl;
  }

  async changePassword(decoded, { currentPassword, newPassword }) {
    let userResult;
    if (decoded.role === 'admin' || decoded.role === 'staff') {
      userResult = await pool.query('SELECT * FROM admins WHERE id = $1', [decoded.id]);
    } else if (decoded.role === 'tutor') {
      userResult = await pool.query('SELECT * FROM tutor_accounts WHERE tutor_id = $1', [decoded.id]);
    } else {
      userResult = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
    }

    const user = userResult.rows[0];
    if (!user) {
      throw new ApiError(404, 'Người dùng không tồn tại');
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new ApiError(400, 'Mật khẩu hiện tại không chính xác');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    if (decoded.role === 'admin' || decoded.role === 'staff') {
      await pool.query('UPDATE admins SET password = $1 WHERE id = $2', [hashedPassword, decoded.id]);
    } else if (decoded.role === 'tutor') {
      await pool.query('UPDATE tutor_accounts SET password = $1 WHERE tutor_id = $2', [hashedPassword, decoded.id]);
    } else {
      await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, decoded.id]);
    }
    
    return true;
  }

  async forgotPassword(email) {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      throw new ApiError(404, 'Email không tồn tại trong hệ thống');
    }

    const otp = crypto.randomInt(100000, 999999).toString();
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
    return true;
  }

  async verifyOtp(email, otp) {
    const record = otpStore.get(email);

    if (!record) {
      throw new ApiError(400, 'Mã OTP không hợp lệ hoặc đã được sử dụng');
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(email);
      throw new ApiError(400, 'Mã OTP đã hết hạn, vui lòng yêu cầu mã mới');
    }

    if (record.otp !== otp) {
      throw new ApiError(400, 'Mã OTP không chính xác');
    }

    otpStore.set(email, { ...record, verified: true });
    return true;
  }

  async resetPassword(email, password) {
    const record = otpStore.get(email);
    if (!record?.verified) {
      throw new ApiError(400, 'Phiên đặt lại mật khẩu không hợp lệ');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password = $1 WHERE email = $2', [hashedPassword, email]);

    otpStore.delete(email);
    return true;
  }
}

export default new AuthService();
