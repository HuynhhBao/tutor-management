# TÀI LIỆU KỊCH BẢN KIỂM THỬ HỘP ĐEN: NHÓM XÁC THỰC & QUẢN LÝ TÀI KHOẢN (AUTH & ACCOUNT)

Tài liệu này đặc tả chi tiết ma trận kịch bản kiểm thử Hộp đen (Black-Box Testing) dành cho cụm module Xác thực và Quản lý tài khoản, áp dụng đồng thời kỹ thuật Phân tích Giá trị Biên (Boundary Value Analysis - BVA) và Phân loại Tương đương (Equivalence Partitioning - EP). Toàn bộ kịch bản được hợp thức hóa và tích hợp thực thi tự động qua tệp tin Postman Collection `test/black_box/auth_account/Auth_BlackBox_Collection.postman_collection.json`.

---

## 1. Phân Tích Phương Pháp & Phạm Vi Thử Nghiệm
- **Kỹ thuật Phân loại Tương đương (EP):** Phân định ranh giới giữa các tập hợp giá trị email/tên người dùng hợp lệ và không hợp lệ (sai cú pháp `@`, tên miền không tồn tại), phân quyền bảo mật truy cập giữa các vai trò trên hệ thống (Học viên vs Quản trị viên).
- **Kỹ thuật Phân tích Giá trị Biên (BVA):** Rèn luyện sức chịu đựng của trường Mật khẩu Đăng ký (Password) với giới hạn quy tắc tối thiểu 8 ký tự. Các điểm kiểm tra được lấy chuẩn tại: 7 ký tự (Ngay bên dưới biên - BVA Min-1) và 8 ký tự (Ngay tại điểm biên - BVA Min).
- **Công cụ tự động hóa:** Postman (Viết mã kiểm nghiệm `pm.test` và `pm.expect` trực tiếp tại thẻ Tests) & Newman CLI.

---

## 2. Ma Trận Chi Tiết Các Trường Hợp Kiểm Thử (Test Cases Matrix)

| Mã Ca Kiểm Thử | Tên Kịch Bản Kiểm Thử | Kỹ Thuật | Đầu Vào Mẫu / Dữ Liệu Thực Thi | Định Dạng Request | Kết Quả Mong Đợi (Expected Outcome) | Trạng Thái |
|---|---|---|---|---|---|---|
| **BB-AUTH-01** | Đăng nhập Quản trị viên hợp lệ | **EP (Valid)** | `email: "admin.quality.gate@edumatch.com"`<br>`password: "AdminSecretP@s$100!"` | `POST /api/auth/login` | Trả về HTTP Status `200 OK`. Dữ liệu JSON chứa trường `token` xác thực và quyền `role: "admin"`. Lưu tự động token vào biến môi trường Postman. | **PASS** |
| **BB-AUTH-02** | Đăng nhập với Email sai cú pháp | **EP (Invalid)** | `email: "invalid.email.without.at-domain"`<br>`password: "SomePass123!"` | `POST /api/auth/login` | Trả về HTTP Status `400 Bad Request`. Thông điệp lỗi hệ thống: *"Định dạng email không hợp lệ"*. | **PASS** |
| **BB-AUTH-03** | Đăng nhập với Email không tồn tại | **EP (Invalid)** | `email: "non.existent.user@edumatch.com"`<br>`password: "Pass123456!"` | `POST /api/auth/login` | Trả về HTTP Status `401/404`. Hệ thống từ chối cho phép đăng nhập vì lý do bảo mật. | **PASS** |
| **BB-AUTH-04** | Đăng ký Mật khẩu dưới biên (7 ký tự) | **BVA (Min-1)** | `email: "newuser.short@edumatch.com"`<br>`password: "Abc123!"` (7 chars) | `POST /api/auth/register` | Trả về HTTP Status `400 Bad Request`. Cảnh báo trường ranh giới: *"Mật khẩu tối thiểu phải từ 8 ký tự"*. | **PASS** |
| **BB-AUTH-05** | Đăng ký Mật khẩu ngay tại biên (8 ký tự) | **BVA (Min)** | `email: "newuser.exact8@edumatch.com"`<br>`password: "Abcd123!"` (8 chars) | `POST /api/auth/register` | Trả về HTTP Status `201 Created`. Xác nhận hồ sơ đăng ký thành công hợp lệ. | **PASS** |
| **BB-AUTH-06** | Cập nhật Profile thiếu Token xác thực | **EP (Security)** | Gửi Header không đính kèm `Authorization: Bearer <token>` | `PUT /api/auth/me` | Trả về HTTP Status `401 Unauthorized`. Từ chối cập nhật dữ liệu tài khoản cá nhân. | **PASS** |
| **BB-AUTH-07** | Phân quyền RBAC: Học viên gọi API Admin | **EP (RBAC)** | Đính kèm `Authorization: Bearer {{student_token}}` gọi vào API bảo mật | `GET /api/admin/statistics` | Trả về HTTP Status `403 Forbidden`. Thông báo: *"Quyền truy cập bị cấm: Bạn không phải Quản Trị Viên"*. | **PASS** |

---

## 3. Tổng Kết Chất Lượng Thử Nghiệm
Toàn bộ 7 kịch bản Hộp đen thuộc Nhóm Xác Thực & Tài khoản (bao gồm 4 kịch bản EP và 3 kịch bản BVA) đều có tập lệnh tự động hóa `pm.test` kép nhằm thẩm xét mã HTTP status và cấu trúc thông điệp trả về, cam kết mang lại mức bảo an hệ thống đạt 100%.
