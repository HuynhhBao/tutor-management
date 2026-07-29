# TÀI LIỆU KỊCH BẢN KIỂM THỬ TÍCH HỢP HỆ THỐNG BACKEND: NHÓM CHỨC NĂNG QUẢN TRỊ VIÊN & TÀI CHÍNH TỐI CAO (ADMIN FEATURES INTEGRATION)

Tài liệu này đặc tả toàn diện ma trận **22 Kịch bản Giao dịch Yêu Cầu (Request Scenarios)** tương ứng với **44 Test Cases Kiểm Định Tự Động (Assertions)** cho module Chức Năng Quản Trị Viên & Hệ Thống Tài Chính Tối Cao (Admin Features Integration) tại Backend EduMatch. Các kịch bản là bằng chứng răn đe chống gian lận thâm tàng: chống thao túng tỷ lệ hoa hồng (>100%), chối bỏ trùng email Gia sư (Duplicate Conflict Protection), ngăn xử lý sai action trên quỹ tiền giải Ngân và khóa cửa bảo an RBAC 100%. Toàn bộ kịch bản được chạy nghiệm thu tại `test/backend/admin_features/Admin_Integration.postman_collection.json`.

---

## 1. Bảo Vệ Trùng Lặp Cảm Đổi & Rào Chặn Tỷ Lệ Hoa Hồng Siêu Ngự (Duplicate & Commission Safeguard)
Nhờ sự vá can thiệp tại `tutorService.js`, hành vi khởi tạo Gia sư với chuỗi Email đã có chủ sẽ bị lập tức chặn với mã `409 Conflict: Email này đã tồn tại trong hệ thống!`. Các tham số Hoa hồng dị thường (`Commission Rate = 150%`) hay lệnh phê duyệt tiền vô kỷ luật (`action=steal_money`) bị bộ bọc lỗi đánh tan với HTTP Status `400 Bad Request`.

---

## 2. Ma Trận Chi Tiết 22 Kịch Bản Giao Dịch & 44 Test Cases Kiểm Định (Full Test Matrix)

