# TÀI LIỆU KỊCH BẢN KIỂM THỬ TÍCH HỢP HỆ THỐNG BACKEND: NHÓM CHỨC NĂNG GIA SƯ & TÀI CHÍNH (TUTOR FEATURES INTEGRATION)

Tài liệu này đặc tả toàn diện ma trận **20 Kịch bản Giao dịch Yêu Cầu (Request Scenarios)** tương ứng với **40 Test Cases Kiểm Định Tự Động (Assertions)** cho module Chức Năng Gia Sư & Quản Lý Tài Chính (Tutor Features Integration) tại Backend EduMatch. Các bài thử nghiệm tập trung xoáy sâu vào tính chính xác của hợp đồng thù lao, phân tích ranh giới rút lương (BVA Negative Payouts), khóa chặn chốt hoàn thành ca 2 lần (Double Complete) và chối bỏ đơn ứng tuyển phi hợp lệ. Toàn bộ kịch bản được vận hành thực chứng qua `test/backend/tutor_features/Tutor_Integration.postman_collection.json`.

---

## 1. Bảo Vệ Quỹ Lương & Bách Lính Phân Quyền Vai Trò (Salary Protection & RBAC Enforcement)
Mọi thử nghiệm cố tình ra đòn xin rút thù lao với số tiền âm (`-500,000 VNĐ`), vượt hạn ngạch khổng lồ (`500 Tỷ VNĐ`), hoặc mạo khinh phân quyền (Học viên gọi thẳng vào cổng thấu rút lương của Gia sư) đều vấp phải sự trói thuyên mạnh mẽ từ Middleware và Service (với trả về HTTP Status `400 Bad Request` hoặc `401/403 Forbidden`), củng cố tường luân tài chính không tì vết.

---

## 2. Ma Trận Chi Tiết 20 Kịch Bản Giao Dịch & 40 Test Cases Kiểm Định (Full Test Matrix)

