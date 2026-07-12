import bookingService from '../services/bookingService.js';
import { sendSuccess } from '../utils/response.js';

export const getAllBookings = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const data = await bookingService.getAllBookings(status, search);
    return sendSuccess(res, 200, 'Thành công', { data });
  } catch (err) {
    next(err);
  }
};

export const getBookingStats = async (req, res, next) => {
  try {
    const data = await bookingService.getBookingStats();
    return sendSuccess(res, 200, 'Thành công', { data });
  } catch (err) {
    next(err);
  }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const message = await bookingService.cancelBookingAsAdmin(id);
    return sendSuccess(res, 200, message);
  } catch (err) {
    next(err);
  }
};
