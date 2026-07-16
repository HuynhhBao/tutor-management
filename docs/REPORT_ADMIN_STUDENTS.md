# Báo Cáo Triển Khai Code: Tính Năng Quản Lý Học Viên (Admin)

Dựa trên kế hoạch ban đầu (`plan_admin_students.md`), dưới đây là danh sách chi tiết các thay đổi về code và các file đã được tạo mới để hoàn thành tính năng Quản lý Học viên.

---

## 1. Backend (Node.js & Express)

### Các file được tạo mới:
1. **`backend/services/adminStudentService.js`**
   - Viết các hàm tương tác với Database (bảng `users` và `bookings`) bằng `pg` pool.
   - Các hàm chính: `getAllStudents` (hỗ trợ search), `getStudentById`, `getStudentBookings` (join với bảng tutors), và `toggleStudentStatus` (đổi cờ `is_active`).
2. **`backend/controllers/adminStudentController.js`**
   - Xử lý các request từ Frontend, gọi các hàm từ `adminStudentService`.
   - Trả về dữ liệu chuẩn JSON thông qua hàm `sendSuccess`.
3. **`backend/routes/adminStudents.js`**
   - Khai báo các API Endpoints:
     - `GET /` -> `getAllStudents`
     - `GET /:id` -> `getStudentById`
     - `GET /:id/bookings` -> `getStudentBookings`
     - `PUT /:id/toggle-status` -> `toggleStudentStatus`

### Các file đã chỉnh sửa:
1. **`backend/config/db.js`**
   - Bổ sung migration tự động: Kiểm tra và thêm cột `is_active BOOLEAN DEFAULT TRUE` vào bảng `users` (nếu chưa có) để phục vụ việc khóa tài khoản.
2. **`backend/index.js`**
   - Khai báo và sử dụng route mới: `app.use('/api/admin/students', adminStudentsRoutes)`.
3. **`backend/services/authService.js`**
   - Thêm logic kiểm tra tài khoản bị khóa trong hàm đăng nhập (`loginUser` và `googleLogin`): Nếu `is_active === false`, ném lỗi `ApiError(403, 'Tài khoản của bạn đã bị khóa')`. (Không chặn đăng nhập của Gia sư vì Gia sư dùng bảng `tutors`).

---

## 2. Frontend (React.js & Vite)

### Thư viện cài đặt thêm:
- Chạy lệnh `npm install react-hot-toast react-icons` để hỗ trợ hiển thị thông báo popup (Toast) và các Icon trực quan (Khóa, Mở khóa, Lịch...). (Cập nhật `package.json` và `package-lock.json`).

### Các file được tạo mới:
1. **`frontend/src/pages/Admin/StudentManagement.jsx`**
   - Component cha của trang quản lý học viên.
   - Quản lý các trạng thái: danh sách học viên (`students`), trạng thái loading, và từ khóa tìm kiếm (`search` với kỹ thuật debounce).
   - Gọi API `GET /api/admin/students` và truyền dữ liệu xuống bảng.
2. **`frontend/src/components/admin/StudentTable.jsx`**
   - Component con chuyên render UI dạng bảng.
   - Cấu trúc các cột: Học viên, Liên hệ, Số dư ví, Tham gia, Trạng thái (hiển thị Badge Đỏ/Xanh) và Cột Hành động.
   - Gắn sự kiện gọi hàm đổi trạng thái (Toggle Status) và mở Modal xem lịch sử.
3. **`frontend/src/components/admin/StudentBookingHistoryModal.jsx`**
   - Popup Modal để hiển thị danh sách các lần đặt lịch của một học viên cụ thể.
   - Fetch API `GET /api/admin/students/:id/bookings` khi Modal được mở.

### Các file đã chỉnh sửa:
1. **`frontend/src/App.jsx`**
   - Cập nhật Router: Import `StudentManagement` và thay thế nội dung placeholder cho đường dẫn `<Route path="students" element={<StudentManagement />} />`.
2. **`frontend/src/services/apiClient.js`**
   - Bổ sung `export const api = axiosInstance;` để các file Component mới có thể dùng chung instance của Axios.
3. **`frontend/src/utils/formatters.js`**
   - Sử dụng các hàm `formatCurrency` và `formatDate` có sẵn để làm đẹp dữ liệu hiển thị trên bảng.

---
**Kết luận:** Toàn bộ code đã bám sát 100% so với kế hoạch đề ra ban đầu, không gây ảnh hưởng tới các chức năng cũ (như đăng nhập Gia sư) và đã hoàn chỉnh mặt giao diện.
