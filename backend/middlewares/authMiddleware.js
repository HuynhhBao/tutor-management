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
    console.error('Lỗi xác thực token (User):', err.message);
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
    console.error('Lỗi xác thực token (Admin):', err.message);
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
    console.error('Lỗi xác thực token (Tutor):', err.message);
    return next(new ApiError(401, 'Token không hợp lệ'));
  }
};

export const verifyAuth = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return next(new ApiError(401, 'Chưa đăng nhập'));

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('Lỗi xác thực token (Auth):', err.message);
    return next(new ApiError(401, 'Token không hợp lệ'));
  }
};
