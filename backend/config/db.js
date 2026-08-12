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

    // Ensure is_active column exists for ban/unban user
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_active') THEN
          ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='current_grade') THEN
          ALTER TABLE users ADD COLUMN current_grade VARCHAR(50) DEFAULT '';
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

    // Ensure email and finance columns exist if table was already created
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tutors' AND column_name='email') THEN
          ALTER TABLE tutors ADD COLUMN email VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tutors' AND column_name='grade_levels') THEN
          ALTER TABLE tutors ADD COLUMN grade_levels VARCHAR(255) DEFAULT '';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tutors' AND column_name='balance') THEN
          ALTER TABLE tutors ADD COLUMN balance DECIMAL(12,2) DEFAULT 0.0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tutors' AND column_name='bank_name') THEN
          ALTER TABLE tutors ADD COLUMN bank_name VARCHAR(100);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tutors' AND column_name='bank_account_number') THEN
          ALTER TABLE tutors ADD COLUMN bank_account_number VARCHAR(50);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tutors' AND column_name='bank_account_holder') THEN
          ALTER TABLE tutors ADD COLUMN bank_account_holder VARCHAR(255);
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tutors' AND column_name='hourly_rate') THEN
          ALTER TABLE tutors ADD COLUMN hourly_rate INTEGER DEFAULT 200000;
        END IF;
      END
      $$;
    `);

    // Ensure pgvector extension and profile_embedding column in tutors table
    try {
      await pool.query('CREATE EXTENSION IF NOT EXISTS vector;');
      await pool.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tutors' AND column_name='profile_embedding') THEN
            ALTER TABLE tutors ADD COLUMN profile_embedding vector(768);
          END IF;
        END
        $$;
      `);
    } catch (vectorErr) {
      console.log('pgvector extension not available, falling back to text storage for profile_embedding:', vectorErr.message);
      await pool.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tutors' AND column_name='profile_embedding') THEN
            ALTER TABLE tutors ADD COLUMN profile_embedding TEXT;
          END IF;
        END
        $$;
      `);
    }

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

    // Tạo bảng wallets
    await pool.query(`
      CREATE TABLE IF NOT EXISTS wallets (
        id SERIAL PRIMARY KEY,
        owner_id INTEGER NOT NULL,
        owner_type VARCHAR(50) NOT NULL,
        balance BIGINT DEFAULT 0 CHECK (balance >= 0),
        currency VARCHAR(10) DEFAULT 'VND',
        status VARCHAR(50) DEFAULT 'ACTIVE',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(owner_id, owner_type)
      )
    `);

    // Tự động tạo ví cho users và tutors hiện có
    await pool.query(`
      INSERT INTO wallets (owner_id, owner_type, balance)
      SELECT id, 'user', COALESCE(balance, 0) FROM users
      ON CONFLICT (owner_id, owner_type) DO NOTHING;
    `);

    await pool.query(`
      INSERT INTO wallets (owner_id, owner_type, balance)
      SELECT id, 'tutor', COALESCE(balance, 0) FROM tutors
      ON CONFLICT (owner_id, owner_type) DO NOTHING;
    `);

    // Rename old transactions table if it exists and doesn't have wallet_id
    await pool.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transactions' AND column_name='user_id') THEN
          ALTER TABLE transactions RENAME TO legacy_transactions;
        END IF;
      END
      $$;
    `);

    // Tạo bảng transactions mới cho ví
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        wallet_id INTEGER REFERENCES wallets(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL,
        amount BIGINT NOT NULL,
        balance_after BIGINT NOT NULL,
        status VARCHAR(50) DEFAULT 'PENDING',
        payment_method VARCHAR(50) DEFAULT 'SYSTEM',
        reference_id VARCHAR(255),
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
        admin_note TEXT,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure admin_note column exists if bookings table was already created
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='admin_note') THEN
          ALTER TABLE bookings ADD COLUMN admin_note TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='total_fee') THEN
          ALTER TABLE bookings ADD COLUMN total_fee DECIMAL(12,2) DEFAULT 100000.0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='duration') THEN
          ALTER TABLE bookings ADD COLUMN duration DECIMAL(3,1) DEFAULT 1.0;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='recurring_days') THEN
          ALTER TABLE bookings ADD COLUMN recurring_days VARCHAR(255) DEFAULT '';
        END IF;
      END
      $$;
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

    // Tạo bảng classroom_messages để lưu trữ vĩnh viễn tài liệu và tin nhắn trong phòng học trực tuyến
    await pool.query(`
      CREATE TABLE IF NOT EXISTS classroom_messages (
        id SERIAL PRIMARY KEY,
        booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
        sender_id INTEGER NOT NULL,
        sender_name VARCHAR(255) NOT NULL,
        sender_role VARCHAR(20) NOT NULL,
        content TEXT,
        file_url TEXT,
        file_name VARCHAR(255),
        file_size INTEGER,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);


    // Migration: Thêm cột canvas_snapshot vào bảng bookings để lưu nội dung bảng vẽ
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='canvas_snapshot') THEN
          ALTER TABLE bookings ADD COLUMN canvas_snapshot TEXT;
        END IF;
      END
      $$;
    `);

    // Tạo bảng ai_chat_messages nếu chưa có
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_chat_messages (
        id SERIAL PRIMARY KEY,

        user_id INTEGER NOT NULL,
        sender VARCHAR(20) NOT NULL, -- 'user' hoặc 'ai'
        message TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tạo bảng system_settings nếu chưa có
    await pool.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT NOT NULL,
        description TEXT,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed default commission rate if not exists
    await pool.query(`
      INSERT INTO system_settings (key, value, description)
      VALUES ('commission_rate', '15', 'Tỷ lệ hoa hồng hệ thống (%)')
      ON CONFLICT (key) DO NOTHING
    `);

    // Tạo bảng payout_requests nếu chưa có
    await pool.query(`
      CREATE TABLE IF NOT EXISTS payout_requests (
        id SERIAL PRIMARY KEY,
        tutor_id INTEGER REFERENCES tutors(id) ON DELETE CASCADE,
        amount DECIMAL(12,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        bank_snapshot JSONB,
        admin_note TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        processed_at TIMESTAMPTZ
      )
    `);

    // Migration: Chuyển đổi tất cả các cột TIMESTAMP sang TIMESTAMPTZ để đồng bộ múi giờ
    const tablesWithTimestamp = [
      'users', 'admins', 'tutors', 'tutor_applications', 
      'tutor_accounts', 'transactions', 'bookings', 
      'notifications', 'messages', 'ai_chat_messages', 'classroom_messages', 'payout_requests'
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
