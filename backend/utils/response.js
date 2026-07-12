/**
 * Send a success response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Success message
 * @param {Object} data - Data to send (optional)
 */
export const sendSuccess = (res, statusCode = 200, message = 'Thành công', data = null) => {
  const response = {
    status: 'ok',
    message,
  };
  
  if (data) {
    Object.assign(response, data);
  }

  return res.status(statusCode).json(response);
};

/**
 * Send an error response
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 */
export const sendError = (res, statusCode = 500, message = 'Lỗi hệ thống') => {
  return res.status(statusCode).json({
    status: 'error',
    message,
  });
};