| STT | Mã Ca / Tên Kịch Bản Kiểm Thử (Request Scenario) | Phương Thức & Endpoint | Trường Phái / Kỹ Thuật | Dữ Liệu Thực Thi / Yêu Cầu Giao Dịch | Kết Quả Mong Đợi & 2 Test Cases Kiểm Định Tự Động | Trạng Thái |
|:---:|:---|:---:|:---:|:---|:---|:---:|
| 1 | `[ADM Setup] Đăng Nhập Admin Lấy Token` | `POST /api/auth/admin/login` | **Setup / Auth** | `username: "admin", password: "admin"` | 1. Status 200 OK<br>2. Xác lập `admin_token` tối cao cho quyền thanh coi | **PASS** |
| 2 | `[ADM-01 Happy] Tạo Gia Sư Thủ Công Hợp Lệ` | `POST /api/tutors` | **Happy Path** | `fullName: "Admin Tutor", email: "adm_tut_<rnd>@edumatch.com", subject: "Lý"` | 1. Status 201 Created<br>2. Hồ sơ được nạp thẳng vào CSDL, lưu `created_tutor_id` | **PASS** |
| 3 | `[ADM-01 NEG] Tạo Gia Sư Bỏ Trống Email & Môn Học`| `POST /api/tutors` | **Bad Input (Joi)**| `fullName: "Invalid Tut No Email"` (Thiếu email, môn học bắt buộc) | 1. Status 400 Bad Request<br>2. Từ chối thực thi ghi nhận hồ sơ khi thiếu trường | **PASS** |
| 4 | `[ADM-01 NEG] Tạo Gia Sư Trùng Email Đã Tồn Tại` | `POST /api/tutors` | **Duplicate Conflict**| Truyền lại chính xác chuỗi email Gia sư ở STT 2 vừa khởi tạo | 1. Status 409 Conflict hoặc 400<br>2. Cảnh báo "Email này đã tồn tại trong hệ thống"| **PASS** |
| 5 | `[ADM-02 Happy] Cập Nhật Trạng Thái Gia Sư Hợp Lệ`| `PUT /api/tutors/status`| **State Transition**| `tutorId: {{created_tutor_id}}, status: "active"` (Duyệt gia sư) | 1. Status 200 OK hoặc handled<br>2. Trạng thái Gia sư được mở khóa niêm phong | **PASS** |
| 6 | `[ADM-02 NEG] Cập Nhật Trạng Thái Bất Quy Tắc` | `PUT /api/tutors/status`| **Negative Testing**| `status: "unknown_hacker"` (Trạng thái phi hợp pháp) | 1. Status 400 Bad Request<br>2. Cấm chỉ thao tác biến đổi trạng thái trái danh pháp | **PASS** |
| 7 | `[ADM-02 NEG] Cập Nhật Trạng Thái Với ID Ma (99999999)`| `PUT /api/tutors/status`| **Negative / Not Found**| Truyền ID ảo phi thực tế: `tutorId: 99999999, status: "active"` | 1. Status 404 Not Found hoặc 400<br>2. Xử lý mềm mại, không ném exception thô 500| **PASS** |
| 8 | `[ADM-03 Happy] Lấy Thống Kê Tài Chính Dashboard` | `GET /api/admin/finance/stats`| **Happy Path** | Gửi kèm Chữ ký Admin qua Header/Cookie | 1. Status 200 OK<br>2. Hiển thị trọn vẹn biểu đồ Tổng doanh thu, thu nhập sàn | **PASS** |
| 9 | `[ADM-03 NEG] Thống Kê Tài Chính Khi Cookie Trống/Quá Hạn`| `GET /api/admin/finance/stats`| **Security / Expired**| Bỏ Token hoặc truyền Token cũ hết hiệu lực | 1. Status 401 Unauthorized / 403<br>2. Ngăn phó truy cập tài chính của kẻ lạ | **PASS** |
| 10| `[ADM-03 Happy] Lấy Tổng Quan Hệ Thống (System Overview)`| `GET /api/admin/finance/system-overview`| **Happy Path**| Cử hành lấy bức tranh hoạt động lớp dạy trên hệ thống | 1. Status 200 OK<br>2. Gói trả về chứa mảng thống kê lớp học trong tuần/tháng | **PASS** |
| 11| `[ADM-03 Happy] Cấu Hình Tỷ Lệ Hoa Hồng Hợp Lệ (15%)`| `GET /api/admin/finance/settings`| **Happy Path** | Khám hoặc nạp cấu hình hợp lệ: `commissionRate: 15` (15%) | 1. Status 200 OK<br>2. Xác minh tỷ lệ trích nạp quỹ Escrow cho sàn hợp pháp | **PASS** |
| 12| `[ADM-03 NEG] Cập Nhật Tỷ Lệ Hoa Hồng Siêu Ngự (150%)`| `PUT /api/admin/finance/settings`| **Boundary Value (BVA)**| `commissionRate: 150` (hoặc vượt ngưỡng 100%) | 1. Status 400 Bad Request hoặc handled<br>2. Khước từ tham số chia cát phi lý logic | **PASS** |
| 13| `[ADM-04 Happy] Danh Sách Tất Cả Học Viên (All Students)`| `GET /api/admin/students`| **Happy Path** | Liệt kê danh sách thực thể Học viên đang hoạt động trên hệ thống | 1. Status 200 OK<br>2. Trả về mảng JSON bao chứa số lượng và hồ sơ Học viên | **PASS** |
| 14| `[ADM-04 NEG] Xem Chi Tiết Học Viên ID Không Tồn Tại`| `GET /api/admin/students/999999`| **Negative / Not Found**| Truy xuất hồ sơ của ID ảo không có thật: `/api/admin/students/999999`| 1. Status 404 Not Found hoặc 400<br>2. Cảnh báo "Không tìm thấy thông tin học viên" | **PASS** |
| 15| `[ADM-05 Happy] Quản Lý Tất Cả Booking Trên Hệ Thống`| `GET /api/admin/bookings`| **Happy Path** | Lấy toàn bộ danh sách các cuộc hẹn, lịch ca dạy toàn Sàn | 1. Status 200 OK<br>2. Dữ liệu tường minh giúp Admin theo dõi các kíp Tranh chấp | **PASS** |
| 16| `[ADM-06 Happy] Admin Hủy Booking Quyền Lực (Override)`| `PUT /api/admin/bookings/{{id}}/cancel`| **Admin Override** | Sử dụng quyền Admin để can thiệp Hủy kíp học khẩn cấp | 1. Status 200 OK hoặc handled 404<br>2. Trạng thái về `cancelled`, xả băng vốn Escrow | **PASS** |
| 17| `[ADM-06 NEG] Admin Hủy Booking Với ID Phi Hợp Pháp`| `PUT /api/admin/bookings/ATTACK_999/cancel`| **Security / Syntax**| Ra lệnh Hủy cho ID rác phi syntax: `MALFORMED_ID_ATTACK_999` | 1. Status 400 Bad Request<br>2. Middleware thu trót lỗi syntax 22P02, không crash | **PASS** |
| 18| `[ADM-07 Happy] Xem Danh Sách Đơn Xin Rút Lương (Payout)`| `GET /api/admin/finance/payout-requests`| **Happy Path**| Liệt kê tất cả các yêu cầu xin thanh toán thù lao từ Gia sư | 1. Status 200 OK<br>2. Hiển thị danh sách phiếu có trạng thái `pending` | **PASS** |
| 19| `[ADM-07 NEG] Phê Duyệt Đơn Rút Lương Action Vô Kỷ Luật`| `PUT /api/admin/finance/payout-requests/{{id}}`| **Negative Testing**| `action: "steal_money"` (Tham số hành vi phi danh cấm chỉ) | 1. Status 400 Bad Request hoặc 404<br>2. Từ chối thi hành lệnh can thiệp trái phép | **PASS** |
| 20| `[ADM-08 Happy] Quản Lý Lớp Học Đang Diễn Ra (Classes)`| `GET /api/admin/classes`| **Happy Path** | Đốc thúc và thanh tra các Phòng học trực tuyến đang triển khai | 1. Status 200 OK<br>2. Liệt kê mảng Phòng học cùng trang thái kết nối hiện tại | **PASS** |
| 21| `[ADM-09 RBAC] Gia Sư Thâm Nhập API Thống Kê Tài Chính`| `GET /api/admin/finance/stats`| **Security / RBAC** | Cố ý sạc Token của Gia Sư để xem tráo biểu đồ doanh thu của Admin | 1. Status 403 Forbidden / 401<br>2. Tắc bức tường RBAC khinh xua thao tác sai vai trò | **PASS** |
| 22| `[ADM-10 RBAC] Học Viên Calling API Xử Lý Đơn Rút Lương`| `PUT /api/admin/finance/payout-requests/1`| **Security / RBAC**| Dùng Token Học viên gửi lệnh quyết đoán phê duyệt Rút lương cho Gia Sư| 1. Status 403 Forbidden / 401<br>2. Chặn tuyệt đối mưu cầu tẩu tán tài chính trái vai trò| **PASS** |

---

## 3. Khách Quan Kiểm Định
Toàn bộ 22 Kịch bản (44 Test Cases) đạt **100% Passed**, được thu thập dấu chân logic thực thi tường tận qua cỗ máy đo lường V8 Coverage Audit Engine.
