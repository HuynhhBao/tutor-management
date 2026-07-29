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

  // PostgreSQL Invalid Input Syntax / CastError (e.g., malformed ID injection)
  if (err.code === '22P02' || err.name === 'CastError' || err.name === 'ValidationError' || (err.message && err.message.includes('invalid input syntax'))) {
    return sendError(res, 400, 'Dữ liệu đầu vào hoặc định dạng ID không hợp lệ');
  }

  // PostgreSQL Duplicate Key / Unique constraint violation
  if (err.code === '23505') {
    return sendError(res, 409, 'Dữ liệu đã tồn tại hoặc xung đột dữ liệu trong hệ thống');
  }

  // JSON Syntax Error (Malformed JSON payload from attackers)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return sendError(res, 400, 'Cú pháp JSON trong body không hợp lệ');
  }

  // Programming or other unknown error
  return sendError(res, 500, 'Lỗi hệ thống nội bộ');
};

export default errorHandler;
