# 🔐 Xác thực & Bảo mật (Authentication)

Hệ thống sử dụng JWT (JSON Web Token) để xác thực và Bcrypt để mã hóa mật khẩu.

## 1. Đăng ký tài khoản (`/api/auth/register`)
- **Ràng buộc Email**: Chỉ chấp nhận email có đuôi `@gmail.com`.
- **Ràng buộc Mật khẩu**:
  - Ít nhất 8 ký tự.
  - Phải có ít nhất 1 chữ hoa.
  - Phải có ít nhất 1 ký tự đặc biệt.
- **Mã hóa**: Mật khẩu được hash bằng `bcrypt` trước khi lưu vào DB.

## 2. Đăng nhập
Hệ thống có 2 loại đăng nhập riêng biệt:
- **Người dùng thường (`/api/auth/login`)**: Sử dụng email và mật khẩu.
- **Quản trị viên (`/api/auth/admin/login`)**: Sử dụng username và mật khẩu (dành cho Admin).

Sau khi đăng nhập thành công, một JWT sẽ được lưu vào `httpOnly cookie` tên là `token`.

## 3. Quên mật khẩu (`/api/auth/forgot-password`)
Quy trình đặt lại mật khẩu qua 3 bước:
1. **Gửi OTP**: Hệ thống tạo mã OTP ngẫu nhiên (6 chữ số), lưu vào bộ nhớ tạm (`Map`) với thời gian hết hạn là 5 phút và gửi qua email cho người dùng.
2. **Xác thực OTP (`/api/auth/verify-otp`)**: Kiểm tra mã OTP người dùng nhập vào. Nếu đúng, đánh dấu email đã xác thực.
3. **Đặt lại mật khẩu (`/api/auth/reset-password`)**: Sau khi xác thực OTP thành công, người dùng có thể đặt mật khẩu mới (phải tuân thủ quy tắc bảo mật mật khẩu).

## 4. Phân quyền (RBAC)
Token JWT chứa thông tin `role`:
- `user`: Người dùng thông thường (Học viên/Phụ huynh).
- `admin`: Quản trị viên hệ thống.
- `tutor`: Gia sư.

Dựa vào `role`, frontend và backend sẽ giới hạn quyền truy cập các chức năng tương ứng.
