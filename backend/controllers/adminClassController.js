import adminClassService from '../services/adminClassService.js';
import { sendSuccess } from '../utils/response.js';

export const getAllClasses = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const result = await adminClassService.getAllClasses(status, search);
    return sendSuccess(res, 200, 'Thành công', { data: result.classes, stats: result.stats });
  } catch (err) {
    next(err);
  }
};

export const getClassById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await adminClassService.getClassById(id);
    return sendSuccess(res, 200, 'Thành công', { data });
  } catch (err) {
    next(err);
  }
};

export const updateClassStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, adminNote, isRefund } = req.body;
    const data = await adminClassService.updateClassStatus(id, status, adminNote, isRefund);
    return sendSuccess(res, 200, 'Cập nhật trạng thái lớp học thành công', { data });
  } catch (err) {
    next(err);
  }
};
