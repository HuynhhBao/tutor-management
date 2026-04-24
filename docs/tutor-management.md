# 🎓 Quản lý Gia sư (Tutor Management)

Chức năng này cho phép quản lý danh sách gia sư trong hệ thống qua các API tại `/api/tutors`.

## Các API chính
- **Lấy danh sách gia sư (`GET /api/tutors`)**: Trả về toàn bộ danh sách gia sư, sắp xếp theo thời gian tạo mới nhất.
- **Thêm gia sư mới (`POST /api/tutors`)**: 
  - **Dữ liệu**: `fullName`, `gender`, `age`, `subject`, `qualification`.
- **Cập nhật thông tin gia sư (`PUT /api/tutors/:id`)**: Cho phép sửa thông tin của một gia sư dựa trên ID.
- **Xóa gia sư (`DELETE /api/tutors/:id`)**: Xóa vĩnh viễn gia sư khỏi hệ thống.

## Cấu trúc dữ liệu Gia sư
Trường | Kiểu dữ liệu | Mô tả
--- | --- | ---
`id` | Serial/Int | Khóa chính
`full_name` | String | Họ và tên gia sư
`gender` | String | Giới tính
`age` | Integer | Tuổi
`subjects` | String | Các môn học đảm nhận
`qualification` | String | Trình độ chuyên môn (Sinh viên, Giáo viên, ...)
`created_at` | Timestamp | Thời gian tạo bản ghi
