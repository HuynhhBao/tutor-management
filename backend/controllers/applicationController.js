import applicationService from '../services/applicationService.js';
import { sendSuccess } from '../utils/response.js';
import { ApiError } from '../utils/ApiError.js';

export const sendApplyOtp = async (req, res, next) => {
  try {
    const { email } = req.body;
    await applicationService.sendApplyOtp(email);
    return sendSuccess(res, 200, 'Mã OTP đã được gửi đến email của bạn');
  } catch (err) {
    next(err);
  }
};

export const submitApplication = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const cvFiles = req.files;

    if (!email || !cvFiles || cvFiles.length === 0) {
      throw new ApiError(400, 'Vui lòng cung cấp email và ít nhất một hình ảnh CV');
    }
    if (!email.endsWith('@gmail.com')) {
      throw new ApiError(400, 'Chỉ chấp nhận email @gmail.com');
    }
    if (!otp) {
      throw new ApiError(400, 'Vui lòng nhập mã xác nhận');
    }

    const data = await applicationService.submitApplication(email, otp, cvFiles);
    return sendSuccess(res, 201, 'Nộp hồ sơ ứng tuyển thành công', { data });
  } catch (err) {
    next(err);
  }
};

export const getApplications = async (req, res, next) => {
  try {
    const data = await applicationService.getApplications();
    return sendSuccess(res, 200, 'Thành công', { data });
  } catch (err) {
    next(err);
  }
};

export const getApplicationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await applicationService.getApplicationById(id);
    return sendSuccess(res, 200, 'Thành công', { data });
  } catch (err) {
    next(err);
  }
};

export const approveApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = await applicationService.approveApplication(id, req.body);
    return sendSuccess(res, 200, 'Đã duyệt hồ sơ và gửi email thông báo', { data });
  } catch (err) {
    next(err);
  }
};

export const rejectApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    await applicationService.rejectApplication(id);
    return sendSuccess(res, 200, 'Đã từ chối, gửi email và xóa hồ sơ');
  } catch (err) {
    next(err);
  }
};

export const grantAccount = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { username } = req.body;
    await applicationService.grantAccount(id, username);
    return sendSuccess(res, 201, 'Đã tạo tài khoản và gửi email thành công');
  } catch (err) {
    next(err);
  }
};
