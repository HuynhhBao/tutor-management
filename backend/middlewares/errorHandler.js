import { sendError } from '../utils/response.js';

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    console.error('🔥 [Error]:', err);
  }

  // Joi Validation Error
  if (err.isJoi) {
    return sendError(res, 400, err.details[0].message);
  }

  // Custom ApiError
  if (err.isOperational) {
    return sendError(res, err.statusCode, err.message);
  }

  // Programming or other unknown error
  return sendError(res, 500, 'Lỗi hệ thống nội bộ');
};

export default errorHandler;
