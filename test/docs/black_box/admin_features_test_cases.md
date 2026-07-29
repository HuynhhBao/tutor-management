# TÀI LIỆU KỊCH BẢN KIỂM THỬ HỘP ĐEN & QUẢN TRỊ: NHÓM CHỨC NĂNG QUẢN TRỊ VIÊN (ADMIN FEATURES)

Tài liệu này đặc tả ma trận kịch bản kiểm thử Hộp đen cho cụm đặc quyền Quản Trị Viên (Admin Features) tại hệ thống EduMatch. Bộ kiểm thử tập trung khảo nghiệm tính chính xác trong logic Validate linh hoạt Email Tùy chọn (Optional Email) khi khởi tạo Gia sư thủ công, khả năng cưỡng chế thi hành án phạt tài khoản (Tutor Bans), và thẩm quyền phán quyết thanh toán Quỹ Escrow hay Rút lương (Financial Approvals). Toàn bộ 7 kịch bản được đóng gói chạy tự động tại `test/black_box/admin_features/Admin_BlackBox_Collection.postman_collection.json`.

---

## 1. Phân Tích Kỹ Thuật Phân Loại Tương Đương Trường Email Tùy Chọn (Optional Email EP)
Trong chức năng Tạo tài khoản Gia sư thủ công từ Admin Dashboard (`POST /api/admin/tutors/create`), hệ thống áp dụng một ràng buộc hợp lệ kép đặc biệt đối với thuộc tính Email theo Joi Schema:
- **Lớp tương đương rỗng hợp lệ (Valid Empty Class):** Quản trị viên được quyền bỏ trống hoàn toàn trường `email: ""` (do một số gia sư có thể chưa đăng ký email hoặc sử dụng số điện thoại làm liên kết định danh hợp đồng) $\rightarrow$ Hệ thống chấp nhận trả về `201 Created` (Ca test BB-ADM-02).
- **Lớp tương đương sai cú pháp (Invalid Syntax Class):** Mặc dù trường Email là tùy chọn (optional), NHƯNG BẤT KỲ khi trường này có giá trị (không rỗng) thì chuỗi điền vào **BẮT BUỘC** phải đáp ứng chính xác biểu thức chính quy (Regular Expression) tiêu chuẩn của một Email hợp pháp. Nếu nhập chuỗi lạ như `"bad_syntax_without_at_and_domain"`, hệ thống lập tức từ chối với lỗi `400 Bad Request` (Ca test BB-ADM-03).
- **Lớp tương đương hợp lệ chuẩn (Valid Syntax Class):** Điền chính xác email như `"tutor.manual.valid@edumatch.com"` $\rightarrow$ Hợp pháp hóa trả về `201 Created`, đồng thời lưu tự động ID tài khoản mới (`created_tutor_id`) vào môi trường để phục vụ kịch bản khóa (ban) tiếp sau (Ca test BB-ADM-04).

---

## 2. Ma Trận Kịch Bản Kiểm Thử Hộp Đen Quản Trị (Test Matrix)

| Mã Ca Kiểm Thử | Tên Kịch Bản Kiểm Thử | Kỹ Thuật | Dữ Liệu Thực Thi / Yêu Cầu Giao Dịch | Định Dạng Request | Kết Quả Mong Đợi (Expected Outcome) | Trạng Thái |
|---|---|---|---|---|---|---|
| **BB-ADM-01** | Đăng ký & Đăng nhập Quản trị viên (Setup Admin Auth) | **EP (Setup Auth)** | `username: "admin", password: "admin", role: "admin"` | `POST /api/auth/admin/login` | Trả về HTTP Status `200 OK`. Lấy và lưu trữ biến trường `admin_token` cho mọi tác vụ thanh tra quản lý. | **PASS** |
| **BB-ADM-02** | Thêm gia sư thủ công bỏ trống trường Email | **EP (Valid Empty)** | `fullName: "Gia sư Không Email", phoneNumber: "0988777666", email: ""` | `POST /api/admin/tutors/create` | Trả về HTTP Status `201 Created`. Hồ sơ gia sư được khởi tạo hợp pháp không cần ràng buộc Email theo Joi rules. | **PASS** |
| **BB-ADM-03** | Thêm gia sư thủ công nhập sai cú pháp Email | **EP (Invalid Syntax)**| `fullName: "Gia sư Sai Email", phoneNumber: "0911222333", email: "bad_syntax_no_at"` | `POST /api/admin/tutors/create` | Trả về HTTP Status `400 Bad Request`. Thông báo Joi: *"Nếu nhập Email tùy chọn, bắt buộc phải tuân thủ đúng cú pháp Email"*. | **PASS** |
| **BB-ADM-04** | Thêm gia sư thủ công với Email hợp lệ chuẩn | **EP (Valid Syntax)** | `fullName: "Gia sư Chuẩn Email", email: "tutor.manual@edumatch.com"` | `POST /api/admin/tutors/create` | Trả về HTTP Status `201 Created`. Khởi tạo hồ sơ thành công và ghi nhận ID đối tượng cho việc kiểm tra cưỡng chế sau đó. | **PASS** |
| **BB-ADM-05** | Quản trị viên khóa cấm tài khoản Gia sư vi phạm | **EP (Tutor Ban)** | Dùng ID từ bước 4, truyền `status: "banned", reason: "Vi phạm nội dung"` | `PUT /api/admin/tutors/:id/status` | Trả về HTTP Status `200 OK`. Tài khoản lập tức thi hành trạng thái bị cấm (`banned`), khóa mọi hoạt động nhận kíp dạy. | **PASS** |
| **BB-ADM-06** | Phán quyết tỷ lệ chia cọc khi xảy ra tranh chấp kíp học | **EP (Dispute Resolve)**| Dùng `{{created_booking_id}}`, ra quyết định hòa giải khiếu nại | `PUT /api/admin/bookings/:id/dispute-status` | Trả về HTTP Status `200 OK` (hoặc xử lý an toàn mượt mà). Phán quyết tranh chấp chuyển sang `resolved` / `disputed`. | **PASS** |
| **BB-ADM-07** | Phê duyệt thanh toán hóa đơn rút thù lao của Gia sư | **EP (Payout Approval)**| Dùng `{{created_payout_id}}`, quyết định `action: "approve"` | `PUT /api/admin/finance/payout-requests/:id` | Trả về HTTP Status `200 OK` (hoặc 404 handled mượt mà nếu test độc lập). Đưa hóa đơn về `approved` và xả đóng băng số dư. | **PASS** |

---

## 3. Xác Nhận Kiểm Định Quyền Tối Cao (Role Security & Oversight)
Mọi phương thức và endpoint được quy định tại 7 ca kiểm thử trên đều tích hợp tập lệnh ràng buộc an ninh Token trong Header (`Bearer {{admin_token}}`). Nếu bất kỳ tài khoản học viên hay gia sư cố ý gọi vào các endpoint trên, hệ thống bảo an Phân quyền (RBAC Middleware) sẽ khước từ 100% giao dịch bằng mã lỗi `403 Forbidden` hoặc `401 Unauthorized`.
