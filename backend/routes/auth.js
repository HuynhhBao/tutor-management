import express from 'express';
import {
  register,
  login,
  adminLogin,
  tutorLogin,
  getMe,
  updateProfile,
  updateAvatar,
  changePassword,
  logout,
} from '../controllers/authController.js';
import {
  forgotPassword,
  verifyOtp,
  resetPassword,
} from '../controllers/forgotPasswordController.js';
import multer from 'multer';

// Middlewares
import validate from '../middlewares/validate.js';
import {
  registerSchema,
  loginSchema,
  adminLoginSchema,
  tutorLoginSchema,
  updateProfileSchema,
  changePasswordSchema
} from '../validations/authValidation.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Strict Rate Limiter for Auth endpoints: Max 5 requests per minute
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5,
  message: { status: 'error', message: 'Vượt quá giới hạn đăng nhập/đăng ký. Vui lòng đợi 1 phút.' }
});

// Multer — upload Avatar
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// --- Auth ---
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/admin/login', authLimiter, validate(adminLoginSchema), adminLogin);
router.post('/login-tutor', authLimiter, validate(tutorLoginSchema), tutorLogin);
router.get('/me', getMe);
router.put('/update-profile', validate(updateProfileSchema), updateProfile);
router.put('/update-avatar', upload.single('avatar'), updateAvatar);
router.put('/change-password', validate(changePasswordSchema), changePassword);
router.post('/logout', logout);

// --- Forgot Password ---
router.post('/forgot-password', authLimiter, forgotPassword);
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/reset-password', authLimiter, resetPassword);

export default router;
