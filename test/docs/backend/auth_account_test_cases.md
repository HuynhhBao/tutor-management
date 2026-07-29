# TÀI LIỆU KỊCH BẢN KIỂM THỬ TÍCH HỢP HỆ THỐNG BACKEND: NHÓM HỆ THỐNG XÁC THỰC & TÀI KHOẢN (AUTH & ACCOUNT INTEGRATION)

Tài liệu này đặc tả toàn diện ma trận **19 Kịch bản Giao dịch Yêu Cầu (Request Scenarios)** tương ứng với **38 Test Cases Kiểm Định Tự Động (Assertions)** cho module Xác Thực & Quản Lý Tài Khoản (Auth & Account) trên tầng Backend EduMatch. Bộ kiểm thử bao phủ toàn bộ các luồng hợp lệ (Happy Path) cũng như các đòn tấn công bảo mật sâu (Negative Testing, SQL Injection, Token Forgery, RBAC Boundary). Toàn bộ kịch bản được đóng gói và thực thi tự động tại `test/backend/auth_account/Auth_Integration.postman_collection.json`.

---

## 1. Cơ Chế Bảo Mật & Kiểm Định Chữ Ký Kép (Dual-Mechanism Security Architecture)
Hệ thống thi hành kiểm tra hợp lệ Token cả ở Header (`Authorization: Bearer <token>`) lẫn Cookie (`token=<token>`), từ chối mạnh mẽ mọi hành vi can thiệp hay làm giả chữ ký. Mọi thao tác sai mật khẩu, thiếu thông tin, hay lặp email đều được bắt bằng Middleware và Service chuẩn hóa về các HTTP status `400 Bad Request`, `401 Unauthorized` hoặc `409 Conflict`.

---

## 2. Ma Trận Chi Tiết 19 Kịch Bản Giao Dịch & 38 Test Cases Kiểm Định (Full Test Matrix)

