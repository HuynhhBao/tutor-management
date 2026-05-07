# 🏗️ Kiến trúc Backend

Hệ thống backend được xây dựng bằng Node.js và Express.js, được tổ chức theo hướng module hóa để dễ bảo trì.

## 📂 Cấu trúc thư mục
- `backend/config/`: Cấu hình hệ thống (Database connection, v.v.).
- `backend/routes/`: Định nghĩa các API endpoints (chia theo module như `auth.js`, `tutors.js`).
- `backend/utils/`: Các hàm tiện ích dùng chung (Mailer, v.v.).
- `backend/index.js`: Điểm khởi đầu của ứng dụng (Setup middleware, kết nối DB, khởi chạy server).

## 🗄️ Cơ sở dữ liệu (PostgreSQL)
Hệ thống sử dụng `pg` (node-postgres) để kết nối và truy vấn.
Các bảng chính:
- `users`: Lưu thông tin người dùng thường.
- `admins`: Lưu thông tin quản trị viên.
- `tutors`: Lưu danh sách gia sư.

## 📧 Hệ thống gửi Email (Mailer)
Sử dụng `nodemailer` để gửi OTP qua SMTP (Gmail).
Cấu hình được quản lý qua các biến môi trường trong file `.env`:
- `EMAIL_USER`: Tài khoản Gmail gửi.
- `EMAIL_PASS`: App Password của Gmail.

## 🛡️ Middlewares
- `express.json()`: Xử lý dữ liệu JSON từ request body.
- `cookie-parser`: Xử lý cookies để trích xuất JWT.
- `cors`: Cấu hình cho phép frontend truy cập API.
