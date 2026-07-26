import pool from '../config/db.js';

class NotificationService {
    async sendNotification(userId, role, title, message) {
        try {
            // 1. Lưu DB
            await pool.query(
                `INSERT INTO notifications (user_id, user_type, title, message) VALUES ($1, $2, $3, $4)`, 
                [userId, role, title, message]
            );

            // 2. Bắn Socket nếu user đang online
            const socketId = global.onlineUsers?.get(`${role}_${userId}`);
            if (socketId && global.io) {
                global.io.to(socketId).emit('new_notification', { title, message });
                console.log(`Sent realtime notification to ${role}_${userId}`);
            }
        } catch (error) {
            console.error('Error sending notification:', error);
        }
    }
}
export default new NotificationService();
