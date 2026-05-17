import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';

// POST /api/auth/register
export const register = async (req, res) => {
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
};

// POST /api/auth/login  (chỉ dành cho users - không cho admin)
export const login = async (req, res) => {
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
      user: { id: user.id, email: user.email, fullName: user.full_name, phoneNumber: user.phone_number, role: 'user', avatarUrl: user.avatar_url }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server' });
  }
};

// POST /api/auth/admin/login
export const adminLogin = async (req, res) => {
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
      user: { id: admin.id, email: admin.username, fullName: admin.full_name, role: admin.role, avatarUrl: admin.avatar_url }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server' });
  }
};

// POST /api/auth/login-tutor
export const tutorLogin = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ status: 'error', message: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
  }

  try {
    const result = await pool.query(`
      SELECT a.*, t.full_name, t.email as tutor_email, t.avatar_url, t.status 
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
    });
  } catch (err) {
    console.error('Tutor login error:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server' });
  }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ status: 'error', message: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

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
      return res.status(401).json({ status: 'error', message: 'User not found' });
    }

    if (decoded.role === 'tutor') {
      res.json({
        status: 'ok',
        user: { id: user.id, accountId: user.account_id, username: user.username, email: user.email, fullName: user.full_name, role: 'tutor', avatarUrl: user.avatar_url, status: user.status }
      });
    } else {
      res.json({
        status: 'ok',
        user: { id: user.id, email: user.email, fullName: user.full_name, phoneNumber: user.phone_number, role: user.role || 'user', avatarUrl: user.avatar_url }
      });
    }
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(401).json({ status: 'error', message: 'Invalid token' });
  }
};

// PUT /api/auth/update-profile
export const updateProfile = async (req, res) => {
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
    console.error('Update profile error:', err);
    res.status(401).json({ status: 'error', message: 'Token không hợp lệ' });
  }
};

// PUT /api/auth/update-avatar
export const updateAvatar = async (req, res) => {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ status: 'error', message: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const avatarUrl = req.file ? `/uploads/${req.file.filename}` : null;

    if (!avatarUrl) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng chọn ảnh' });
    }

    if (decoded.role === 'admin' || decoded.role === 'staff') {
      await pool.query('UPDATE admins SET avatar_url = $1 WHERE id = $2', [avatarUrl, decoded.id]);
    } else if (decoded.role === 'tutor') {
      await pool.query('UPDATE tutors SET avatar_url = $1 WHERE id = $2', [avatarUrl, decoded.id]);
    } else {
      await pool.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [avatarUrl, decoded.id]);
    }

    res.json({ status: 'ok', message: 'Cập nhật ảnh đại diện thành công', avatarUrl });
  } catch (err) {
    console.error('Update avatar error:', err);
    res.status(401).json({ status: 'error', message: 'Token không hợp lệ' });
  }
};

// PUT /api/auth/change-password
export const changePassword = async (req, res) => {
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
    console.error('Change password error:', err);
    res.status(401).json({ status: 'error', message: 'Token không hợp lệ' });
  }
};

// POST /api/auth/logout
export const logout = (req, res) => {
  res.clearCookie('token');
  res.json({ status: 'ok', message: 'Logged out successfully' });
};
