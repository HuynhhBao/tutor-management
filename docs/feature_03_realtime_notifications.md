# Tài Liệu Triển Khai: Thông Báo Thời Gian Thực (Real-time Notifications)

## 1. Mục Tiêu
Triển khai hệ thống Push Notification để thay thế các hàm `alert()` tĩnh. Thông báo nảy lên ngay lập tức nhờ WebSockets. Chức năng này không cần API Key từ bên thứ 3 (Chạy Local).

## 2. Chi Tiết Cấu Trúc & Code Backend
**Cài đặt thư viện:** `npm install socket.io`

*   **`backend/utils/socketManager.js`**:
    Quản lý danh sách User đang online.
    ```javascript
    import { Server } from 'socket.io';

    // Lưu trữ socket.id tương ứng với userId. VD: { 'student_1': 'socketxyz123' }
    global.onlineUsers = new Map(); 

    export const initSocket = (server) => {
        const io = new Server(server, { cors: { origin: "*" } });

        io.on('connection', (socket) => {
            // Frontend gửi event lên sau khi login thành công
            socket.on('authenticate', ({ userId, role }) => {
                const key = `${role}_${userId}`;
                global.onlineUsers.set(key, socket.id);
            });

            socket.on('disconnect', () => {
                // Xóa khỏi Map khi user tắt tab
                for (const [key, value] of global.onlineUsers.entries()) {
                    if (value === socket.id) global.onlineUsers.delete(key);
                }
            });
        });
        global.io = io; // Lưu io ra global để các service khác gọi được
    };
    ```

*   **`backend/services/notificationService.js`**:
    Service lưu thông báo vào DB và đẩy qua Socket.
    ```javascript
    import pool from '../config/db.js';

    class NotificationService {
        async sendNotification(userId, role, title, message) {
            // 1. Lưu DB
            await pool.query(
                `INSERT INTO notifications (user_id, user_type, title, message) VALUES ($1, $2, $3, $4)`, 
                [userId, role, title, message]
            );

            // 2. Bắn Socket nếu user đang online
            const socketId = global.onlineUsers.get(`${role}_${userId}`);
            if (socketId) {
                global.io.to(socketId).emit('new_notification', { title, message });
            }
        }
    }
    export default new NotificationService();
    ```

*   **Cách sử dụng (Ví dụ ở `bookingService.js`)**:
    Khi Học viên book thành công $\rightarrow$ Báo cho Gia sư:
    ```javascript
    import notificationService from './notificationService.js';
    // ...
    await notificationService.sendNotification(tutorId, 'tutor', 'Lịch học mới', 'Bạn vừa nhận được yêu cầu học!');
    ```

## 3. Chi Tiết Triển Khai Frontend
**Cài đặt thư viện:** `npm install socket.io-client react-hot-toast`

*   **`frontend/src/context/SocketContext.jsx`**:
    Bọc toàn bộ app bằng Context này.
    ```javascript
    import { createContext, useEffect } from 'react';
    import { io } from 'socket.io-client';
    import { useAuth } from './AuthContext';

    export const SocketContext = createContext(null);

    export const SocketProvider = ({ children }) => {
        const { user } = useAuth(); // Lấy user hiện tại từ Auth
        
        useEffect(() => {
            if (user) {
                const socket = io(import.meta.env.VITE_API_URL);
                socket.emit('authenticate', { userId: user.id, role: user.role });
                
                return () => socket.disconnect();
            }
        }, [user]);

        return <SocketContext.Provider value={null}>{children}</SocketContext.Provider>;
    };
    ```

*   **`frontend/src/components/layout/NotificationBell.jsx`**:
    Ở Navbar, lắng nghe event và bắn Toast.
    ```javascript
    import toast from 'react-hot-toast';
    // ...
    socket.on('new_notification', (data) => {
        toast.success(`${data.title}: ${data.message}`);
        setUnreadCount(prev => prev + 1);
    });
    ```
