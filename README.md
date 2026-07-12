# 🎓 EduMatch - Nền Tảng Kết Nối Gia Sư và Học Viên

EduMatch là một hệ thống ứng dụng web chuyên nghiệp, giúp kết nối học viên với các gia sư chất lượng cao. Dự án được thiết kế với giao diện hiện đại, quy trình xử lý giao dịch tự động và được kiến trúc theo tiêu chuẩn **Modular Monolith**, đảm bảo khả năng mở rộng, dễ bảo trì và tính bảo mật cao.

---

## 🌟 Tính Năng Nổi Bật

### 👨‍🎓 Dành cho Học Viên
- **Tìm kiếm thông minh:** Lọc gia sư theo môn học, đánh giá, chi phí và trạng thái hoạt động.
- **Ví tiền ảo (Wallet):** Quản lý số dư cá nhân, nạp tiền tự động qua mã QR thanh toán.
- **Hệ thống đặt lịch (Booking):** Đặt lịch học theo giờ, tự động trừ tiền cọc an toàn.
- **Trợ lý ảo AI (Gemini):** Chatbot hỗ trợ giải đáp thắc mắc và hướng dẫn sử dụng nền tảng 24/7.
- **Trò chuyện trực tiếp (Chat):** Nhắn tin trao đổi trực tiếp với gia sư trước và sau khi đặt lịch.

### 👨‍🏫 Dành cho Gia Sư
- **Tuyển dụng tự động:** Nộp CV ứng tuyển, nhận email phản hồi tự động và cấp tài khoản khi được duyệt.
- **Quản lý lịch dạy:** Duyệt yêu cầu đặt lịch, lên lịch biểu và cập nhật trạng thái các buổi học.
- **Thống kê thu nhập:** Theo dõi lịch sử giao dịch và doanh thu cá nhân.

### 👨‍💻 Dành cho Quản trị viên (Admin)
- Quản lý toàn bộ hệ thống Gia Sư và Học Viên.
- Xét duyệt đơn ứng tuyển, gửi thư mời phỏng vấn và từ chối hồ sơ chỉ với một cú click.
- Kiểm soát dòng tiền và lịch sử giao dịch toàn hệ thống.

---

## 🏗️ Kiến Trúc Hệ Thống (Architecture)

Dự án áp dụng kiến trúc **Modular Monolith**, phân rã chặt chẽ các thành phần hệ thống:

### Backend (Node.js + Express + PostgreSQL)
Được cấu trúc theo mô hình đa tầng (Layered Architecture):
- **Routes:** Định tuyến API và áp dụng Middleware bảo mật.
- **Validations (`Joi`):** Bộ lọc đầu vào nghiêm ngặt, chặn dữ liệu rác.
- **Controllers (Thin Controllers):** Chỉ làm nhiệm vụ tiếp nhận Request và trả về Response chuẩn hóa (`sendSuccess`, `ApiError`).
- **Services:** Chứa 100% Business Logic và tương tác cơ sở dữ liệu (`AuthService`, `BookingService`, `WalletService`, v.v...).

### Frontend (React + Vite + TailwindCSS)
Áp dụng **Component-based Architecture**:
- Tích hợp Proxy Client với Axios Interceptors để bắt lỗi toàn cục (Global Error Handling).
- Triển khai `ErrorBoundary` bảo vệ UI khỏi crash diện rộng.
- State management thông qua React Context (`AuthContext`).

---

## 🛡️ Bảo Mật (Security Features)

Hệ thống được trang bị các cơ chế bảo mật nâng cao cấp doanh nghiệp:
- **Helmet:** Ẩn và tăng cường các HTTP Headers để phòng chống XSS, Clickjacking.
- **Rate Limiting:** Chống tấn công DDoS bằng cách giới hạn số lượt truy cập API trên mỗi IP (100 reqs/15m). Áp dụng giới hạn cực kỳ khắt khe cho luồng đăng nhập/đăng ký (5 reqs/1m) để chống Brute-force.
- **JWT (JSON Web Token):** Tối ưu hóa thời gian sống của token (1 giờ) để ngăn ngừa rủi ro bị đánh cắp phiên đăng nhập.
- **CORS Restricted:** Chỉ cho phép Server xử lý request đến từ các domain Frontend được chỉ định sẵn.
- **SQL Injection Prevention:** Sử dụng `pg` (node-postgres) parameterization.

---

## 🚀 Hướng Dẫn Cài Đặt (Installation)

### Yêu cầu hệ thống (Prerequisites)
- Node.js (v18 trở lên)
- PostgreSQL (v14 trở lên)

### Bước 1: Khởi tạo Cơ sở dữ liệu (Database)
1. Tạo một database mới trong PostgreSQL có tên `tutor_management`.
2. Hệ thống backend đã tích hợp module `initDb()` tự động khởi tạo các Table nếu chưa có.

### Bước 2: Thiết lập môi trường Backend
1. Chuyển vào thư mục backend:
   ```bash
   cd backend
   ```
2. Cài đặt các thư viện:
   ```bash
   npm install
   ```
3. Tạo file `.env` từ file `.env.example` và điền thông tin:
   ```env
   POSTGRES_USER=your_postgres_username
   POSTGRES_PASSWORD=your_postgres_password
   POSTGRES_DB=tutor_management
   PORT=3001
   JWT_SECRET=your_super_secret_jwt_key
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_gmail_app_password
   GEMINI_API_KEY=your_google_gemini_api_key
   FRONTEND_URL=http://localhost:5173
   ```
4. Chạy Backend Server:
   ```bash
   npm run dev
   ```

### Bước 3: Thiết lập môi trường Frontend
1. Chuyển vào thư mục frontend:
   ```bash
   cd frontend
   ```
2. Cài đặt thư viện:
   ```bash
   npm install
   ```
3. Tạo file `.env`:
   ```env
   VITE_API_URL=http://localhost:3001/api
   ```
4. Chạy Frontend Server:
   ```bash
   npm run dev
   ```

### Bước 4: Trải nghiệm
Mở trình duyệt truy cập vào đường link Frontend (thường là `http://localhost:5173`).

---

Dự án thuộc khuôn khổ đồ án môn học. Vui lòng liên hệ tác giả nếu muốn sử dụng vào mục đích thương mại.