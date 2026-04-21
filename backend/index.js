import express from 'express';
import cors from 'cors';
import pkg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Pool } = pkg;

const app = express();
const port = process.env.PORT || 3000;

// In-memory OTP store: email -> { otp, expiresAt }
const otpStore = new Map();

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Set up Postgres pool
const poolConfig = {
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'tutor_management',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: 5432,
};

console.log('Connecting to database with config:', { ...poolConfig, password: '****' });
const pool = new Pool(poolConfig);

// Initialize database
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed default admin if not exists
    const adminCheck = await pool.query('SELECT * FROM admins WHERE username = $1', ['admin']);
    if (adminCheck.rows.length === 0) {
      const hashedAdminPassword = await bcrypt.hash('admin', 10);
      await pool.query(
        'INSERT INTO admins (username, full_name, password, role) VALUES ($1, $2, $3, $4)',
        ['admin', 'System Admin', hashedAdminPassword, 'admin']
      );
      console.log('Default admin account created: admin/admin');
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tutors (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(255) NOT NULL,
        gender VARCHAR(50),
        age INTEGER,
        subjects VARCHAR(255),
        qualification VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Đang chờ',
        rating DECIMAL(3,2) DEFAULT 0.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
};

initDb();

// --- Tutor Endpoints ---

// Get all tutors
app.get('/api/tutors', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tutors ORDER BY created_at DESC');
    res.json({ status: 'ok', data: result.rows });
  } catch (err) {
    console.error('Error fetching tutors:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server' });
  }
});

// Create new tutor
app.post('/api/tutors', async (req, res) => {
  const { fullName, gender, age, subject, qualification } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO tutors (full_name, gender, age, subjects, qualification) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [fullName, gender, age, subject, qualification]
    );
    res.status(201).json({ status: 'ok', data: result.rows[0] });
  } catch (err) {
    console.error('Error creating tutor:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server' });
  }
});

// Delete tutor
app.delete('/api/tutors/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tutors WHERE id = $1', [id]);
    res.json({ status: 'ok', message: 'Xóa gia sư thành công' });
  } catch (err) {
    console.error('Error deleting tutor:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server' });
  }
});

// Update tutor
app.put('/api/tutors/:id', async (req, res) => {
  const { id } = req.params;
  const { fullName, gender, age, subject, qualification } = req.body;
  try {
    const result = await pool.query(
      'UPDATE tutors SET full_name = $1, gender = $2, age = $3, subjects = $4, qualification = $5 WHERE id = $6 RETURNING *',
      [fullName, gender, age, subject, qualification, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy gia sư' });
    }
    res.json({ status: 'ok', data: result.rows[0] });
  } catch (err) {
    console.error('Error updating tutor:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server' });
  }
});

app.get('/', (req, res) => {
  res.send('Backend is running!');
});

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
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
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ status: 'error', message: 'Vui lòng nhập email và mật khẩu' });
  }

  try {
    // Chỉ tìm trong bảng users
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

    // Không set maxAge/expires → trở thành session cookie
    // Trình duyệt sẽ tự xóa cookie khi đóng (không còn lưu đăng nhập)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    res.json({ 
      status: 'ok', 
      user: { id: user.id, email: user.email, fullName: user.full_name, role: 'user' } 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server' });
  }
});

// Admin Login endpoint (chỉ dành cho admins - không cho user thường)
app.post('/api/auth/admin/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ status: 'error', message: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
  }

  try {
    // Chỉ tìm trong bảng admins
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

    // Session cookie - tự xóa khi đóng trình duyệt
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

// Get current user endpoint
app.get('/api/auth/me', async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ status: 'error', message: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    let userResult;
    if (decoded.role === 'admin' || decoded.role === 'staff') {
      userResult = await pool.query('SELECT id, username as email, full_name, role FROM admins WHERE id = $1', [decoded.id]);
    } else {
      userResult = await pool.query('SELECT id, email, full_name FROM users WHERE id = $1', [decoded.id]);
    }

    const user = userResult.rows[0];
    if (!user) {
      return res.status(401).json({ status: 'error', message: 'User not found' });
    }

    res.json({ 
      status: 'ok', 
      user: { id: user.id, email: user.email, fullName: user.full_name, role: user.role || 'user' } 
    });
  } catch (err) {
    res.status(401).json({ status: 'error', message: 'Invalid token' });
  }
});

// Logout endpoint
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ status: 'ok', message: 'Logged out successfully' });
});

app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', db_time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Could not connect to database' });
  }
});

// --- Forgot Password Endpoints ---

// Step 1: Send OTP to email
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ status: 'error', message: 'Vui lòng nhập email' });
  }

  try {
    // Check if email exists in users table
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Email không tồn tại trong hệ thống' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store OTP
    otpStore.set(email, { otp, expiresAt });

    // Send email
    await transporter.sendMail({
      from: `"GiaSuPro" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: '🔐 Mã OTP đặt lại mật khẩu - GiaSuPro',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: #f9fafb; border-radius: 12px;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #7c3aed; margin: 0; font-size: 28px;">🎓 GiaSuPro</h1>
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
          <p style="color: #cbd5e1; font-size: 12px; text-align: center; margin-top: 20px;">© 2025 GiaSuPro. All rights reserved.</p>
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
app.post('/api/auth/verify-otp', (req, res) => {
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

  // Mark OTP as verified (keep in store but mark verified)
  otpStore.set(email, { ...record, verified: true });

  res.json({ status: 'ok', message: 'Xác thực OTP thành công' });
});

// Step 3: Reset password
app.post('/api/auth/reset-password', async (req, res) => {
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

    // Clear OTP from store
    otpStore.delete(email);

    res.json({ status: 'ok', message: 'Đặt lại mật khẩu thành công' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
