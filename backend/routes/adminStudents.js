import express from 'express';
import { 
  getAllStudents, 
  getStudentById, 
  getStudentBookings, 
  toggleStudentStatus 
} from '../controllers/adminStudentController.js';
import { verifyAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verifyAdmin);

router.get('/', getAllStudents);
router.get('/:id', getStudentById);
router.get('/:id/bookings', getStudentBookings);
router.put('/:id/toggle-status', toggleStudentStatus);

export default router;
