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

const router = express.Router();

// Multer — upload Avatar
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// --- Auth ---
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/admin/login', validate(adminLoginSchema), adminLogin);
router.post('/login-tutor', validate(tutorLoginSchema), tutorLogin);
router.get('/me', getMe);
router.put('/update-profile', validate(updateProfileSchema), updateProfile);
router.put('/update-avatar', upload.single('avatar'), updateAvatar);
router.put('/change-password', validate(changePasswordSchema), changePassword);
router.post('/logout', logout);

// --- Forgot Password ---
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);

export default router;
