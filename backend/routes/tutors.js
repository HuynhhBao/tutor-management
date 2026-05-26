import express from 'express';
import multer from 'multer';
import {
  getAllTutors,
  createTutor,
  updateTutor,
  deleteTutor,
  getTutorStats,
  updateTutorStatus,
} from '../controllers/tutorController.js';
import {
  sendApplyOtp,
  submitApplication,
  getApplications,
  getApplicationById,
  approveApplication,
  rejectApplication,
  grantAccount,
} from '../controllers/applicationController.js';

const router = express.Router();

// Multer — upload CV image
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// --- Tutor CRUD ---
router.get('/stats', getTutorStats);
router.get('/', getAllTutors);
router.post('/', createTutor);
router.put('/status', updateTutorStatus);
router.put('/:id', updateTutor);
router.delete('/:id', deleteTutor);

// --- Tutor Application ---
router.post('/apply/send-otp', sendApplyOtp);
router.post('/apply', upload.array('cvImage', 10), submitApplication);
router.get('/applications', getApplications);
router.get('/applications/:id', getApplicationById);
router.put('/applications/:id/approve', approveApplication);
router.delete('/applications/:id/reject', rejectApplication);

// --- Grant account ---
router.post('/:id/grant-account', grantAccount);

export default router;