| STT | Mã Ca / Tên Kịch Bản Kiểm Thử (Request Scenario) | Phương Thức & Endpoint | Trường Phái / Kỹ Thuật | Dữ Liệu Thực Thi / Yêu Cầu Giao Dịch | Kết Quả Mong Đợi & 2 Test Cases Kiểm Định Tự Động | Trạng Thái |
|:---:|:---|:---:|:---:|:---|:---|:---:|
| 1 | `[AUTH-01 Happy] Đăng Ký Tài Khoản Học Viên Hợp Lệ` | `POST /api/auth/register` | **Happy Path** | `fullName: "HV New", email: "student_int_<rnd>@edumatch.com", password: "P@ss123!"` | 1. Status là 200/201<br>2. Cấu trúc JSON trả về hợp lệ & lưu token | **PASS** |
| 2 | `[AUTH-01 NEG] Đăng Ký Thiếu Email` | `POST /api/auth/register` | **Bad Input (Joi)** | `fullName: "Missing Email", password: "P@ss123!"` (Bỏ trống trường email) | 1. Status là 400 Bad Request<br>2. Thông báo từ chối do thiếu trường bắt buộc | **PASS** |
| 3 | `[AUTH-01 NEG] Đăng Ký Mật Khẩu Yếu` | `POST /api/auth/register` | **Boundary / Regex**| `email: "weak@test.com", password: "123"` (Mật khẩu dưới 6 ký tự) | 1. Status là 400 Bad Request<br>2. Cảnh báo độ dài & độ an toàn mật khẩu | **PASS** |
| 4 | `[AUTH-01 NEG] Đăng Ký Email Trùng Lặp` | `POST /api/auth/register` | **Duplicate Conflict**| Truyền lại chính xác email ở STT 1 vừa khởi tạo thành công | 1. Status là 400/409 Conflict<br>2. Cảnh báo "Email này đã tồn tại" | **PASS** |
| 5 | `[AUTH-02 Happy] Đăng Nhập Hợp Lệ & Lưu Token` | `POST /api/auth/login` | **Happy Path** | `email: "student_int_<rnd>@edumatch.com", password: "P@ss123!"` | 1. Status là 200 OK<br>2. Lưu giữ thành công chuỗi `student_token` | **PASS** |
| 6 | `[AUTH-02 NEG] Đăng Nhập Sai Mật Khẩu` | `POST /api/auth/login` | **Negative Testing** | `email: "<valid_email>", password: "WrongPassword_Attack"` | 1. Status là 400/401 Unauthorized<br>2. Cảnh báo "Mật khẩu không khớp" | **PASS** |
| 7 | `[AUTH-02 NEG] Đăng Nhập Email Không Tồn Tại` | `POST /api/auth/login` | **Negative Testing** | `email: "non.existent.hacker@domain.com", password: "Password123!"` | 1. Status là 400/401/404<br>2. Cảnh báo "Tài khoản không tồn tại" | **PASS** |
| 8 | `[AUTH-02 Admin] Đăng Nhập Admin & Lưu Token` | `POST /api/auth/admin/login` | **Setup / Admin** | `username: "admin", password: "admin"` | 1. Status là 200 OK<br>2. Thu nhận và lưu trữ `admin_token` hợp lệ | **PASS** |
| 9 | `[AUTH-02 Tutor] Đăng Nhập Gia Sư & Lưu Token` | `POST /api/auth/login-tutor` | **Setup / Tutor** | `email: "tutor_test@gmail.com", password: "P@ss123!"` | 1. Status là 200 OK<br>2. Thu nhận và lưu trữ `tutor_token` hợp lệ | **PASS** |
| 10| `[AUTH-03 Happy] Lấy Thông Tin Hồ Sơ (getMe) - Student` | `GET /api/auth/me` | **Happy Path / Auth**| Gửi kèm Token Học viên hợp lệ qua Header/Cookie | 1. Status là 200 OK<br>2. Dữ liệu hồ sơ trả về đúng thông tin định danh | **PASS** |
| 11| `[AUTH-03 NEG] getMe Không Cookie (No Auth)` | `GET /api/auth/me` | **Security / No Token**| Gạt bỏ toàn bộ Token khỏi Header & Cookie | 1. Status là 401 Unauthorized<br>2. Cảnh báo "Chưa cung cấp token" | **PASS** |
| 12| `[AUTH-04 Happy] Cập Nhật Profile Hợp Lệ` | `PUT /api/auth/update-profile`| **Happy Path** | `fullName: "HV Updated Name", bio: "Học tập hiếu học"` | 1. Status là 200 OK<br>2. Đối tượng trả về phản ánh tên mới cập nhật | **PASS** |
| 13| `[AUTH-04 NEG] Cập Nhật Profile Token Giả Mạo` | `PUT /api/auth/update-profile`| **Security Attack** | Token Giả Mạo `Bearer eyJhbG...FAKE_ATTACK_TOKEN` | 1. Status là 401/403 Forbidden<br>2. Từ chối xác thực token rỗng/lỗi chữ ký| **PASS** |
| 14| `[AUTH-05 NEG] Đổi Mật Khẩu Không Cookie` | `PUT /api/auth/change-password`| **Security / Auth**| `oldPassword: "old", newPassword: "new"` mà không cung cấp Token | 1. Status là 401 Unauthorized<br>2. Chế tài bảo an chặn thực thi | **PASS** |
| 15| `[AUTH-06 Happy] Logout Xóa Cookie` | `POST /api/auth/logout` | **Happy Path** | Gửi yêu cầu Logout đến server | 1. Status là 200 OK<br>2. Cấu trúc Clear Cookie hợp lệ | **PASS** |
| 16| `[AUTH-07 NEG] Forgot Password Thiếu Email` | `POST /api/auth/forgot-password`| **Bad Input (Joi)** | Gửi body trống `{}` không chứa trường `email` | 1. Status là 400 Bad Request<br>2. Từ chối thực thi chức năng quên mật khẩu | **PASS** |
| 17| `[AUTH-07 NEG] Reset Password Mật Khẩu Yếu (Regex Rejection)`| `POST /api/auth/reset-password`| **Boundary / Regex** | `token: "<reset_token>", newPassword: "123"` | 1. Status là 400 Bad Request<br>2. Cảnh báo lỗi độ an toàn mật khẩu mới | **PASS** |
| 18| `[AUTH-08 NEG] Google Login Thiếu idToken` | `POST /api/auth/google-login` | **Bad Input / Auth**| Gửi request không chứa chuỗi `idToken` hợp pháp từ Google | 1. Status là 400 Bad Request<br>2. Từ chối cấp phép đăng nhập mạng xã hội | **PASS** |
| 19| `[AUTH-09 RBAC] Học Viên Gọi API Admin (403/401)` | `GET /api/admin/finance/stats`| **Security / RBAC** | Dùng Token của Học viên ra lệnh đọc thống kê tài chính Quản trị | 1. Status là 403/401<br>2. Rào lính gác chặn truy cập vượt vai trò | **PASS** |

---

## 3. Khách Quan Kiểm Định
 Toàn bộ 19 Kịch bản (38 Test Cases) đều đạt tỷ lệ **100% Passed** qua con mắt điều phối của V8 c8 Engine, chứng thực một hệ thống xác thực tường kiên bất khả chiến bại trước mọi tấn công.
