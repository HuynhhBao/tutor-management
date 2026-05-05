# Hướng dẫn cài đặt và chạy Project trên Localhost

Tài liệu này hướng dẫn bạn từng bước để thiết lập môi trường và chạy ứng dụng trên máy tính cá nhân.

## 1. Yêu cầu hệ thống
- **Node.js** (Phiên bản 18 trở lên)
- **npm** (thường đi kèm với Node.js)
- **PostgreSQL** (Có thể cài trực tiếp hoặc chạy qua Docker)

## 2. Các bước thực hiện

### Bước 1: Cài đặt Dependencies
Bạn cần cài đặt thư viện cho cả Backend và Frontend.

Mở terminal tại thư mục gốc của dự án và chạy các lệnh sau:

**Cho Backend:**
```bash
cd backend
npm install
```

**Cho Frontend:**
```bash
cd ../frontend
npm install
```

### Bước 2: Thiết lập File Cấu hình (.env)
Dự án sử dụng file `.env` đặt tại thư mục gốc (root) để quản lý các biến môi trường.

1. Tại thư mục gốc của dự án, sao chép file `.env.example` thành `.env`:
   - Trên Windows (PowerShell): `cp .env.example .env`
   - Trên Windows (CMD): `copy .env.example .env`
   - Trên Linux/Mac: `cp .env.example .env`

2. Mở file `.env` vừa tạo và điền các thông tin cần thiết:

```env
# Cấu hình Database (PostgreSQL)
POSTGRES_USER=your_username        # Tên người dùng database
POSTGRES_PASSWORD=your_password    # Mật khẩu database
POSTGRES_DB=tutor_management       # Tên database bạn đã tạo
PORT=3001                         # Cổng chạy Backend

# Cấu hình Bảo mật
JWT_SECRET=your_jwt_secret_key     # Mã bí mật để tạo Token (có thể tự tạo chuỗi ngẫu nhiên)

# Cấu hình Email (Để gửi mã OTP)
EMAIL_USER=your_email@gmail.com    # Email gửi OTP
EMAIL_PASS=your_app_password       # Mật khẩu ứng dụng (App Password) của Google
```

> **Lưu ý:** Nếu bạn sử dụng Gmail, hãy tạo "App Password" để điền vào `EMAIL_PASS`.

### Bước 3: Chuẩn bị Cơ sở dữ liệu
Nếu bạn cài PostgreSQL trực tiếp trên máy:
1. Tạo một database mới có tên là `tutor_management`.
2. Backend sẽ tự động khởi tạo các bảng cần thiết khi chạy lần đầu.

Nếu bạn muốn dùng Docker để chạy Database nhanh:
```bash
docker-compose up -d db
```

### Bước 4: Chạy Ứng dụng

Bạn nên mở 2 cửa sổ Terminal riêng biệt:

**Terminal 1 - Chạy Backend:**
```bash
cd backend
npm run dev
```
Backend sẽ chạy tại: `http://localhost:3001`

**Terminal 2 - Chạy Frontend:**
```bash
cd frontend
npm run dev
```
Frontend sẽ chạy tại: `http://localhost:5173`

## 3. Kiểm tra kết quả
- Truy cập `http://localhost:5173` để xem giao diện ứng dụng.
- Mọi thay đổi trong code sẽ được tự động cập nhật (Hot Reload).

## 4. Xử lý lỗi thường gặp
- **Lỗi cổng đã được sử dụng:** Nếu thấy báo lỗi `EADDRINUSE`, hãy kiểm tra xem có ứng dụng nào khác đang dùng cổng 3001 hoặc 5173 không, hoặc đổi cổng trong file `.env`.
- **Lỗi kết nối DB:** Kiểm tra lại thông tin Username/Password trong file `.env` có khớp với cài đặt PostgreSQL của bạn không.
