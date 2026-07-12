import express from 'express';
import { getTutorBookings, getTutorUnreadCount, confirmBooking } from '../controllers/tutorBookingController.js';
import { verifyTutor } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.use(verifyTutor);

router.get('/bookings', getTutorBookings);
router.get('/bookings/unread-count', getTutorUnreadCount);
router.put('/bookings/:id/confirm', confirmBooking);

export default router;
