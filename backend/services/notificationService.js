import pool from '../config/db.js';
import { getIo, getOnlineUsers } from '../utils/socketManager.js';

class NotificationService {
    async sendNotification(userId, role, title, message) {
        try {
            // 1. Lưu DB
            await pool.query(
                `INSERT INTO notifications (user_id, user_type, title, message) VALUES ($1, $2, $3, $4)`, 
                [userId, role, title, message]
            );

            // 2. Bắn Socket nếu user đang online
            const socketId = getOnlineUsers()?.get(`${role}_${userId}`);
            const io = getIo();
            if (socketId && io) {
                io.to(socketId).emit('new_notification', { title, message });
            }
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }
}
export default new NotificationService();
