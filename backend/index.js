import express from 'express';
import cors from 'cors';
import pkg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Pool } = pkg;

const app = express();
const port = process.env.PORT || 3000;

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

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  const { email, username, password } = req.body;
  const identifier = email || username;

  try {
    let user = null;
    let role = 'user';

    if (identifier.includes('@')) {
      const result = await pool.query('SELECT * FROM users WHERE email = $1', [identifier]);
      user = result.rows[0];
    }

    if (!user) {
      const result = await pool.query('SELECT * FROM admins WHERE username = $1', [identifier]);
      user = result.rows[0];
      if (user) role = user.role;
    }

    if (!user) {
      return res.status(401).json({ status: 'error', message: 'Tài khoản không tồn tại' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ status: 'error', message: 'Mật khẩu không chính xác' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email || user.username, role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({ 
      status: 'ok', 
      user: { id: user.id, email: user.email || user.username, fullName: user.full_name, role } 
    });
  } catch (err) {
    console.error('Login error:', err);
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

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
