# Kế hoạch Triển khai: Quản lý Tài chính (Admin Finance)

## 1. Tổng quan (Overview)
Chức năng **Tài chính** là nơi Admin quản lý dòng tiền của hệ thống EduMatch. Các tính năng chính bao gồm: xem thống kê doanh thu, lịch sử giao dịch (nạp tiền, trừ tiền, hoàn tiền), và cấu hình/thiết lập phần trăm hoa hồng mà hệ thống giữ lại.

## 2. Tuân thủ Kiến trúc Modular Monolith
Toàn bộ logic xử lý tiền bạc, giao dịch và thống kê sẽ được giới hạn trong Finance Module. Điều này giúp tránh rò rỉ logic tài chính sang các module khác (như Student hay Tutor). Controller chỉ làm nhiệm vụ giao tiếp HTTP, trong khi mọi thao tác tính toán dòng tiền đều đặt ở `adminFinanceService`.

---

## 3. Chi tiết Backend (Node.js/Express)

### 3.1. Route (`backend/routes/adminFinance.js`)
- `GET /api/admin/finance/stats`: Lấy thông số tổng quan (Tổng doanh thu, Tổng số giao dịch trong tháng, v.v.).
- `GET /api/admin/finance/transactions`: Lấy danh sách giao dịch (có phân trang, lọc theo khoảng thời gian và loại giao dịch).
- `GET /api/admin/finance/settings`: Lấy cấu hình tài chính (vd: % hoa hồng).
- `PUT /api/admin/finance/settings`: Cập nhật cấu hình tài chính.

### 3.2. Controller (`backend/controllers/adminFinanceController.js`)
- Kiểm tra quyền truy cập (Admin).
- Trích xuất tham số thời gian (`startDate`, `endDate`) từ query parameters.
- Chuyển tiếp tới `adminFinanceService` và trả về kết quả cho frontend.

### 3.3. Service (`backend/services/adminFinanceService.js`)
- `getDashboardStats()`: Thực hiện các câu lệnh SQL `SUM(amount)` trên bảng `transactions` để tính toán doanh thu. Phân tích doanh thu theo ngày/tháng để vẽ biểu đồ.
- `getTransactions(filters)`: Query bảng `transactions` kết hợp với bảng `users` / `tutors` để lấy chi tiết người thực hiện giao dịch.
- Lưu ý: Xử lý làm tròn số (decimals) cẩn thận để tránh sai số tài chính.

### 3.4. Database (PostgreSQL - `config/db.js`)
- Tái sử dụng bảng `transactions` hiện có.
- Nếu cần, tạo thêm bảng `system_settings` (chứa % hoa hồng) nếu chưa có, hoặc lưu tạm ở file `.env` nếu dự án ở giai đoạn đơn giản. (Đề xuất tạo bảng `system_settings` để linh hoạt thay đổi từ UI).

---

## 4. Chi tiết Frontend (React/Vite)

### 4.1. Cập nhật Router (`App.jsx`)
- Thay thế thẻ div placeholder:
  ```jsx
  <Route path="finance" element={<FinanceManagement />} />
  ```

### 4.2. Pages & Components
- **Page:** `frontend/src/pages/Admin/FinanceManagement.jsx`
  - Chia làm 2 Tabs: "Tổng quan thống kê" và "Lịch sử giao dịch".
- **Component:** `frontend/src/components/admin/FinanceStatsCards.jsx`
  - Các thẻ hiển thị tổng doanh thu, biểu đồ doanh thu theo tháng (có thể dùng thư viện Recharts hoặc Chart.js).
- **Component:** `frontend/src/components/admin/TransactionTable.jsx`
  - Hiển thị chi tiết từng giao dịch (Mã GD, Thời gian, Người GD, Loại, Số tiền).

### 4.3. API Integration (`frontend/src/services/apiClient.js`)
- Thêm endpoints để gọi các API thống kê và danh sách giao dịch tương ứng.

## 5. Kế hoạch Kiểm thử (Testing Plan)
- Tạo các giao dịch giả lập (deposit, payment) từ phía Học viên.
- Kiểm tra số liệu Tổng doanh thu có khớp với tổng các dòng trong bảng `transactions` hay không.
- Thử thay đổi cấu hình phần trăm hoa hồng và xác minh hệ thống ghi nhận đúng.
