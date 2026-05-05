import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import transporter from '../utils/mailer.js';

const router = express.Router();

// In-memory OTP store: email -> { otp, expiresAt }
const otpStore = new Map();

// Register endpoint
router.post('/register', async (req, res) => {
  const { email, fullName, password } = req.body;

  if (!email.endsWith('@gmail.com')) {
    return res.status(400).json({ status: 'error', message: 'Email phải có định dạng @gmail.com' });
  }

  const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ status: 'error', message: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ in hoa và ký tự đặc biệt' });
  }

  try {
    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ status: 'error', message: 'Email đã được sử dụng' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (email, full_name, password) VALUES ($1, $2, $3)',
      [email, fullName, hashedPassword]
    );

    res.status(201).json({ status: 'ok', message: 'Đăng ký thành công' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server' });
  }
});

// Login endpoint (chỉ dành cho users - không cho admin)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ status: 'error', message: 'Vui lòng nhập email và mật khẩu' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ status: 'error', message: 'Tài khoản không tồn tại' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ status: 'error', message: 'Mật khẩu không chính xác' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    res.json({ 
      status: 'ok', 
      user: { id: user.id, email: user.email, fullName: user.full_name, phoneNumber: user.phone_number, role: 'user' } 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server' });
  }
});

// Admin Login endpoint
router.post('/admin/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ status: 'error', message: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
  }

  try {
    const result = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
    const admin = result.rows[0];

    if (!admin) {
      return res.status(401).json({ status: 'error', message: 'Tài khoản quản trị không tồn tại' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ status: 'error', message: 'Mật khẩu không chính xác' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.username, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    res.json({
      status: 'ok',
      user: { id: admin.id, email: admin.username, fullName: admin.full_name, role: admin.role }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server' });
  }
});

// Tutor Login endpoint
router.post('/login-tutor', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ status: 'error', message: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
  }

  try {
    const result = await pool.query(`
      SELECT a.*, t.full_name, t.email as tutor_email 
      FROM tutor_accounts a 
      JOIN tutors t ON a.tutor_id = t.id 
      WHERE a.username = $1
    `, [username]);
    
    const account = result.rows[0];

    if (!account) {
      return res.status(401).json({ status: 'error', message: 'Tài khoản gia sư không tồn tại' });
    }

    const isMatch = await bcrypt.compare(password, account.password);
    if (!isMatch) {
      return res.status(401).json({ status: 'error', message: 'Mật khẩu không chính xác' });
    }

    const token = jwt.sign(
      { id: account.tutor_id, accountId: account.id, username: account.username, role: 'tutor' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    res.json({
      status: 'ok',
      user: { id: account.tutor_id, accountId: account.id, username: account.username, fullName: account.full_name, email: account.tutor_email, role: 'tutor' }
    });
  } catch (err) {
    console.error('Tutor login error:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server' });
  }
});

// Get current user endpoint
router.get('/me', async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ status: 'error', message: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    let userResult;
    if (decoded.role === 'admin' || decoded.role === 'staff') {
      userResult = await pool.query('SELECT id, username as email, full_name, role FROM admins WHERE id = $1', [decoded.id]);
    } else if (decoded.role === 'tutor') {
      userResult = await pool.query(`
        SELECT t.id, a.id as account_id, a.username, t.full_name, t.email 
        FROM tutors t 
        JOIN tutor_accounts a ON t.id = a.tutor_id 
        WHERE t.id = $1
      `, [decoded.id]);
    } else {
      userResult = await pool.query('SELECT id, email, full_name, phone_number FROM users WHERE id = $1', [decoded.id]);
    }

    const user = userResult.rows[0];
    if (!user) {
      return res.status(401).json({ status: 'error', message: 'User not found' });
    }

    if (decoded.role === 'tutor') {
      res.json({ 
        status: 'ok', 
        user: { id: user.id, accountId: user.account_id, username: user.username, email: user.email, fullName: user.full_name, role: 'tutor' } 
      });
    } else {
      res.json({ 
        status: 'ok', 
        user: { id: user.id, email: user.email, fullName: user.full_name, phoneNumber: user.phone_number, role: user.role || 'user' } 
      });
    }
  } catch (err) {
    res.status(401).json({ status: 'error', message: 'Invalid token' });
  }
});

// Update profile endpoint
router.put('/update-profile', async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ status: 'error', message: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { fullName, phoneNumber } = req.body;

    if (!fullName) {
      return res.status(400).json({ status: 'error', message: 'Họ tên không được để trống' });
    }

    if (decoded.role === 'admin' || decoded.role === 'staff') {
      await pool.query('UPDATE admins SET full_name = $1 WHERE id = $2', [fullName, decoded.id]);
    } else {
      await pool.query('UPDATE users SET full_name = $1, phone_number = $2 WHERE id = $3', [fullName, phoneNumber, decoded.id]);
    }

    res.json({ status: 'ok', message: 'Cập nhật hồ sơ thành công' });
  } catch (err) {
    res.status(401).json({ status: 'error', message: 'Token không hợp lệ' });
  }
});

// Change password endpoint
router.put('/change-password', async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ status: 'error', message: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { currentPassword, newPassword } = req.body;

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
      return res.status(404).json({ status: 'error', message: 'Người dùng không tồn tại' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ status: 'error', message: 'Mật khẩu hiện tại không chính xác' });
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ status: 'error', message: 'Mật khẩu mới phải có ít nhất 8 ký tự, bao gồm chữ in hoa và ký tự đặc biệt' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    if (decoded.role === 'admin' || decoded.role === 'staff') {
      await pool.query('UPDATE admins SET password = $1 WHERE id = $2', [hashedPassword, decoded.id]);
    } else if (decoded.role === 'tutor') {
      await pool.query('UPDATE tutor_accounts SET password = $1 WHERE tutor_id = $2', [hashedPassword, decoded.id]);
    } else {
      await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, decoded.id]);
    }

    res.json({ status: 'ok', message: 'Đổi mật khẩu thành công' });
  } catch (err) {
    res.status(401).json({ status: 'error', message: 'Token không hợp lệ' });
  }
});

// Logout endpoint
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ status: 'ok', message: 'Logged out successfully' });
});

// --- Forgot Password Endpoints ---

// Step 1: Send OTP to email
router.post('/forgot-password', async (req, res) => {
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
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes validity

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
});

// Step 2: Verify OTP
router.post('/verify-otp', (req, res) => {
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
});

// Step 3: Reset password
router.post('/reset-password', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ status: 'error', message: 'Thiếu thông tin' });
  }

  const record = otpStore.get(email);
  if (!record || !record.verified) {
    return res.status(400).json({ status: 'error', message: 'Phiên đặt lại mật khẩu không hợp lệ' });
  }

  const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ status: 'error', message: 'Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ in hoa và ký tự đặc biệt' });
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
});

export default router;
