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

// Middlewares
import validate from '../middlewares/validate.js';
import { checkCache } from '../middlewares/cacheMiddleware.js';
import {
  createTutorSchema,
  updateTutorSchema,
  updateTutorStatusSchema
} from '../validations/tutorValidation.js';
import {
  sendApplyOtpSchema,
  approveApplicationSchema,
  grantAccountSchema
} from '../validations/applicationValidation.js';

const router = express.Router();

// Multer — upload CV image
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit to prevent Denial of Service (SonarQube S5693)
});


// --- Tutor CRUD ---
router.get('/stats', getTutorStats);
router.get('/', checkCache, getAllTutors);
router.post('/', validate(createTutorSchema), createTutor);
router.put('/status', validate(updateTutorStatusSchema), updateTutorStatus);
router.put('/:id', validate(updateTutorSchema), updateTutor);
router.delete('/:id', deleteTutor);

// --- Tutor Application ---
router.post('/apply/send-otp', validate(sendApplyOtpSchema), sendApplyOtp);
router.post('/apply', upload.array('cvImage', 10), submitApplication);
router.get('/applications', getApplications);
router.get('/applications/:id', getApplicationById);
router.put('/applications/:id/approve', validate(approveApplicationSchema), approveApplication);
router.delete('/applications/:id/reject', rejectApplication);

// --- Grant account ---
router.post('/:id/grant-account', validate(grantAccountSchema), grantAccount);

export default router;