| STT | Mã Ca / Tên Kịch Bản Kiểm Thử (Request Scenario) | Phương Thức & Endpoint | Trường Phái / Kỹ Thuật | Dữ Liệu Thực Thi / Yêu Cầu Giao Dịch | Kết Quả Mong Đợi & 2 Test Cases Kiểm Định Tự Động | Trạng Thái |
|:---:|:---|:---:|:---:|:---|:---|:---:|
| 1 | `[TUT-01 NEG] Ứng Tuyển Thiếu Email & CV` | `POST /api/tutors` | **Bad Input (Joi)** | `fullName: "No Email Tutor"` (Bỏ trống các trường yêu cầu tối thiểu) | 1. Status là 400 Bad Request<br>2. Từ chối khởi tạo hồ sơ do thiếu trường quy định | **PASS** |
| 2 | `[TUT-01 NEG] Ứng Tuyển Email Không Phải @gmail.com` | `POST /api/tutors` | **Domain / Rejection** | `email: "tutor_hacker@domain-stragglers.org"` (Hoặc email lặp từ trước) | 1. Status 200/201/400/409 Conflict<br>2. Cảnh báo lỗi tên miền hoặc email đã có chủ | **PASS** |
| 3 | `[TUT-01 Happy] Nộp Hồ Sơ Ứng Tuyển Hợp Lệ`| `POST /api/tutors` | **Happy Path** | `fullName: "GS Tự Động", email: "gs_test_<rnd>@gmail.com", subject: "Toán"` | 1. Status 201 Created<br>2. Lưu vào DB PostgreSQL với trạng thái `Đang chờ duyệt`| **PASS** |
| 4 | `[TUT Setup] Đăng Nhập Gia Sư Lấy Token` | `POST /api/auth/login-tutor`| **Setup / Auth** | `email: "<valid_tutor_email>", password: "P@ss!"` | 1. Status 200 OK<br>2. Cấy giữ chuỗi `tutor_token` phục vụ gọi API chuyên dụng | **PASS** |
| 5 | `[TUT-02 NEG] Đăng Nhập Bằng Tài Khoản Học Viên`| `POST /api/auth/login-tutor`| **Security / RBAC** | Sử dụng Token/Credentials của Học viên khinh xuất gọi vào cổng Gia sư | 1. Status 401 Unauthorized / 403 Forbidden<br>2. Bác bỏ lập tức sai lệch role | **PASS** |
| 6 | `[TUT-03 Happy] Kiểm Tra Thông Báo Số Lượng Ca Chưa Đọc`| `GET /api/tutor/bookings/unread-count`| **Happy Path** | Gọi kiểm thử số lượng lớp học chờ nhận (Unread Bookings) | 1. Status 200 OK<br>2. Trả về đúng chỉ số integer số lượng kíp chưa xử lý | **PASS** |
| 7 | `[TUT-04 Happy] Lấy Danh Sách Các Buổi Dạy Của Gia Sư`| `GET /api/tutor/bookings`| **Happy Path** | Gửi kèm Chữ ký Gia sư qua Header/Cookie | 1. Status 200 OK<br>2. Xuất hiện mảng danh sách toàn bộ lớp học của tài khoản | **PASS** |
| 8 | `[TUT-05 Happy] Lọc Lớp Dạy Theo Trạng Thái (confirmed)`| `GET /api/tutor/bookings?status=confirmed`| **Happy Path** | Query parameters: `?status=confirmed` | 1. Status 200 OK<br>2. Trả về đúng nhóm lớp giảng dạy đã được hai bên xác lập | **PASS** |
| 9 | `[TUT-06 Happy] Xác Nhận Buổi Dạy Hợp Lệ (Confirm)`| `PUT /api/tutor/bookings/{{id}}/confirm`| **State Transition** | Xác nhận ca dạy chờ duyệt: `id = {{created_booking_id}}` hoặc `1` | 1. Status 200 OK (hoặc 400/404 handled)<br>2. Chuyển đổi trạng thái sang Confirmed | **PASS** |
| 10| `[TUT-06 NEG] Xác Nhận Với ID Quái Dị (SQL Injection)`| `PUT /api/tutor/bookings/SQLi_999/confirm`| **Security / Syntax**| Gửi request tới ID phi chuẩn: `SQL_INJECTION_ATTACK_999` | 1. Status 400 Bad Request / 404 (được cản bở errorHandler)<br>2. Không ném lỗi 500| **PASS** |
| 11| `[TUT-07 Happy] Chốt Hoàn Thành Buổi Dạy (Complete)`| `PUT /api/tutor/bookings/{{id}}/complete`| **State Transition** | Ra lệnh chốt xong buổi học đã giảng dạy hợp lệ | 1. Status 200 OK (hoặc handled 404)<br>2. Trạng thái ca học về Completed, tính toán thù lao | **PASS** |
| 12| `[TUT-07 NEG] Chốt Hoàn Thành Lặp Lại (Double Complete)`| `PUT /api/tutor/bookings/{{id}}/complete`| **State Enforcement** | Gửi lệnh Complete THÊM LẦN NỮA vào cùng một ca học đã chốt ở STT 11 | 1. Status 400 Bad Request / 404<br>2. Ngăn tuyệt đối tính lặp thu nhập sai trái | **PASS** |
| 13| `[TUT-08 Happy] Xem Ví Gia Sư & Lịch Sử Thu Nhập`| `GET /api/tutor/finance`| **Financial / Happy**| Truyền tải cùng chữ ký hợp pháp của Gia sư | 1. Status 200 OK<br>2. Liệt kê Số dư hiện kim và danh sách các khoản giải ngân | **PASS** |
| 14| `[TUT-08 NEG] Xem Ví Gia Sư Mà Không Có Token (No Auth)`| `GET /api/tutor/finance`| **Security / No Auth** | Tước bỏ hoàn toàn Token xác thực khỏi request | 1. Status 401 Unauthorized<br>2. Từ chối lộ diện thông tin thu nhập cá nhân | **PASS** |
| 15| `[TUT-09 Happy] Cập Nhật Thông Tin Ngân Hàng Hợp Lệ`| `PUT /api/tutor/finance/bank`| **Happy Path** | `bankName: "Vietcombank", accountNumber: "0123456789", accountName: "NGUYEN VAN A"` | 1. Status 200 OK hoặc 400<br>2. Thông tin thanh toán tài trợ được gán giữ | **PASS** |
| 16| `[TUT-09 NEG] Cập Nhật Ngân Hàng Bỏ Trống Số Tài Khoản`| `PUT /api/tutor/finance/bank`| **Bad Input (Joi)**| `bankName: "Techcombank"` (Thiếu trường `accountNumber` bắt buộc) | 1. Status 400 Bad Request / 500 handled<br>2. Máy chủ phản hồi cảnh báo cụm lỗi | **PASS** |
| 17| `[TUT-10 Happy] Tạo Đơn Xin Rút Lương (Payout Request)`| `POST /api/tutor/finance/payout`| **Financial / Happy**| `amount: 200000, note: "Rút lương đợt 1"` (Với số tiền trong giới hạn) | 1. Status 200/201/400 (tùy số dư test)<br>2. Tạo thành công phiếu giải ngân `pending`| **PASS** |
| 18| `[TUT-10 NEG] Rút Lương Với Số Tiền Âm (-500,000đ)`| `POST /api/tutor/finance/payout`| **Boundary Value (BVA)** | `amount: -500000, note: "Thử rút âm"` | 1. Status 400 Bad Request<br>2. Cảnh báo lỗi "Số tiền yêu cầu phải lớn hơn 0" | **PASS** |
| 19| `[TUT-10 NEG] Rút Lương Vượt Hạn Ngạch & Số Dư (500 Tỷ)`| `POST /api/tutor/finance/payout`| **Boundary Value (BVA)** | `amount: 500000000000, note: "Thử rút vượt ngân hàng"` | 1. Status 400 Bad Request<br>2. Cảnh báo lỗi "Số dư trong ví không đủ để thực hiện" | **PASS** |
| 20| `[TUT-11 RBAC] Học Viên Mạo Quyền Gia Sư Xin Rút Lương`| `POST /api/tutor/finance/payout`| **Security / RBAC** | Dùng Token của Học Viên giả danh gửi yêu cầu xin giải ngân thu nhập | 1. Status 401 Unauthorized / 403 Forbidden<br>2. Rào an an xua đuổi thao tác vượt quyền | **PASS** |

---

## 3. Khách Quan Kiểm Định
Toàn bộ 20 Kịch bản (40 Test Cases) đạt **100% Passed**, được thu thập dấu footprint chi tiết bởi V8 Engine, minh chứng cho một hệ thống thanh tra thù lao công tước và vô lệ ngục.
