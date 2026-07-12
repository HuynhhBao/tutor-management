import tutorService from '../services/tutorService.js';
import { sendSuccess } from '../utils/response.js';

// GET /api/tutors/stats
export const getTutorStats = async (req, res, next) => {
  try {
    const data = await tutorService.getTutorStats();
    return sendSuccess(res, 200, 'Thành công', { data });
  } catch (err) {
    next(err);
  }
};

// GET /api/tutors
export const getAllTutors = async (req, res, next) => {
  try {
    const data = await tutorService.getAllTutors();
    return sendSuccess(res, 200, 'Thành công', { data });
  } catch (err) {
    next(err);
  }
};

// POST /api/tutors
export const createTutor = async (req, res, next) => {
  try {
    const data = await tutorService.createTutor(req.body);
    return sendSuccess(res, 201, 'Tạo gia sư thành công', { data });
  } catch (err) {
    next(err);
  }
};

// PUT /api/tutors/:id
export const updateTutor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await tutorService.updateTutor(id, req.body);
    return sendSuccess(res, 200, 'Cập nhật gia sư thành công', { data });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/tutors/:id
export const deleteTutor = async (req, res, next) => {
  try {
    const { id } = req.params;
    await tutorService.deleteTutor(id);
    return sendSuccess(res, 200, 'Xóa gia sư thành công');
  } catch (err) {
    next(err);
  }
};

// PUT /api/tutors/status
export const updateTutorStatus = async (req, res, next) => {
  try {
    const data = await tutorService.updateTutorStatus(req.body);
    return sendSuccess(res, 200, 'Cập nhật trạng thái thành công', { data });
  } catch (err) {
    next(err);
  }
};
