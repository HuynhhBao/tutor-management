import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import configs and routes
import pool, { initDb } from './config/db.js';
import authRoutes from './routes/auth.js';
import tutorRoutes from './routes/tutors.js';
import adminBookingsRoutes from './routes/adminBookings.js';
import studentBookingsRoutes from './routes/studentBookings.js';
import tutorBookingsRoutes from './routes/tutorBookings.js';
import walletRoutes from './routes/wallet.js';
import chatRoutes from './routes/chatRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Initialize database
initDb();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/admin/bookings', adminBookingsRoutes);
app.use('/api/student/bookings', studentBookingsRoutes);
app.use('/api/tutor', tutorBookingsRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/chat', chatRoutes);

app.get('/', (req, res) => {
  res.send('Backend is running!');
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
