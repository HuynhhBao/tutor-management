import express from 'express';
import { getAllBookings, getBookingStats, cancelBooking } from '../controllers/adminBookingController.js';
import { verifyAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verifyAdmin);

router.get('/', getAllBookings);
router.get('/stats', getBookingStats);
router.put('/:id/cancel', cancelBooking);

export default router;
