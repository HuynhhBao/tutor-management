import express from 'express';
import {
  register,
  login,
  adminLogin,
  tutorLogin,
  getMe,
  updateProfile,
  changePassword,
  logout,
} from '../controllers/authController.js';
import {
  forgotPassword,
  verifyOtp,
  resetPassword,
} from '../controllers/forgotPasswordController.js';

const router = express.Router();

// --- Auth ---
router.post('/register', register);
router.post('/login', login);
router.post('/admin/login', adminLogin);
router.post('/login-tutor', tutorLogin);
router.get('/me', getMe);
router.put('/update-profile', updateProfile);
router.put('/change-password', changePassword);
router.post('/logout', logout);

// --- Forgot Password ---
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

export default router;
