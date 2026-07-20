import express from 'express';
import { createBooking, getMyBookings, cancelBooking, reportDispute } from '../controllers/studentBookingController.js';
import { verifyUser } from '../middlewares/authMiddleware.js';
import validate from '../middlewares/validate.js';
import { createBookingSchema } from '../validations/bookingValidation.js';

const router = express.Router();

router.use(verifyUser);

router.post('/', validate(createBookingSchema), createBooking);
router.get('/', getMyBookings);
router.put('/:id/cancel', cancelBooking);
router.put('/:id/dispute', reportDispute);

export default router;
