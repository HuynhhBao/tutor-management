# Kế hoạch Triển khai: Chức năng Quản lý Học viên (Admin)

**Tài liệu tham khảo:** `todo_features.md`
**Đường dẫn truy cập:** `/admin/students`

---

## 1. Yêu cầu Hệ thống (Mô tả chung)
- **Mục tiêu:** Cho phép Admin xem và quản lý danh sách toàn bộ Học viên (Users) trên hệ thống.
- **Tính năng chi tiết:**
  - Bảng danh sách học viên (ID, Họ tên, Email, Số điện thoại, Số dư ví, Trạng thái hoạt động).
  - Tìm kiếm/lọc học viên theo tên hoặc email.
  - Xem lịch sử đặt lịch (Booking history) của từng học viên.
  - Khóa/mở khóa tài khoản học viên (Ban user) để chặn đăng nhập hoặc chặn tương tác nếu vi phạm.

---

## 2. Công việc Backend (Node.js, Express & PostgreSQL)

### 2.1 Cập nhật Database Schema
Hiện tại bảng `users` chưa có trường trạng thái để phục vụ tính năng Khóa tài khoản.
- **File tác động:** `backend/config/db.js`
- **Nhiệm vụ:** Thêm đoạn code migration tự động vào trong hàm `initDb()` để bổ sung cột `is_active` cho bảng `users`.
  ```javascript
  // Đảm bảo cột is_active tồn tại để phục vụ chức năng Ban/Unban user
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='is_active') THEN
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
      END IF;
    END
    $$;
  `);
  ```

### 2.2 Tạo Service Layer (Xử lý Business Logic & Database)
- **File cần tạo:** `backend/services/adminStudentService.js`
- **Các hàm cần viết (Sử dụng `pg` pool):**
  - `getAllStudents(filters)`: Thực hiện Query lấy danh sách học viên từ bảng `users`. Xử lý điều kiện `search` (tìm theo `full_name` hoặc `email`). Không trả về `password`.
  - `getStudentById(id)`: Query lấy chi tiết thông tin 1 học viên.
  - `getStudentBookings(userId)`: Query lấy danh sách đặt lịch từ bảng `bookings` dựa trên `user_id`. Thực hiện JOIN với bảng `tutors` để trả về tên của Gia sư.
  - `toggleStudentStatus(id)`: Cập nhật trạng thái `is_active` của user (`UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING *`).

### 2.3 Tạo Controller mới (Xử lý HTTP Request/Response)
- **File cần tạo:** `backend/controllers/adminStudentController.js`
- **Các hàm cần viết (Tuân thủ chuẩn controller của project):**
  - Import `adminStudentService` và helper `sendSuccess` (từ `../utils/response.js`).
  - Các hàm: `getAllStudents`, `getStudentById`, `getStudentBookings`, `toggleStudentStatus` nhận `(req, res, next)`.
  - Gọi các hàm tương ứng từ Service Layer. Sử dụng `try...catch`, trong khối try dùng `sendSuccess(res, 200, ...)` để trả về data, trong khối catch đẩy lỗi `next(err)` cho Global Error Handler.

### 2.4 Tạo Route mới & Cấu hình
- **File cần tạo:** `backend/routes/adminStudents.js`
- **Logic khai báo Route:**
  ```javascript
  import express from 'express';
  // Import middleware check token & role admin (Ví dụ: authenticateToken, checkRole)
  // Import controller methods (getAllStudents, ...)
  
  const router = express.Router();
  
  // Appply middleware để bảo vệ route admin
  // router.use(authenticateToken);
  // router.use(checkRole(['admin']));
  
  router.get('/', getAllStudents);
  router.get('/:id', getStudentById);
  router.get('/:id/bookings', getStudentBookings);
  router.put('/:id/toggle-status', toggleStudentStatus);
  
  export default router;
  ```
- **File tác động:** `backend/index.js`
  - Import route vừa tạo: `import adminStudentsRoutes from './routes/adminStudents.js';`
  - Đăng ký endpoint API: `app.use('/api/admin/students', adminStudentsRoutes);`

---

## 3. Công việc Frontend (React & Tailwind CSS)

### 3.1 Cập nhật Router chính
- **File tác động:** `frontend/src/App.jsx`
- **Nhiệm vụ:** Tìm thẻ Route có `path="students"` (hiện tại đang render nội dung là thẻ div placeholder "Đang phát triển"). Hãy import Component mới và thay thế thẻ div đó thành `<StudentManagement />`.

### 3.2 Xây dựng Trang Chính
- **File cần tạo:** `frontend/src/pages/Admin/StudentManagement.jsx`
- **Thiết kế UI & Logic:**
  - Thiết kế cấu trúc UI tương tự như trang `TutorManagement.jsx` để giữ tính đồng nhất.
  - Cần có Header (Title + Subtitle) và một Thanh tìm kiếm (Search input).
  - Sử dụng `useEffect` gọi fetch (hoặc axios) tới API `GET /api/admin/students`. Lưu danh sách học viên vào state `students`.
  - Dưới thanh search, gọi render Component `StudentTable`.

### 3.3 Component: Bảng hiển thị danh sách
- **File cần tạo:** `frontend/src/components/admin/StudentTable.jsx`
- **Nhiệm vụ:** Hiển thị HTML Table. Các cột gồm:
  - **Học viên**: Hiện Avatar (nếu có), Full Name và Email ở dưới.
  - **SĐT & Ngày tham gia**: Lấy từ DB.
  - **Số dư ví**: Cần sử dụng hàm format tiền tệ (trong `utils/formatters.js` nếu có).
  - **Trạng thái**: Nếu `is_active === true` hiện badge màu xanh lá ("Hoạt động"). Ngược lại hiện badge màu đỏ ("Đã bị khóa").
  - **Hành động (Action Buttons)**:
    1. Nút "Xem lịch sử": Click vào sẽ mở một Modal hiển thị lịch sử thuê gia sư.
    2. Nút "Khóa/Mở khóa" (icon Ban / Unlock): Click vào sẽ popup confirm. Nếu Yes thì gọi `PUT /api/admin/students/:id/toggle-status`, sau đó fetch lại list học viên.

### 3.4 Component: Modal Lịch sử Đặt lịch
- **File cần tạo:** `frontend/src/components/admin/StudentBookingHistoryModal.jsx`
- **Nhiệm vụ:** Là một Modal popup nhận prop `studentId` và `isOpen`.
  - Khi mở lên, fetch API `GET /api/admin/students/${studentId}/bookings` và setState.
  - Render dữ liệu thành dạng List hoặc Mini-Table. Hiển thị: Môn học, Tên Gia sư, Thời gian học, Trạng thái (Pending/Confirmed/...).

---

## 4. Chú ý Quan trọng
- **Bảo mật Auth**: Hãy kiểm tra logic đăng nhập (`backend/controllers/authController.js`) hoặc middleware xác thực. Cần đảm bảo nếu học viên bị ban (`is_active = false`), họ không thể đăng nhập được.
- **Biến môi trường**: Đảm bảo gọi API thông qua `API_BASE_URL` được định nghĩa sẵn trong cấu trúc dự án.
- Tái sử dụng các UI components có sẵn như Modal Confirm, Alert trong thư mục `components/admin` và `context` của frontend.
