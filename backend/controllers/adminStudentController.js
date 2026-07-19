import adminStudentService from '../services/adminStudentService.js';
import { sendSuccess } from '../utils/response.js';

export const getAllStudents = async (req, res, next) => {
  try {
    const { search } = req.query;
    const students = await adminStudentService.getAllStudents(search);
    return sendSuccess(res, 200, 'Lấy danh sách học viên thành công', { students });
  } catch (err) {
    next(err);
  }
};

export const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student = await adminStudentService.getStudentById(id);
    return sendSuccess(res, 200, 'Lấy thông tin học viên thành công', { student });
  } catch (err) {
    next(err);
  }
};

export const getStudentBookings = async (req, res, next) => {
  try {
    const { id } = req.params;
    const bookings = await adminStudentService.getStudentBookings(id);
    return sendSuccess(res, 200, 'Lấy lịch sử đặt lịch thành công', { bookings });
  } catch (err) {
    next(err);
  }
};

export const toggleStudentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updatedStudent = await adminStudentService.toggleStudentStatus(id);
    const message = updatedStudent.is_active 
      ? 'Đã mở khóa tài khoản học viên' 
      : 'Đã khóa tài khoản học viên';
    return sendSuccess(res, 200, message, { student: updatedStudent });
  } catch (err) {
    next(err);
  }
};
