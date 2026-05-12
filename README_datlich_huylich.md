# 📚 HƯỚNG DẪN CHỨC NĂNG ĐẶT LỊCH & HỦY LỊCH
backend/controllers/adminBookingController.js: Admin quản lý lịch
backend/routes/adminBookings.js: Route admin
backend/controllers/studentBookingController.js: Logic đặt/hủy lịch học viên
backend/routes/studentBookings.js: Route học viên
frontend/pages/Admin/AdminBookingManagement.jsx: Trang admin quản lý lịch
frontend/pages/User/BookingPage.jsx: Trang đặt lịch cho học viên
frontend/pages/User/BookingHistoryPage.jsx: Trang hủy lịch + xem lịch của học viên

## 📁 1. Danh Sách Các File Mới (100% Độc Lập)

### 🖥️ Phía Backend (API)
*   [`backend/controllers/studentBookingController.js`](file:///c:/Users/user/OneDrive/M%C3%A1y%20t%C3%ADnh/tutor-management/backend/controllers/studentBookingController.js): Xử lý logic nghiệp vụ đặt lịch, trừ tiền ví học viên, kiểm tra số dư và hủy lịch hoàn tiền phía học viên.
*   [`backend/routes/studentBookings.js`](file:///c:/Users/user/OneDrive/M%C3%A1y%20t%C3%ADnh/tutor-management/backend/routes/studentBookings.js): Định nghĩa các API endpoints cho học viên đặt và hủy lịch.
*   [`backend/controllers/adminBookingController.js`](file:///c:/Users/user/OneDrive/M%C3%A1y%20t%C3%ADnh/tutor-management/backend/controllers/adminBookingController.js): Xử lý logic nghiệp vụ cho Admin: xem danh sách tất cả các lịch đặt, thống kê số liệu và quyền hủy lịch bất kỳ.
*   [`backend/routes/adminBookings.js`](file:///c:/Users/user/OneDrive/M%C3%A1y%20t%C3%ADnh/tutor-management/backend/routes/adminBookings.js): Định nghĩa các API endpoints bảo mật cho Admin quản lý đặt lịch.

### 🎨 Phía Frontend (Giao diện)
*   [`frontend/src/pages/User/BookingPage.jsx`](file:///c:/Users/user/OneDrive/M%C3%A1y%20t%C3%ADnh/tutor-management/frontend/src/pages/User/BookingPage.jsx): Trang đặt lịch của học viên. Tích hợp thanh tìm kiếm gia sư, bộ lọc môn học và Form đặt lịch (Modal) trực quan.
*   [`frontend/src/pages/User/BookingHistoryPage.jsx`](file:///c:/Users/user/OneDrive/M%C3%A1y%20t%C3%ADnh/tutor-management/frontend/src/pages/User/BookingHistoryPage.jsx): Trang lịch sử đặt lịch cá nhân của học viên, tích hợp bộ lọc trạng thái và nút hủy lịch kèm thông báo hoàn tiền.
*   [`frontend/src/pages/Admin/AdminBookingManagement.jsx`](file:///c:/Users/user/OneDrive/M%C3%A1y%20t%C3%ADnh/tutor-management/frontend/src/pages/Admin/AdminBookingManagement.jsx): Trang quản lý đặt lịch của Admin gồm 4 thẻ thống kê số liệu, bộ lọc nâng cao và popup xác nhận hủy lịch an toàn.

---

## ⚙️ 2. Quy Trình Nghiệp Vụ Chuyên Nghiệp

### A. Quy trình Đặt Lịch (Học viên)
1. **Tìm kiếm:** Học viên vào trang **Đặt lịch** để tìm gia sư đang có trạng thái `"Sẵn sàng nhận lớp"`.
2. **Chọn & Nhập thông tin:** Học viên nhấn nút **Đặt lịch** -> Nhập môn học, mốc thời gian muốn học, và lời nhắn gửi gia sư.
3. **Thanh toán phí đặt lịch:**
    *   Hệ thống tự động kiểm tra số dư ví học viên. Phí đặt lịch cố định là **100.000đ**.
    *   Nếu ví học viên không đủ tiền, hệ thống sẽ từ chối và thông báo cần nạp thêm tiền.
    *   Nếu đủ tiền, hệ thống trừ **100.000đ** trong tài khoản học viên, đồng thời tạo một hóa đơn giao dịch mới trong bảng `transactions` để đảm bảo minh bạch tài chính.
4. **Trạng thái:** Lịch đặt ban đầu sẽ có trạng thái là `"Chờ xác nhận" (pending)`.

### B. Quy trình Hủy Lịch & Hoàn Tiền Tự Động
Tính năng hỗ trợ hủy lịch linh hoạt cho cả Học viên và Admin với cơ chế hoàn tiền tự động 100% an toàn:

*   **Học viên tự hủy:**
    *   Chỉ được phép hủy khi lịch đang ở trạng thái `"Chờ xác nhận" (pending)`.
    *   Khi học viên nhấn hủy và xác nhận, hệ thống sẽ cập nhật trạng thái lịch thành `"Đã hủy" (cancelled)`.
    *   Hệ thống ngay lập tức **hoàn trả 100.000đ** vào ví của học viên, đồng thời ghi nhận một giao dịch cộng tiền (giao dịch hoàn tiền) vào bảng `transactions`.
*   **Admin hủy (Gia sư bận, sự cố bất khả kháng):**
    *   Admin có quyền hủy bất kỳ lịch học nào đang chờ hoặc đã xác nhận trong hệ thống.
    *   Khi Admin nhấn hủy lịch, hệ thống cũng tự động **hoàn trả 100.000đ** vào ví của học viên tương ứng để bảo vệ quyền lợi người học.

---

## 🛡️ 3. Trang Quản Lý Đặt Lịch của Admin

Giao diện quản lý đặt lịch của Admin được thiết kế hiện đại, cao cấp với các chức năng:
*   **Thống kê thời gian thực (Real-time Stats):** Hiển thị 4 thẻ thông tin trực quan:
    *   *Tổng số lịch đặt*
    *   *Số lịch đang chờ xác nhận*
    *   *Số lịch đã xác nhận (Đang học)*
    *   *Số lịch đã hủy*
*   **Tìm kiếm & Bộ lọc thông minh:** Cho phép tìm kiếm nhanh theo từ khóa (tên học viên, tên gia sư, môn học) và lọc nhanh danh sách theo từng trạng thái cụ thể.
*   **Hủy lịch an toàn:** Tích hợp Modal (Popup) xác nhận hủy lịch kèm cảnh báo hoàn trả tiền ví giúp Admin thao tác chính xác, tránh nhầm lẫn.

---

## 🛠️ 4. Hướng Dẫn Chạy & Kiểm Tra Trực Tiếp

### Bước 1: Khởi động hệ thống
Đảm bảo bạn đang ở thư mục gốc dự án và chạy lệnh khởi động Docker:
```bash
docker-compose down
docker-compose up -d
```

### Bước 2: Đăng nhập Admin để quản lý
*   **Đường dẫn:** `http://localhost:5173/admin/login`
*   **Tên đăng nhập:** `admin`
*   **Mật khẩu:** `admin`

### Bước 3: Đăng ký & Trải nghiệm phía Học viên
1. Vào mục Đăng ký tài khoản học viên tại `http://localhost:5173/register` (Mật khẩu yêu cầu ví dụ: `Abc@1234`).
2. Vào mục **Ví tiền** để xem số dư ban đầu hoặc thực hiện nạp tiền thử nghiệm.
3. Vào mục **Đặt lịch** -> Tìm kiếm gia sư -> Nhấn **Đặt lịch** để trải nghiệm trừ tiền tự động.
4. Vào mục **Lịch của tôi** để quản lý lịch cá nhân và kiểm tra nút **Hủy lịch** hoàn tiền ví.