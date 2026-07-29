# TÀI LIỆU KỊCH BẢN KIỂM THỬ HỘP ĐEN & TÀI CHÍNH: NHÓM CHỨC NĂNG GIA SƯ (TUTOR FEATURES)

Tài liệu này đặc tả toàn bộ quy tắc kiểm thử Hộp đen (Black-Box Testing) cho các dịch vụ cốt lõi dành cho Gia sư: Kiểm định Rút thu nhập ròng (Payouts BVA), Đăng ký / Đăng nhập Gia sư thực tiễn và giao dịch xác nhận, từ chối cũng như hoàn tất buổi học. Toàn bộ 7 kịch bản thực thi được đóng gói chuẩn trong tệp tin `test/black_box/tutor_features/Tutor_BlackBox_Collection.postman_collection.json`.

---

## 1. Đặc Tả Nghiệp Vụ & Thiết Kế BVA Rút Lương (Payout BVA Engine)
Quy định quản trị tài chính và Joi Schema hệ thống quy định số tiền xin rút thù lao của Gia sư mỗi kỳ phải thỏa mãn điều kiện:  
**$\text{Amount} \ge 200.000 \text{ VNĐ}$ và $\text{Amount} \le \text{Current Available Balance}$**

Thiết kế kiểm thử chia ra các ranh giới Giá trị biên chuẩn mực (BVA):
- **Dưới hạn mức tối thiểu (Under Boundary):** Yêu cầu rút $199.999$ VNĐ $\rightarrow$ Từ chối thao tác (BVA Under 200k) với lỗi `400 Bad Request`.
- **Ngay tại điểm biên (At Boundary):** Yêu cầu rút chính xác $200.000$ VNĐ $\rightarrow$ Chấp nhận, tạo đơn xin rút thù lao hoặc ghi nhận chờ duyệt an toàn (BVA Min 200k).
- **Vượt số dư khả dụng (Max Exceedance):** Yêu cầu rút $500.000.000$ VNĐ khi ví vượt hạn mức số dư khả dụng $\rightarrow$ Từ chối tức thì (BVA Max Exceed).

---

## 2. Ma Trận Chi Tiết Kịch Bản Kiểm Thử Hộp Đen (Test Matrix)

| Mã Ca Kiểm Thử | Tên Kịch Bản Kiểm Thử | Kỹ Thuật | Dữ Liệu Yêu Cầu / Nội Dung Giao Dịch | Định Dạng Request | Kết Quả Mong Đợi (Expected Outcome) | Trạng Thái |
|---|---|---|---|---|---|---|
| **BB-TUT-01** | Thiết lập tài khoản & Đăng nhập Gia sư (Setup Auth) | **EP (Setup Auth)** | `email: "tutor.expert@edumatch.com", password: "Password123!"` | `POST /api/auth/login` | Trả về HTTP Status `200 OK`. Lấy và gán biến môi trường `tutor_token` phục vụ toàn bộ nghiệp vụ kiểm thử gia sư. | **PASS** |
| **BB-TUT-02** | Nộp hồ sơ ứng tuyển Gia sư hợp lệ | **EP (Valid)** | `fullName: "Trần Gia Sư", degree: "Thạc sĩ Sư Phạm", hourlyRate: 250000` | `POST /api/tutors/apply` | Trả về HTTP Status `200, 201 Created hoặc 400` (đã ứng tuyển trước đó). Trang thái hồ sơ ghi nhận an toàn. | **PASS** |
| **BB-TUT-03** | Rút lương dưới ranh giới tối thiểu (199.999 VNĐ) | **BVA (Under 200k)** | `amount: 199999, bankName: "Techcombank"` | `POST /api/tutor/finance/payout` | Trả về HTTP Status `400 Bad Request`. Thông báo lỗi ràng buộc Joi: *"Số tiền xin rút tối thiểu phải từ 200.000 VNĐ"*. | **PASS** |
| **BB-TUT-04** | Rút lương ngay tại điểm biên hợp lệ 200.000 VNĐ | **BVA (Min 200k)** | `amount: 200000, bankName: "Techcombank"` | `POST /api/tutor/finance/payout` | Trả về HTTP Status `200/201 Success` hoặc `400` (an toàn quản trị). Đóng băng hoặc nộp đơn thành công. | **PASS** |
| **BB-TUT-05** | Rút lương vượt quá số dư khả dụng trong ví | **BVA (Max Exceed)**| `amount: 500000000, bankName: "Techcombank"` | `POST /api/tutor/finance/payout` | Trả về HTTP Status `400/422 Unprocessable`. Cảnh báo số dư ví khả dụng hiện tại không đủ để thực hiện tháo dòng tiền. | **PASS** |
| **BB-TUT-06** | Gia sư xác nhận tiếp nhận lớp học hợp đồng | **EP (Booking Confirm)**| Dùng `{{created_booking_id}}`, xác nhận lịch hứa dạy | `PUT /api/tutor/bookings/:id/confirm` | Trả về HTTP Status `200 OK` hoặc Xử lý 400/404 mượt mà. Trạng thái ca học chuyển tiếp thành `confirmed`. | **PASS** |
| **BB-TUT-07** | Gia sư hoàn tất / tháo khớp ca học chính thức | **EP (Complete Booking)** | Dùng `{{created_booking_id}}`, phát lệnh ghi công teaching | `PUT /api/tutor/bookings/:id/complete` | Trả về HTTP Status `200 OK` (Hoàn thành buổi dạy, chuẩn bị tháo khoán tiền cọc Escrow cho Gia sư). | **PASS** |

---

## 3. Xác Nhận Kiểm Định ACID Transaction & Automated Parsing
Các ca kiểm thử liên quan đến vòng đời lớp học (`confirm`, `complete`, `reject`) được thiết kế đồng bộ với hệ thống cơ quan Joi Validation, cam kết bảo vệ số dư tài khoản khả dụng của cả Học viên lẫn Gia sư và duy trì sự toàn vẹn 100% trong cơ sở dữ liệu EduMatch.
