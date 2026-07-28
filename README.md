# 🎓 EduMatch - Nền Tảng Kết Nối Gia Sư & Lọc Học Viên Thông Minh

EduMatch là một hệ thống ứng dụng web chuyên nghiệp toàn diện, giúp kết nối học viên với các gia sư chất lượng cao thông qua trợ lý AI thông minh và phòng học tương tác thời gian thực. Dự án được thiết kế theo tiêu chuẩn công nghiệp **Modular Monolith**, kết hợp các công nghệ hiệu năng cao như **Redis Caching**, **WebSockets**, và đạt chuẩn đánh giá an ninh mã nguồn cao nhất **SonarCloud Quality Gate - Hạng 'A'**.

---

## 🌟 Tính Năng Nổi Bật

### 👨‍🎓 Dành Cho Học Viên
- **Trợ Lý AI Tìm Gia Sư (AI Matching Assistant - Gemini):** Chatbot tư vấn thông minh 24/7, phân tích nhu cầu học tập để gợi ý chính xác hồ sơ gia sư phù hợp nhất.
- **Phòng Học Trực Tuyến Thời gian thực (Virtual Classroom):** Tự động mở khi lớp được xác nhận, tích hợp các công cụ giao tiếp thời gian thực, bảng tin nhắn thảo luận và chuẩn bị tài liệu trực tiếp.
- **Hệ Thống Đặt Lịch & Hợp Đồng (Booking & Classes):** Theo dõi trạng thái đặt lịch minh bạch (*Chờ xác nhận, Đã xác nhận, Hoàn thành, Đã hủy*) với lịch học linh hoạt theo giờ.
- **Ví Học Tập (EduMatch Wallet):** Quản lý số dư cá nhân, hiển thị lịch sử giao dịch và nạp tiền tự động qua quét mã QR an toàn.

### 👨‍🏫 Dành Cho Gia Sư
- **Quản Lý Lịch Dạy & Phòng Học:** Chủ động tiếp nhận, từ chối hoặc xác nhận yêu cầu sắp xếp ca dạy; khởi tạo và điều hành phòng học tương tác trực tuyến cùng học viên.
- **Quản Lý Tài Chính & Rút Tiền VietQR:** Theo dõi chi tiết tổng doanh thu ròng sau chiết khấu theo thời gian thực. Gia sư có thể liên kết trực tiếp tài khoản Ngân hàng VNĐ và chủ động gửi **Yêu cầu Rút Tiền** bất cứ lúc nào.
- **Tuyển Dụng Tự Động:** Nộp CV ứng tuyển, tự động nhận email phản hồi mời phỏng vấn hoặc kết quả và nhận tài khoản đăng nhập khi hồ sơ được phê duyệt.

### 👨‍💻 Dành Cho Quản Trị Viên (Admin Dashboard)
- **Trang Tổng Quan & Số Liệu Thời Gian Thực (Real-time Overview):** Thống kê tổng quan số lượng gia sư, học viên, lớp học đang vận hành và tổng doanh thu hệ thống 30 ngày.
- **Quản Trị Gia Sư Linh Hoạt (Gia Sư Ảo & Thật):** 
  - *Gia sư thủ công/ảo:* Cho phép thêm nhanh hồ sơ gia sư theo môn học, bằng cấp mà chưa cần bắt buộc nhập email hay tài khoản.
  - *Gia sư thật:* Quản lý đơn ứng tuyển, lên lịch gửi email phỏng vấn tự động và cấp tài khoản chính thức chỉ với một lượt nhấp chuột.
- **Duyệt Chi & Giải Ngân VietQR (Automated Payouts):** Đối soát danh sách ưu tiên theo gia sư có số dư cao nhất, xem chi tiết lệnh rút tiền và quét mã **VietQR** được tạo tự động chuẩn xác theo tài khoản đích để giải ngân tiền thù lao tức thì.
- **Quản Trị Học Viên & Lịch Sử Thuê:** Xem số dư từng học viên, khóa/mở khóa tài khoản bảo mật và tra cứu lịch sử đặt lịch chi tiết qua Modal tương tác.
- **Xuất Báo cáo Kế toán:** Xử lý và trích xuất toàn bộ lịch sử biến động dòng tiền (Nạp tiền, Thanh toán lớp, Chuyển cho gia sư, Hoàn tiền) sang file **CSV/Excel** tiêu chuẩn.

---

## 🏗️ Kiến Trúc Hệ Thống & Hiệu Năng Nâng Cao

Dự án tuân thủ nghiêm ngặt mô hình **Modular Monolith** kết hợp **Layered Architecture**, phân tách trách nhiệm tối đa giữa các thành phần nghiệp vụ:

