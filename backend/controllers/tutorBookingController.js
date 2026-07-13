import bookingService from '../services/bookingService.js';
import { sendSuccess } from '../utils/response.js';

export const getTutorBookings = async (req, res, next) => {
  try {
    const tutorId = req.user.id;
    const { status } = req.query;
    const data = await bookingService.getTutorBookings(tutorId, status);
    return sendSuccess(res, 200, 'Thành công', { data });
  } catch (err) {
    next(err);
  }
};

export const getTutorUnreadCount = async (req, res, next) => {
  try {
    const tutorId = req.user.id;
    const count = await bookingService.getTutorUnreadCount(tutorId);
    return sendSuccess(res, 200, 'Thành công', { count });
  } catch (err) {
    next(err);
  }
};

export const confirmBooking = async (req, res, next) => {
  try {
    const tutorId = req.user.id;
    const { id } = req.params;
    const message = await bookingService.confirmBookingAsTutor(tutorId, id);
    return sendSuccess(res, 200, message);
  } catch (err) {
    next(err);
  }
};

export const completeBooking = async (req, res, next) => {
  try {
    const tutorId = req.user.id;
    const { id } = req.params;
    const message = await bookingService.completeBookingAsTutor(tutorId, id);
    return sendSuccess(res, 200, message);
  } catch (err) {
    next(err);
  }
};
