import jwt from 'jsonwebtoken';
import authService from '../services/authService.js';
import { sendSuccess } from '../utils/response.js';
import { ApiError } from '../utils/ApiError.js';

export const register = async (req, res, next) => {
  try {
    await authService.registerUser(req.body);
    return sendSuccess(res, 201, 'Đăng ký thành công');
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const data = await authService.loginUser(req.body);
    
    res.cookie('token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return sendSuccess(res, 200, 'Đăng nhập thành công', { user: data.user });
  } catch (err) {
    next(err);
  }
};

export const adminLogin = async (req, res, next) => {
  try {
    const data = await authService.adminLogin(req.body);
    
    res.cookie('token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return sendSuccess(res, 200, 'Đăng nhập admin thành công', { user: data.user });
  } catch (err) {
    next(err);
  }
};

export const tutorLogin = async (req, res, next) => {
  try {
    const data = await authService.tutorLogin(req.body);
    
    res.cookie('token', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return sendSuccess(res, 200, 'Đăng nhập gia sư thành công', { user: data.user });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      throw new ApiError(401, 'Not authenticated');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await authService.getUserProfile(decoded);

    return sendSuccess(res, 200, 'Thành công', { user });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Token không hợp lệ hoặc đã hết hạn'));
    }
    next(err);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      throw new ApiError(401, 'Not authenticated');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await authService.updateProfile(decoded, req.body);

    return sendSuccess(res, 200, 'Cập nhật hồ sơ thành công');
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Token không hợp lệ hoặc đã hết hạn'));
    }
    next(err);
  }
};

export const updateAvatar = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      throw new ApiError(401, 'Not authenticated');
    }

    if (!req.file) {
      throw new ApiError(400, 'Vui lòng chọn ảnh');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const avatarUrl = await authService.updateAvatar(decoded, req.file);

    return sendSuccess(res, 200, 'Cập nhật ảnh đại diện thành công', { avatarUrl });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Token không hợp lệ hoặc đã hết hạn'));
    }
    next(err);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      throw new ApiError(401, 'Not authenticated');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    await authService.changePassword(decoded, req.body);

    return sendSuccess(res, 200, 'Đổi mật khẩu thành công');
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return next(new ApiError(401, 'Token không hợp lệ hoặc đã hết hạn'));
    }
    next(err);
  }
};

export const logout = (req, res) => {
  res.clearCookie('token');
  return sendSuccess(res, 200, 'Logged out successfully');
};
