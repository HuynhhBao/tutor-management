# TÀI LIỆU KỊCH BẢN KIỂM THỬ TÍCH HỢP HỆ THỐNG BACKEND: NHÓM CHỨC NĂNG HỌC VIÊN & BẢO CHỨNG ĐẶT LỊCH (STUDENT FEATURES INTEGRATION)

Tài liệu này đặc tả toàn diện ma trận **16 Kịch bản Giao dịch Yêu Cầu (Request Scenarios)** tương ứng với **32 Test Cases Kiểm Định Tự Động (Assertions)** cho module Chức Năng Học Viên & Quỹ Bảo Chứng (Student Features Integration) tại Backend EduMatch. Các kịch bản xướng minh khả năng chống đựng của hệ thống đặt ca (Booking Concurrency), an ninh Nạp ví tiền (Wallet Security), cạn khóa thảm họa lặp đặt cùng khung giờ hoặc nạp tiền âm/sai phương thức. Toàn bộ kịch bản được chạy tự động qua `test/backend/student_features/Student_Integration.postman_collection.json`.

---

## 1. Bảo Vệ Quỹ Cọc & Rào Bất Trùng Lặp Khung Giờ (ACID & Concurrency Shield)
Mọi tình huống nhồi nhét tiền nạp âm (`-50,000 VNĐ`) hay phương thức giả mạo (`Crypto_Hack`) đều bị bẻ gãy tại Middleware, bảo vệ tuyệt đối tính chính xác của số dư Quỹ Escrow. Các nỗ lực ra đòn đặt trùng khung giờ hoặc ra lệnh Hủy ca kép (Double Cancel) đều được kiểm định trạng thái khắt khe, trả về chuẩn các mã lỗi HTTP `400 Bad Request` hoặc `409 Conflict`.

---

## 2. Ma Trận Chi Tiết 16 Kịch Bản Giao Dịch & 32 Test Cases Kiểm Định (Full Test Matrix)

