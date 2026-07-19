# Kế hoạch Triển khai: Sắp xếp Lớp học (Admin Classes)

## 1. Tổng quan (Overview)
Chức năng **Sắp xếp Lớp học** cho phép Quản trị viên (Admin) theo dõi toàn bộ các lớp học (bookings) đang diễn ra hoặc đã hoàn thành giữa Gia sư và Học viên. Admin có thể can thiệp xử lý khi có tranh chấp (ví dụ: học viên phàn nàn, gia sư không dạy).

## 2. Tuân thủ Kiến trúc Modular Monolith
Hệ thống hiện tại tuân theo kiến trúc **Modular Monolith** dựa trên Express.js. Tính năng này sẽ được đóng gói thành một module độc lập (Classes Module) trên cả Frontend và Backend, tách biệt logic nghiệp vụ, giao tiếp thông qua API và Service layer mà không phụ thuộc cứng vào các module khác.

---

## 3. Chi tiết Backend (Node.js/Express)

### 3.1. Route (`backend/routes/adminClasses.js`)
- `GET /api/admin/classes`: Lấy danh sách toàn bộ các lớp học (có phân trang, lọc theo trạng thái: `confirmed`, `completed`, `disputed`).
- `GET /api/admin/classes/:id`: Lấy chi tiết một lớp học.
- `PUT /api/admin/classes/:id/status`: Cập nhật trạng thái lớp học (VD: Đánh dấu là có tranh chấp, hoặc giải quyết tranh chấp).

*Lưu ý:* Phải có middleware `authenticate` và `authorize('admin')`.

### 3.2. Controller (`backend/controllers/adminClassController.js`)
- Nhận request từ client, xác thực tham số đầu vào (ví dụ: ID hợp lệ, status hợp lệ).
- Gọi đến `adminClassService` để xử lý logic.
- Trả về JSON response chuẩn mực (`{ status: 'ok', data: ... }`).

### 3.3. Service (`backend/services/adminClassService.js`)
- Nơi chứa logic nghiệp vụ thuần túy:
  - `getAllClasses(filters)`: Query bảng `bookings` JOIN với bảng `users` (để lấy tên học viên) và bảng `tutors` (để lấy tên gia sư).
  - `updateClassStatus(bookingId, status, note)`: Cập nhật trạng thái trong bảng `bookings`, có thể gửi notification cho user và tutor.

### 3.4. Database (PostgreSQL - `config/db.js`)
- Tái sử dụng bảng `bookings`.
- Bổ sung (nếu cần) các trạng thái mới vào cột `status` như `disputed`, `resolved` (tranh chấp, đã giải quyết).

---

## 4. Chi tiết Frontend (React/Vite)

### 4.1. Cập nhật Router (`App.jsx`)
- Thay thế thẻ div placeholder bằng component thực tế:
  ```jsx
  <Route path="classes" element={<ClassManagement />} />
  ```

### 4.2. Pages & Components
- **Page:** `frontend/src/pages/Admin/ClassManagement.jsx`
  - Chứa layout chính, quản lý state cho danh sách lớp học và các bộ lọc.
- **Component:** `frontend/src/components/admin/ClassTable.jsx`
  - Bảng hiển thị thông tin lớp học: Môn học, Thời gian, Tên học viên, Tên gia sư, Trạng thái.
- **Component:** `frontend/src/components/admin/DisputeResolutionModal.jsx`
  - Modal cho phép Admin cập nhật trạng thái lớp học (Ghi chú lý do giải quyết tranh chấp).

### 4.3. API Integration (`frontend/src/services/apiClient.js`)
Thêm các hàm giao tiếp:
- `getAdminClasses(filters)`
- `updateClassStatus(id, payload)`

## 5. Kế hoạch Kiểm thử (Testing Plan)
- Đảm bảo Admin xem được các lớp có trạng thái `confirmed`.
- Mô phỏng thay đổi trạng thái từ `confirmed` sang `disputed` và kiểm tra xem Học viên/Gia sư có thấy cập nhật không.
