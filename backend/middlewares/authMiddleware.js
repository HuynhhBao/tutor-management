import jwt from 'jsonwebtoken';
import { ApiError } from '../utils/ApiError.js';

export const verifyUser = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return next(new ApiError(401, 'Chưa đăng nhập'));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'user') {
      return next(new ApiError(403, 'Chỉ học viên mới có thể thực hiện chức năng này'));
    }
    req.user = decoded;
    next();
  } catch (err) {
    return next(new ApiError(401, 'Token không hợp lệ'));
  }
};

export const verifyAdmin = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return next(new ApiError(401, 'Chưa đăng nhập'));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin' && decoded.role !== 'staff') {
      return next(new ApiError(403, 'Không có quyền truy cập'));
    }
    req.user = decoded;
    next();
  } catch (err) {
    return next(new ApiError(401, 'Token không hợp lệ'));
  }
};

export const verifyTutor = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return next(new ApiError(401, 'Chưa đăng nhập'));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'tutor') {
      return next(new ApiError(403, 'Chỉ gia sư mới có thể truy cập'));
    }
    req.user = decoded;
    next();
  } catch (err) {
    return next(new ApiError(401, 'Token không hợp lệ'));
  }
};
