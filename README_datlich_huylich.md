# 📚 HƯỚNG DẪN CHỨC NĂNG ĐẶT LỊCH, HỦY LỊCH & QUẢN LÝ VÍ TIỀN

backend/controllers/adminBookingController.js: Admin quản lý lịch
backend/routes/adminBookings.js: Route admin
backend/controllers/studentBookingController.js: Logic đặt/hủy lịch học viên
backend/routes/studentBookings.js: Route học viên
backend/controllers/walletController.js: Logic truy vấn số dư và nạp tiền
backend/routes/wallet.js: Route nạp tiền và ví tiền
frontend/src/pages/Admin/AdminBookingManagement.jsx: Trang admin quản lý lịch
frontend/src/pages/User/BookingPage.jsx: Trang đặt lịch cho học viên
frontend/src/pages/User/BookingHistoryPage.jsx: Trang hủy lịch + xem lịch của học viên
frontend/src/pages/User/WalletPage.jsx: Trang ví tiền của học viên
frontend/src/components/common/DepositModal.jsx: Popup nạp tiền học viên

---

## 📁 1. Danh Sách Các File Đã Xây Dựng (100% Hoàn Chỉnh)

### 🖥️ Phía Backend (API)
*   [`backend/controllers/studentBookingController.js`](file:///c:/Users/user/OneDrive/M%C3%A1y%20t%C3%ADnh/tutor-management/backend/controllers/studentBookingController.js): Xử lý logic đặt lịch, kiểm tra số dư ví và quy định hủy lịch (pending hoàn tiền, confirmed không hoàn tiền).
*   [`backend/routes/studentBookings.js`](file:///c:/Users/user/OneDrive/M%C3%A1y%20t%C3%ADnh/tutor-management/backend/routes/studentBookings.js): Định nghĩa API endpoints cho học viên quản lý và hủy lịch.
*   [`backend/controllers/adminBookingController.js`](file:///c:/Users/user/OneDrive/M%C3%A1y%20t%C3%ADnh/tutor-management/backend/controllers/adminBookingController.js): Xử lý logic cho Admin quản lý, xem thống kê và quyền hủy lịch.
*   [`backend/routes/adminBookings.js`](file:///c:/Users/user/OneDrive/M%C3%A1y%20t%C3%ADnh/tutor-management/backend/routes/adminBookings.js): Định nghĩa API bảo mật cho Admin quản lý đặt lịch.
*   [`backend/controllers/walletController.js`](file:///c:/Users/user/OneDrive/M%C3%A1y%20t%C3%ADnh/tutor-management/backend/controllers/walletController.js): Xử lý truy vấn số dư (`balance`), lịch sử giao dịch và logic nạp tiền (`deposit`).
*   [`backend/routes/wallet.js`](file:///c:/Users/user/OneDrive/M%C3%A1y%20t%C3%ADnh/tutor-management/backend/routes/wallet.js): Định nghĩa API nạp tiền và quản lý ví tiền.

### 🎨 Phía Frontend (Giao diện)
*   [`frontend/src/components/common/DepositModal.jsx`](file:///c:/Users/user/OneDrive/M%C3%A1y%20t%C3%ADnh/tutor-management/frontend/src/components/common/DepositModal.jsx): Popup nạp tiền hiện đại, hỗ trợ chọn nhanh các mệnh giá hoặc **tự nhập số tiền** mong muốn. Đặc biệt tích hợp tính năng **Chuyển khoản Ngân hàng** chuyên nghiệp với menu chọn ngân hàng thụ hưởng (MBBank, Vietcombank, Techcombank) và chế độ 2 Tab (Quét mã QR VietQR động hoặc Tự nhập thông tin thủ công kèm các nút Copy tiện lợi).
*   [`frontend/src/pages/User/WalletPage.jsx`](file:///c:/Users/user/OneDrive/M%C3%A1y%20t%C3%ADnh/tutor-management/frontend/src/pages/User/WalletPage.jsx): Trang Ví tiền hiển thị số dư thực tế, tự động làm mới khi nạp tiền thành công và liệt kê lịch sử giao dịch theo mốc thời gian.
*   [`frontend/src/pages/User/BookingPage.jsx`](file:///c:/Users/user/OneDrive/M%C3%A1y%20t%C3%ADnh/tutor-management/frontend/src/pages/User/BookingPage.jsx): Trang đặt lịch của học viên kèm tìm kiếm, bộ lọc môn học và Modal đặt lịch.
*   [`frontend/src/pages/User/BookingHistoryPage.jsx`](file:///c:/Users/user/OneDrive/M%C3%A1y%20t%C3%ADnh/tutor-management/frontend/src/pages/User/BookingHistoryPage.jsx): Trang theo dõi lịch đặt, tích hợp Modal hủy lịch có cảnh báo rõ ràng về quy định hoàn tiền.
*   [`frontend/src/pages/Admin/AdminBookingManagement.jsx`](file:///c:/Users/user/OneDrive/M%C3%A1y%20t%C3%ADnh/tutor-management/frontend/src/pages/Admin/AdminBookingManagement.jsx): Dashboard Admin quản lý đặt lịch kèm 4 thẻ thống kê và bộ lọc thông minh.

---

## ⚙️ 2. Quy Trình Nghiệp Vụ Đặt Lịch & Hủy Lịch

## ⚡ Luồng Hoạt Động Tóm Tắt

**📘 Học viên:**
```
Nạp tiền vào ví → Tìm gia sư → Đặt lịch (trừ 100k ví) → Chờ xác nhận (pending)
   │
   ├─ Hủy khi đang "Chờ xác nhận"   → Hoàn 100k về ví ✅
   └─ Hủy khi đã "Đã xác nhận"      → Không hoàn tiền ❌ (bồi thường gia sư)
```

**🔑 Admin:**
```
Xem tất cả lịch đặt → Hủy bất kỳ lịch nào → Hoàn tiền tự động cho học viên 
```

---

## ⚙️ 2. Quy Trình Nghiệp Vụ Đặt Lịch & Hủy Lịch

### A. Quy trình Đặt Lịch (Học viên)
1. **Tìm kiếm:** Học viên tìm kiếm gia sư có trạng thái `"Sẵn sàng nhận lớp"`.
2. **Chọn & Nhập thông tin:** Bấm nút **Đặt lịch** -> Chọn môn, thời gian và gửi lời nhắn.
3. **Thanh toán phí đặt lịch:**
    *   Hệ thống kiểm tra số dư ví học viên. Phí đặt lịch cố định là **100.000đ**.
    *   Nếu ví không đủ tiền, hệ thống thông báo cần nạp thêm tiền.
    *   Nếu đủ tiền, trừ **100.000đ** trong tài khoản, tạo bản ghi thanh toán trong bảng `transactions`.
4. **Trạng thái ban đầu:** Lịch đặt ở trạng thái `"Chờ xác nhận" (pending)`.

### B. Quy trình Hủy Lịch 2 Trường Hợp
Hệ thống áp dụng quy định hủy lịch chặt chẽ nhằm bảo vệ quyền lợi của cả học viên và gia sư:

*   **Trường hợp 1: Hủy khi đang chờ xác nhận (Pending)**
    *   Áp dụng khi lịch chưa được gia sư phản hồi.
    *   Hệ thống cập nhật trạng thái thành `"Đã hủy" (cancelled)`.
    *   **Hoàn tiền 100% (100.000đ)** tự động cộng lại vào số dư ví của học viên, đồng thời ghi nhận lịch sử hoàn tiền rõ ràng.
*   **Trường hợp 2: Hủy khi gia sư đã xác nhận (Confirmed)**
    *   Áp dụng khi gia sư đã đồng ý nhận lớp và chuẩn bị bài giảng.
    *   Hệ thống cho phép học viên hủy lịch nhưng sẽ xuất hiện bảng cảnh báo: *"Theo quy định, hủy lịch đã xác nhận sẽ không được hoàn lại phí đặt lịch (để bồi thường công sức chuẩn bị của gia sư)"*.
    *   Khi xác nhận hủy, lịch chuyển sang trạng thái `cancelled` và **không hoàn tiền** vào ví.
*   **Admin hủy (Sự cố bất khả kháng):** Admin có quyền hủy lịch và hệ thống tự động hoàn tiền 100% cho học viên.

---

## 🛡️ 3. Quản Lý Ví Tiền & Nạp Tiền (Học viên)

*   **Xem số dư thực tế:** Trang Ví tiền hiển thị số dư khả dụng truy vấn trực tiếp từ cột `balance` của bảng `users`.
*   **Nạp tiền linh hoạt (Tự chọn số tiền):** Cho phép chọn nhanh các mức gợi ý hoặc **tự nhập số tiền** bất kỳ theo nhu cầu.
*   **Thanh toán Chuyển khoản Cao cấp (2 Tab):** 
    - **Tự chọn Ngân hàng thụ hưởng**: Hỗ trợ dropdown chọn nhanh giữa ngân hàng lớn (MBBank).
    - **Tab Quét mã QR**: Tạo mã VietQR động chính xác số tiền và nội dung chuyển khoản.
    - **Tab Tự nhập thông tin thủ công**: Ẩn QR, liệt kê chi tiết STK, Tên CTK, Số tiền, Nội dung chuyển kèm các nút **Copy (Sao chép)** nhanh chóng để học viên tự chuyển khoản qua app.
*   **Lịch sử giao dịch minh bạch:** Danh sách các khoản nạp tiền (màu xanh lá) và thanh toán đặt lịch (màu đỏ) được cập nhật liên tục theo thời gian thực.

---
Bấm "Nạp tiền ngay" → Nhập số tiền mong muốn → Chọn "Chuyển khoản Ngân hàng"
        │
        ▼
[Bước 2: Màn hình Thanh toán] → Chọn Ngân hàng thụ hưởng (MBBank)
        │
        ├─► Tab "Quét mã QR"        → Quét mã QR VietQR động trên app ngân hàng
        │
        └─► Tab "Tự nhập" (Ẩn QR)   → Bấm Copy STK + Nội dung để tự chuyển khoản
        │
        ▼
Bấm "Tôi đã chuyển khoản xong" → Backend cộng số dư ví (Balance + Tiền nạp) → Ghi lịch sử giao dịch ✅


## 🛠️ 4. Hướng Dẫn Chạy & Kiểm Tra Trực Tiếp

### Bước 1: Khởi động hệ thống
Đảm bảo bạn đang ở thư mục gốc dự án và chạy lệnh khởi động Docker:
```bash
docker-compose down
docker-compose up -d
```

### Bước 2: Đăng nhập & Trải nghiệm Học viên
1. Đăng ký hoặc Đăng nhập tài khoản học viên tại `http://localhost:5173/login`.
2. Truy cập mục **Ví tiền** -> Bấm **Nạp tiền ngay** -> Nhập số tiền tùy ý và xác nhận nạp thành công.
3. Vào mục **Đặt lịch** -> Tìm gia sư -> Bấm **Đặt lịch** để trải nghiệm trừ tiền tự động.
4. Vào mục **Lịch của tôi**:
   - Bấm **Hủy lịch** trên thẻ đang *Chờ xác nhận (Pending)* để thấy số dư ví được hoàn lại 100k.
   - Bấm **Hủy lịch** trên thẻ *Đã xác nhận (Confirmed)* để thấy thông báo cảnh báo không hoàn tiền theo đúng quy định.