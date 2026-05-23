import pkg from 'pg';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Pool } = pkg;

const poolConfig = {
  user: process.env.POSTGRES_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.POSTGRES_DB || 'tutor_management',
  password: process.env.POSTGRES_PASSWORD || 'password',
  port: 5432,
};

console.log('Connecting to database with config:', { ...poolConfig, password: '****' });
const pool = new Pool(poolConfig);

export const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        phone_number VARCHAR(20),
        password VARCHAR(255) NOT NULL,
        balance DECIMAL(12,2) DEFAULT 0.0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure phone_number column exists if table was already created
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='phone_number') THEN
          ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);
        END IF;
      END
      $$;
    `);

    // Ensure balance column exists if table was already created
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='balance') THEN
          ALTER TABLE users ADD COLUMN balance DECIMAL(12,2) DEFAULT 0.0;
        END IF;
      END
      $$;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
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
        email VARCHAR(255),
        gender VARCHAR(50),
        age INTEGER,
        subjects VARCHAR(255),
        qualification VARCHAR(255),
        status VARCHAR(50) DEFAULT 'Đang chờ',
        rating DECIMAL(3,2) DEFAULT 0.0,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure email column exists if table was already created
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tutors' AND column_name='email') THEN
          ALTER TABLE tutors ADD COLUMN email VARCHAR(255);
        END IF;
      END
      $$;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tutor_applications (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        cv_image_url TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure cv_image_url is TEXT type to store multiple image URLs without length limits
    await pool.query(`
      ALTER TABLE tutor_applications ALTER COLUMN cv_image_url TYPE TEXT;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tutor_accounts (
        id SERIAL PRIMARY KEY,
        tutor_id INTEGER REFERENCES tutors(id) ON DELETE CASCADE,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure avatar_url column exists in all relevant tables
    const tablesToUpdate = ['users', 'admins', 'tutors'];
    for (const table of tablesToUpdate) {
      await pool.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='${table}' AND column_name='avatar_url') THEN
            EXECUTE 'ALTER TABLE ${table} ADD COLUMN avatar_url VARCHAR(255)';
          END IF;
        END
        $$;
      `);
    }

    // Tạo bảng transactions nếu chưa có
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        user_type VARCHAR(20) NOT NULL,
        amount DECIMAL(12,2) NOT NULL,
        type VARCHAR(50) NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tạo bảng bookings nếu chưa có
    await pool.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        tutor_id INTEGER REFERENCES tutors(id) ON DELETE CASCADE,
        subject VARCHAR(255),
        schedule_time VARCHAR(255),
        message TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tạo bảng notifications nếu chưa có
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        user_type VARCHAR(20) NOT NULL, -- 'user' hoặc 'tutor'
        title VARCHAR(255) NOT NULL,
        message TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tạo bảng messages nếu chưa có
    await pool.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER NOT NULL,
        sender_type VARCHAR(20) NOT NULL, -- 'user' hoặc 'tutor'
        receiver_id INTEGER NOT NULL,
        receiver_type VARCHAR(20) NOT NULL, -- 'user' hoặc 'tutor'
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Migration: Chuyển đổi tất cả các cột TIMESTAMP sang TIMESTAMPTZ để đồng bộ múi giờ
    const tablesWithTimestamp = [
      'users', 'admins', 'tutors', 'tutor_applications', 
      'tutor_accounts', 'transactions', 'bookings', 
      'notifications', 'messages'
    ];
    
    for (const table of tablesWithTimestamp) {
      await pool.query(`
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name='${table}' AND column_name='created_at' 
            AND data_type='timestamp without time zone'
          ) THEN
            EXECUTE 'ALTER TABLE ${table} ALTER COLUMN created_at TYPE TIMESTAMPTZ';
          END IF;
        END
        $$;
      `);
    }

    console.log('Database initialized successfully with TIMESTAMPTZ');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
};

export default pool;
