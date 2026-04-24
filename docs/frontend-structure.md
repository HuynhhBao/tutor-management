# 🎨 Cấu trúc Frontend

Frontend được xây dựng bằng React.js, Vite và sử dụng Tailwind CSS cho giao diện.

## 📂 Cấu trúc thư mục `src/`
- `components/`: Chứa các UI components dùng chung (Button, Input, Sidebar, Navbar).
- `context/`: Quản lý state toàn cục (vd: `AuthContext` để lưu thông tin người dùng đã đăng nhập).
- `hooks/`: Các custom hooks.
- `pages/`: Các trang chính của ứng dụng.
  - `Auth/`: Các trang liên quan đến Login, Register, Forgot Password.
  - `Tutor/`: Các trang quản lý gia sư.
  - `User/`: Các trang thông tin cá nhân.
- `services/`: Chứa các hàm gọi API (sử dụng `fetch` hoặc `axios`).
- `routes/`: Cấu hình định tuyến (React Router).

## 🧭 Các trang chính
- **Landing Page**: Trang chủ giới thiệu hệ thống.
- **Login/Register**: Trang đăng nhập và đăng ký cho người dùng.
- **Admin Login**: Trang đăng nhập riêng cho quản trị viên.
- **Dashboard**: Trang quản trị tổng quan sau khi đăng nhập.
- **Tutor Management**: Giao diện CRUD quản lý danh sách gia sư.
- **Profile Page**: Trang xem và cập nhật thông tin cá nhân.

## 💅 Giao diện (Styling)
Sử dụng **Tailwind CSS** để tối ưu hóa việc viết CSS và đảm bảo tính nhất quán của giao diện.
Các hiệu ứng như Glassmorphism và màu sắc hiện đại (tím, xanh slate) được áp dụng xuyên suốt hệ thống.
