# 👤 Quản lý Tài khoản Người dùng

Người dùng có thể quản lý thông tin cá nhân và bảo mật tài khoản sau khi đăng nhập.

## 1. Xem thông tin cá nhân (`GET /api/auth/me`)
- API này lấy thông tin từ JWT trong cookie để xác định người dùng hiện tại.
- Trả về: ID, Email, Họ tên, Số điện thoại và Vai trò.

## 2. Cập nhật hồ sơ (`PUT /api/auth/update-profile`)
- Người dùng có thể thay đổi **Họ tên** và **Số điện thoại**.
- Chức năng này áp dụng cho cả người dùng thường và quản trị viên.

## 3. Đổi mật khẩu (`PUT /api/auth/change-password`)
- **Yêu cầu**: Phải nhập đúng mật khẩu hiện tại.
- **Ràng buộc mật khẩu mới**: Phải tuân thủ quy tắc bảo mật (8 ký tự, chữ hoa, ký tự đặc biệt).
- Sau khi đổi thành công, mật khẩu mới sẽ được mã hóa lại bằng `bcrypt`.

## 4. Đăng xuất (`POST /api/auth/logout`)
- Xóa cookie `token` trên trình duyệt của người dùng.
