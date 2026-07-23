import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// Import configs and routes
import pool, { initDb } from './config/db.js';
import authRoutes from './routes/auth.js';
import tutorRoutes from './routes/tutors.js';
import adminStudentsRoutes from './routes/adminStudents.js';
import adminBookingsRoutes from './routes/adminBookings.js';
import adminClassesRoutes from './routes/adminClasses.js';
import adminFinanceRoutes from './routes/adminFinance.js';
import studentBookingsRoutes from './routes/studentBookings.js';
import tutorBookingsRoutes from './routes/tutorBookings.js';
import walletRoutes from './routes/wallet.js';
import chatRoutes from './routes/chatRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import errorHandler from './middlewares/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Secure HTTP headers

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Global Rate Limiter: Max 1000 requests per 15 minutes per IP (disabled in dev)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  skip: () => process.env.NODE_ENV !== 'production',
  message: { status: 'error', message: 'Quá nhiều yêu cầu từ IP này, vui lòng thử lại sau 15 phút' }
});
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));
app.use(cookieParser());
import http from 'http';
import { initSocket } from './utils/socketManager.js';
import classSessionRoutes from './routes/classSessionRoutes.js';

// Setup static folders
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
// Đảm bảo uploads/classroom/ tĩnh có thể truy cập được
app.use('/uploads/classroom', express.static(path.join(__dirname, 'uploads/classroom')));

// Initialize database
initDb();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tutors', tutorRoutes);
app.use('/api/admin/students', adminStudentsRoutes);
app.use('/api/admin/bookings', adminBookingsRoutes);
app.use('/api/admin/classes', adminClassesRoutes);
app.use('/api/admin/finance', adminFinanceRoutes);
app.use('/api/student/bookings', studentBookingsRoutes);
app.use('/api/tutor', tutorBookingsRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/ai-chat', aiRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/class-session', classSessionRoutes);


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

// Global Error Handler
app.use(errorHandler);

// Wrap Express App with HTTP Server to attach Socket.io
const server = http.createServer(app);
initSocket(server);

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

