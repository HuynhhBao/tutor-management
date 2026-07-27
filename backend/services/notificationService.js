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

    async getNotificationsByUser(userId, role) {
        let typeParam = role;
        if (role === 'student' || role === 'user') typeParam = 'user';
        if (role === 'admin' || role === 'staff') typeParam = 'admin';

        const res = await pool.query(
            `SELECT * FROM notifications 
             WHERE user_id = $1 AND (user_type = $2 OR user_type = 'all' OR ($2 = 'admin' AND user_type IN ('admin', 'staff')))
             ORDER BY created_at DESC LIMIT 30`,
            [userId, typeParam]
        );
        return res.rows;
    }

    async markNotificationRead(id, userId) {
        const res = await pool.query(
            `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *`,
            [id, userId]
        );
        return res.rows[0];
    }

    async markAllNotificationsRead(userId) {
        await pool.query(
            `UPDATE notifications SET is_read = TRUE WHERE user_id = $1`,
            [userId]
        );
        return true;
    }
}
export default new NotificationService();
