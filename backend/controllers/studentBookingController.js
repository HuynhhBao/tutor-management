import bookingService from '../services/bookingService.js';
import { sendSuccess } from '../utils/response.js';

export const createBooking = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const data = await bookingService.createBooking(userId, req.body);
    return sendSuccess(res, 201, 'Đặt lịch thành công! Vui lòng chờ gia sư xác nhận.', { data });
  } catch (err) {
    next(err);
  }
};

export const getMyBookings = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status } = req.query;
    const data = await bookingService.getStudentBookings(userId, status);
    return sendSuccess(res, 200, 'Thành công', { data });
  } catch (err) {
    next(err);
  }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const message = await bookingService.cancelStudentBooking(userId, id);
    return sendSuccess(res, 200, message);
  } catch (err) {
    next(err);
  }
};

export const reportDispute = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { reason } = req.body;
    const message = await bookingService.reportDisputeStudent(userId, id, reason);
    return sendSuccess(res, 200, message);
  } catch (err) {
    next(err);
  }
};
