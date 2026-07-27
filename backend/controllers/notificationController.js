import notificationService from '../services/notificationService.js';
import { sendSuccess } from '../utils/response.js';

export const getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const data = await notificationService.getNotificationsByUser(userId, role);
    return sendSuccess(res, 200, 'Lấy danh sách thông báo thành công', { data });
  } catch (err) {
    next(err);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const data = await notificationService.markNotificationRead(id, userId);
    return sendSuccess(res, 200, 'Đã đánh dấu đọc thông báo', { data });
  } catch (err) {
    next(err);
  }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await notificationService.markAllNotificationsRead(userId);
    return sendSuccess(res, 200, 'Đã đánh dấu đọc tất cả thông báo');
  } catch (err) {
    next(err);
  }
};
