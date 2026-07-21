# Tài Liệu Triển Khai: Phòng Học Trực Tuyến (Virtual Classroom)

## 1. Hướng Dẫn Lấy API Keys
Để chạy được chức năng Video Call và Upload file tài liệu.

### A. Lấy Agora.io App ID (Cho Video Call)
1. Truy cập [Agora.io](https://www.agora.io/en/), tạo tài khoản (Miễn phí 10.000 phút/tháng).
2. Vào Console $\rightarrow$ **Projects** $\rightarrow$ **Create New Project**.
3. Chọn cơ chế Authentication là **"APP ID Only"** (để dễ test lúc đầu).
4. Copy `APP ID` và cấu hình vào Frontend (ví dụ lưu trong `frontend/.env`: `VITE_AGORA_APP_ID=xxx`).

### B. Lấy Cloudinary API (Cho gửi File/Hình ảnh)
1. Truy cập [Cloudinary](https://cloudinary.com/) tạo tài khoản miễn phí.
2. Tại Dashboard, copy 3 thông số: `Cloud Name`, `API Key`, `API Secret`.
3. Thêm vào `.env` của Backend.

## 2. Chi Tiết Cấu Trúc & Code Backend (Socket & Upload)
**Cài đặt thư viện:** `npm install socket.io multer cloudinary multer-storage-cloudinary`

*   **`backend/utils/socketManager.js`**:
    Quản lý luồng gửi tin nhắn trong phòng học.
    ```javascript
    import { Server } from 'socket.io';

    export const initSocket = (server) => {
        const io = new Server(server, { cors: { origin: "*" } });

        io.on('connection', (socket) => {
            // Khi học viên/gia sư tham gia vào lớp
            socket.on('join-class', (classId) => {
                socket.join(`class_${classId}`);
            });

            // Khi chat hoặc gửi file
            socket.on('send-message', (data) => {
                // Phát lại tin nhắn cho mọi người trong phòng (trừ người gửi)
                socket.to(`class_${data.classId}`).emit('receive-message', data);
            });
        });
        return io;
    };
    ```
    *Nhớ cập nhật file `backend/index.js` để attach Socket vào HTTP Server thay vì Express App.*

*   **`backend/services/classSessionService.js` (Upload File)**:
    Sử dụng Multer và Cloudinary để lưu file bài tập người dùng gửi. Viết hàm upload và trả về `file_url`.

## 3. Chi Tiết Triển Khai Frontend
**Cài đặt thư viện:** `npm install agora-rtc-react agora-rtc-sdk-ng socket.io-client @excalidraw/excalidraw`

*   **`frontend/src/pages/Classroom/VirtualClassroom.jsx`**:
    Container chính để bọc Video và Khung Chat.
    ```javascript
    import { io } from 'socket.io-client';
    // ... useEffect để init Socket
    const socket = io('http://localhost:3001');
    socket.emit('join-class', classId);
    ```

*   **`frontend/src/components/classroom/VideoCallArea.jsx`**:
    Sử dụng hooks của Agora để hiển thị Cam/Mic.
    ```javascript
    import { useRTCClient, useLocalMicrophoneTrack, useLocalCameraTrack } from "agora-rtc-react";
    // Setup client với VITE_AGORA_APP_ID và classId làm channel name.
    ```

*   **`frontend/src/components/classroom/ClassChat.jsx`**:
    Khung chat bên phải, có giao diện kéo thả file.
    Khi upload xong, gửi Socket event: 
    `socket.emit('send-message', { classId, text: 'Bài tập', fileUrl: 'http...' })`
