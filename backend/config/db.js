import pkg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tutor_applications (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        cv_image_url VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('Database initialized successfully');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
};

export default pool;
