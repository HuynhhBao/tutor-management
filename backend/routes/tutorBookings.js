import express from 'express';
import { getTutorBookings, getTutorUnreadCount, confirmBooking, completeBooking } from '../controllers/tutorBookingController.js';
import { verifyTutor } from '../middlewares/authMiddleware.js';
import validate from '../middlewares/validate.js';
import { completeBookingParamsSchema } from '../validations/bookingValidation.js';

const router = express.Router();

router.use(verifyTutor);

router.get('/bookings', getTutorBookings);
router.get('/bookings/unread-count', getTutorUnreadCount);
router.put('/bookings/:id/confirm', confirmBooking);
router.put('/bookings/:id/complete', completeBooking);

export default router;