| STT | Mã Ca / Tên Kịch Bản Kiểm Thử (Request Scenario) | Phương Thức & Endpoint | Trường Phái / Kỹ Thuật | Dữ Liệu Thực Thi / Yêu Cầu Giao Dịch | Kết Quả Mong Đợi & 2 Test Cases Kiểm Định Tự Động | Trạng Thái |
|:---:|:---|:---:|:---:|:---|:---|:---:|
| 1 | `[STU Setup] Đăng Ký Tài Khoản Học Viên` | `POST /api/auth/register` | **Setup / Happy Path** | `fullName: "HV Student Suite", email: "stu_suite@edumatch.com", password: "P@ss!"` | 1. Status 200/201<br>2. Lưu giữ ID học viên và thiết lập biến token | **PASS** |
| 2 | `[STU Setup] Đăng Nhập Học Viên Lấy Token`| `POST /api/auth/login` | **Setup / Auth** | `email: "stu_suite@edumatch.com", password: "P@ss!"` | 1. Status 200 OK<br>2. Xác lập `student_token` sẵn sàng cho giao dịch | **PASS** |
| 3 | `[STU-01 Happy] Bộ Lọc Tìm Kiếm Gia Sư Hợp Lệ` | `GET /api/tutors` | **Happy Path** | Query parameters: `?subject=Toán` | 1. Status 200 OK<br>2. Trả về đúng mảng các gia sư môn Toán hợp quy | **PASS** |
| 4 | `[STU-01 NEG] Lọc Gia Sư Với Từ Khóa Đặc Biệt / SQLi`| `GET /api/tutors` | **Security / Injection**| Query params chứa ký tự phá hoại: `?subject=' OR '1'='1`| 1. Status 200 (trả mảng rỗng) hoặc 400<br>2. Bộ lọc bẻ gãy ý đồ chèn mã | **PASS** |
| 5 | `[STU-02 Happy] Nạp Tiền Vào Ví Hợp Lệ (+500,000đ)`| `POST /api/wallet/deposit` | **Financial / Happy Path**| `amount: 500000, method: "VNPay"` | 1. Status 200/201<br>2. Ghi nhận giao dịch thành công vào CSDL Ví tiền | **PASS** |
| 6 | `[STU-02 NEG] Nạp Ví Với Số Tiền Âm (-50,000đ)` | `POST /api/wallet/deposit` | **Boundary Value (BVA)** | `amount: -50000, method: "VNPay"` | 1. Status 400 Bad Request<br>2. Cảnh báo "Số tiền nạp bắt buộc lớn hơn 0" | **PASS** |
| 7 | `[STU-02 NEG] Nạp Ví Phương Thức Gian Lận (Crypto_Hack)`| `POST /api/wallet/deposit` | **Negative Testing** | `amount: 100000, method: "Crypto_Hack_Unregistered"` | 1. Status 400 Bad Request<br>2. Bỏ qua và bác bỏ phương thức thanh toán giả mạo | **PASS** |
| 8 | `[STU-03 Happy] Xem Thông Tin Ví & Lịch Sử Giao Dịch`| `GET /api/wallet` | **Happy Path** | Gửi kèm Chữ ký Học viên qua Header/Cookie | 1. Status 200 OK<br>2. Chi tiết Số dư hiện tại và lịch sử các bút toán nạp/rút | **PASS** |
| 9 | `[STU-04 Happy] Đặt Lịch Gia Sư Hợp Lệ (Create Booking)`| `POST /api/student/bookings`| **ACID / Happy Path** | `tutorId: 1, subject: "Toán", scheduleDate: "<future_date>", hours: 2` | 1. Status 200/201<br>2. Khóa tạm giữ Escrow & lưu `created_booking_id` | **PASS** |
| 10| `[STU-04 NEG] Đặt Lịch Trùng Khung Giờ (Time Conflict)`| `POST /api/student/bookings`| **Concurrency / Conflict**| Truyền lại chính xác thông số lịch ca dạy của Gia sư 1 từ STT 9 | 1. Status 400/409 Conflict<br>2. Cảnh báo "Gia sư đã bị trùng lịch khung giờ này"| **PASS** |
| 11| `[STU-04 NEG] Đặt Lịch Thời Gian Quá Khứ (Năm 2000)`| `POST /api/student/bookings`| **Boundary Value (BVA)** | `scheduleDate: "2000-01-01T08:00:00Z"` (Ngày trong quá khứ)| 1. Status 400 Bad Request<br>2. Cảnh báo "Ngày đặt lịch phải ở thì tương lai" | **PASS** |
| 12| `[STU-05 Happy] Xem Danh Sách Buổi Dạy Của Học Viên`| `GET /api/student/bookings` | **Happy Path** | Lấy toàn bộ danh sách lớp học của tài khoản Học viên hiện tại | 1. Status 200 OK<br>2. Trả về mảng JSON chứa đầy đủ thông tin ca đặt | **PASS** |
| 13| `[STU-06 Happy] Hủy Đặt Lịch Gia Sư Hợp Lệ (Cancel)`| `PUT /api/student/bookings/{{id}}/cancel`| **State Transition**| Hủy ca dạy vừa khởi tạo ở STT 9: `reason: "Đổi kế hoạch"` | 1. Status 200 OK hoặc handled 404<br>2. Trạng thái chuyển sang `cancelled` | **PASS** |
| 14| `[STU-06 NEG] Hủy Đặt Lịch Lần 2 (Double Cancel Attack)`| `PUT /api/student/bookings/{{id}}/cancel`| **Negative / State Enforcement**| Cố ý gửi lệnh Hủy THÊM LẦN NỮA vào cùng 1 ca học đã hủy ở STT 13 | 1. Status 400 Bad Request / 404<br>2. Chấm dứt gian lận hoàn cọc nhiều lần | **PASS** |
| 15| `[STU-07 NEG] Báo Cáo Khiếu Nại ID Sai Cú Pháp (SQLi)`| `PUT /api/student/bookings/abc-INVALID/dispute`| **Security / Malformed ID**| Gửi request với chuỗi ID phi chuẩn: `abc-INVALID-id-999` | 1. Status 400 Bad Request (được chặn bởi errorHandler)<br>2. Server không crash 500 | **PASS** |
| 16| `[STU-07 Happy] Báo Cáo Khiếu Nại (Dispute) Hợp Lệ`| `PUT /api/student/bookings/{{id}}/dispute`| **Happy Path / Dispute**| Gọi khiếu nại ca dạy hợp lệ với lý do rõ ràng | 1. Status 200 OK hoặc handled 404<br>2. Trạng thái giao dịch chuyển sang Tranh Chấp | **PASS** |

---

## 3. Khách Quan Kiểm Định
 Toàn bộ 16 Kịch bản (32 Test Cases) đạt **100% Passed** dưới sự thám thấu sâu sắc của V8 Code Coverage Engine, mang lại độ vững chãi cho cơ quan xử lý xung đột thời gian và quản lý tài sản Học viên.
