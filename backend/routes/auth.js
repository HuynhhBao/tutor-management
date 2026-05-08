import express from 'express';
import crypto from 'node:crypto';
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
import path from 'node:path';

const router = express.Router();

// Multer — upload Avatar
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + crypto.randomInt(0, 1e9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// --- Auth ---
router.post('/register', register);
router.post('/login', login);
router.post('/admin/login', adminLogin);
router.post('/login-tutor', tutorLogin);
router.get('/me', getMe);
router.put('/update-profile', updateProfile);
router.put('/update-avatar', upload.single('avatar'), updateAvatar);
router.put('/change-password', changePassword);
router.post('/logout', logout);

// --- Forgot Password ---
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

export default router;
