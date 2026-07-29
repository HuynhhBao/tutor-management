# TÀI LIỆU KỊCH BẢN KIỂM THỬ HỘP ĐEN & BVA: NHÓM CÁC MÔ-ĐUN MỞ RỘNG (EXPANSION MODULES)

Tài liệu này đặc tả quy chuẩn thi hành và ma trận kịch bản kiểm thử Hộp đen (Black-Box Testing) dành cho các Phân hệ Mở rộng Nâng cao của EduMatch: Trợ lý trí tuệ nhân tạo (AI Matchmaker NLP), Phòng học trực tuyến (Virtual Classroom Canvas & File Upload Validation), Lịch sử tin nhắn cùng hệ thống thông báo chuông (Real-time Toast Notification). Toàn bộ 8 kịch bản (bao gồm luồng chuẩn bị Auth kép) thực thi tự động qua tệp tin `test/black_box/expansion_modules/Expansion_BlackBox_Collection.postman_collection.json`.

---

## 1. Kỹ Thuật Thử Nghiệm Ngữ Liệu NLP & Ràng Buộc Tệp Tin
- **Thực thi Phân loại Tương đương AI Matchmaker (EP NLP):** Chuyển giao các cụm văn bản tìm kiếm theo ngôn ngữ tự nhiên, phi cấu trúc (ví dụ: *"Tôi cần tìm gia sư dạy Văn lớp 10 ôn thi, vui vẻ nhẹ nhàng, giá dưới 300k/giờ"*). Hệ thống kiểm tra phản ứng chuẩn xác từ Endpoint `/api/ai/matchmaker` (Ca test BB-EXP-03).
- **Kiểm định Bảng vẽ Virtual Classroom Canvas:** Thử nghiệm lưu trạng thái vẽ trực tiếp trên bảng tương tác trực tuyến thông qua chuỗi JSON payload đồng bộ hóa real-time (Ca test BB-EXP-04).
- **Phân loại Ràng buộc Tài liệu Lớp học (Attachment Validation & Size Rules):** Thử nghiệm gọi vào endpoint `/api/class-session/upload` khi cố ý thiếu dữ liệu tệp tin đính kèm (missing file field) $\rightarrow$ Hệ thống áp dụng quy tắc Multer/Cloudinary cự tuyệt với lỗi `400 Bad Request` và lời mời tải lên tài liệu đúng quy cách (Ca test BB-EXP-05).
- **Hệ thống Thông Báo Realtime Toast:** Kiểm tra khả năng đánh dấu đọc toàn bộ chuông báo chí (`PUT /api/notifications/read-all`) và lấy danh sách gói thông báo mới (`GET /api/notifications`).

---

## 2. Ma Trận Chi Tiết Kịch Bản Kiểm Thử Hộp Đen Mở Rộng (Test Matrix)

| Mã Ca Kiểm Thử | Tên Kịch Bản Kiểm Thử | Kỹ Thuật | Dữ Liệu Gửi Đi / Nội Dung Thử Nghiệm | Định Dạng Request | Kết Quả Mong Đợi (Expected Outcome) | Trạng Thái |
|---|---|---|---|---|---|---|
| **BB-EXP-01** | Đăng ký mới Tài khoản Học viên cho test AI | **EP (Register Auth)** | `email, username, password: "Password123!", role: "user"` | `POST /api/auth/register` | Trả về HTTP Status `201 Created` hoặc `400` (nếu trùng email), chuẩn bị môi trường tài khoản riêng. | **PASS** |
| **BB-EXP-02** | Đăng nhập tài khoản Học viên lấy Token Bảo mật | **EP (Login Auth)** | Đăng nhập bằng credentials tạo từ bước 1 | `POST /api/auth/login` | Trả về HTTP Status `200 OK`. Lưu `student_token` phục vụ toàn bộ cụm tính năng mở rộng. | **PASS** |
| **BB-EXP-03** | Trợ lý AI Matchmaker chẩn đoán ngữ liệu tự nhiên | **EP (NLP Match)** | `prompt: "Tôi cần tìm gia sư dạy Văn lớp 10 ôn thi, vui vẻ nhẹ nhàng..."` | `POST /api/ai/matchmaker` | Trả về HTTP Status `200 OK` (hoặc xử lý mượt mà khi AI Engine overload). JSON trả về khuyến nghị chuẩn. | **PASS** |
| **BB-EXP-04** | Lưu Bảng Vẽ Tương Tác Đồng Bộ (Virtual Classroom Canvas) | **EP (Canvas Sync)** | `snapshot: "{\"lines\":[{\"x\":10,\"y\":20,\"color\":\"#3b82f6\"}]}"` | `POST /api/class-session/:id/snapshot` | Trả về HTTP Status `200 OK` (hoặc validation code hợp lệ). Ghi nhận thành công snapshot bảng vẽ. | **PASS** |
| **BB-EXP-05** | Kiểm định Từ chối Tải tệp tin thiếu trường File | **EP (Missing File)**| Gửi request upload trống không kèm File đính kèm | `POST /api/class-session/upload` | Trả về HTTP Status `400 Bad Request`. Thông báo cự tuyệt an ninh: *"Vui lòng chọn file cần tải lên."* | **PASS** |
| **BB-EXP-06** | Truy Xuất Lịch Sử Tin Nhắn Lớp Học Trực Tuyến | **EP (Chat History)**| Truy cập danh sách tin nhắn phòng học theo ID lớp dạy | `GET /api/class-session/:id/messages` | Trả về HTTP Status `200 OK`. Phản hồi chứa payload danh sách trao đổi tin nhắn giữa gia sư và học viên. | **PASS** |
| **BB-EXP-07** | Đánh dấu Tất cả Thông báo là Đã đọc (Realtime Notifications)| **EP (Mark All Read)**| Gửi lệnh cập nhật trạng thái đọc chuông cảnh báo | `PUT /api/notifications/read-all` | Trả về HTTP Status `200 OK`. Đưa trọn vẹn danh sách thông báo về trạng thái đã đọc thành công. | **PASS** |
| **BB-EXP-08** | Lấy Danh Sách Thông Báo Chuông Realtime Toast | **EP (Notification List)**| Truy cập kênh đếm và hiển thị popup thông báo | `GET /api/notifications` | Trả về HTTP Status `200 OK`. Payload JSON hiển thị đầy đủ mảng thông báo của người dùng. | **PASS** |

---

## 3. Tổng Kết Độ Phủ Chức Năng Mở Rộng
Cả 8 kịch bản trên duy trì tính toàn diện cho mô-đun mở rộng hiện đại của EduMatch, từ cơ quan kết nối Gia sư thông minh (AI), Đồng bộ bảng giảng dạy, Quản lý tệp tin tài liệu trực tuyến an toàn cho đến hệ thống cảnh báo Realtime linh hoạt.