```
+-----------------------------------------------------------------------+
|                       Frontend (React + Vite + Tailwind)              |
|        UI Components -> Status Localization -> Proxy Client           |
+-----------------------------------+-+---------------------------------+
                                    | ^
             REST APIs & WebSockets | | JSON Response (Standardized)
                                    v |
+-----------------------------------+-+---------------------------------+
|                    Backend (Node.js + Express + Joi)                  |
|    Router -> Rate Limiters -> Validations -> Thin Controllers         |
|                              |                                        |
|                              v                                        |
|       Services (100% Business Logic) <---> Redis Cache Layer          |
+------------------------------+----------------------------------------+
                               |
                               v
               PostgreSQL Database (Parameterized SQL)
```

### Điểm Sáng Công Nghệ (Technical Highlights):
1. **Redis Caching Layer:** Tối ưu hóa hiệu năng truy vấn cho các API thống kê nặng ở Quản trị viên, hỗ trợ cơ chế fallback thông minh (tự động bỏ qua Cache, tiếp tục truy vấn DB mượt mà khi phát triển local không kết nối Redis).
2. **WebSockets / Real-time Notification:** Đảm bảo luồng giao tiếp tức thì cho Lớp học ảo (Virtual Classroom) và hệ thống thông báo sự kiện (đặt lịch mới, cập nhật ví).
3. **Chuẩn Hóa Typography & Từ Điển Trạng Thái (UI/UX Standardization):** Xây dựng module dịch trạng thái tự động (`statusFormatter.js`), biến hóa toàn bộ trạng thái hệ thống (*cancelled, rejected, pending, completed*) sang Tiếng Việt nhã nhặn, đồng nhất font chữ toàn dự án, loại bỏ hoàn toàn tình trạng in hoa (`uppercase`) thô ráp.
4. **Mã Nguồn "Sạch" & Kiểm Toán An Ninh (SonarCloud 'A' Quality Gate):** Đảm bảo không rò rỉ bộ nhớ, loại bỏ lỗ hổng tạo số ngẫu nhiên yếu (Pseudo-random flaws) và chống tấn công giả mạo log (Log Forging).

---

## 🛡️ Tiêu Chuẩn Bảo Mật Cấp Doanh Nghiệp

- **Bảo vệ toàn diện HTTP Headers:** Sử dụng `Helmet` phòng chống các phương thức XSS, Clickjacking và MIME sniffing.
- **Chống Tấn Công DDoS & Brute-Force:** Tự động khống chế nhịp truy cập bằng `express-rate-limit` (100 reqs/15m cho API thường, và cực kỳ khắt khe 5 reqs/1m cho các cổng Auth).
- **Phân Quyền Triệt Để (RBAC):** Ranh giới phân quyền rõ rệt qua JWT Token cho 3 vai trò độc lập: *Admin - Tutor - Student*.
- **Validation Kép Kín Kẽ (Joi Schema):** Làm sạch tuyệt đối mọi payload từ người dùng trước khi chạm vào CSDL, xử lý êm ái các chuỗi rỗng thành `null` để bảo vệ ràng buộc Unique.
- **SQL Injection Prevention:** 100% truy vấn CSDL sử dụng Parameterized queries thông qua `pg` (node-postgres).

---

## 🚀 Hướng Dẫn Cài Đặt (Installation & Development)

### 1. Yêu cầu Hệ thống (Prerequisites)
- **Node.js** (v18.0.0 hoặc cao hơn)
- **PostgreSQL** (v14.0 trở lên)
- *Tùy chọn:* **Redis Server** (để chạy trọn vẹn bộ nhớ đệm Cache local)

### 2. Thiết lập Môi trường Backend
1. Tạo CSDL PostgreSQL tên là `tutor_management`.
2. Di chuyển vào thư mục backend và cài đặt thư viện:
   ```bash
   cd backend
   npm install
   ```
3. Tạo file `.env` theo biến sau:
   ```env
   PORT=3001
   DB_HOST=localhost
   POSTGRES_USER=postgres
   POSTGRES_PASSWORD=your_password
   POSTGRES_DB=tutor_management
   JWT_SECRET=your_super_secret_jwt_key
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_gmail_app_password
   GEMINI_API_KEY=your_google_gemini_api_key
   FRONTEND_URL=http://localhost:5173
   REDIS_HOST=localhost
   REDIS_PORT=6379
   ```
4. Khởi động server (Tự động khởi tạo Table DB):
   ```bash
   npm run dev
   ```

### 3. Thiết lập Môi trường Frontend
1. Di chuyển sang thư mục frontend và cài đặt thư viện:
   ```bash
   cd ../frontend
   npm install
   ```
2. Tạo file `.env`:
   ```env
   VITE_API_URL=http://localhost:3001/api
   ```
3. Khởi động ứng dụng React Vite:
   ```bash
   npm run dev
   ```
4. Mở trình duyệt và trải nghiệm toàn bộ hệ thống tại URL: `http://localhost:5173`.

---

### 📝 Lưu Ý Tác Giả & Bản Quyền
Dự án được xây dựng và cọ xát theo các quy chuẩn kỹ thuật chuyên nghiệp phục vụ việc bảo vệ Đồ án Tốt nghiệp. Vui lòng ghi rõ nguồn và liên hệ tác giả nếu có nhu cầu phát triển thương mại hóa.