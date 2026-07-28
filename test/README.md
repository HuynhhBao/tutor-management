# 🧪 Kế Hoạch & Ma Trận Kiểm Thử Hệ Thống EduMatch (Testing Strategy)

Tài liệu đặc tả toàn bộ quy tắc, cấu trúc, công cụ kiểm thử và ma trận kiểm nghiệm cho 100% chức năng hiện có thuộc nền tảng **EduMatch (Tutor Management System)**.

Để tối ưu hóa hiệu suất kiểm tra và phù hợp với thực tế doanh nghiệp, hệ thống áp dụng bộ tiêu chuẩn công nghệ kiểm thử song kiếm **Postman (Newman CI/CD)** và **PyTest (Python)** cho 3 trụ cột kiểm thử chuẩn công nghiệp:

> [!IMPORTANT]
> **Quy Mặc Công Nghệ & Công Cụ Kiểm Thử (Tech Stack):**
> 1. **Kiểm thử Tích hợp Backend (`test/backend/`) & Kiểm thử Hộp Đen (`test/black_box/`):** Sử dụng **Postman** (Viết Test Scripts `pm.test()` và Automation lặp lại thông qua CLI **Newman** trên GitHub Actions CI/CD).
> 2. **Kiểm thử Hộp Trắng (`test/white_box/`):** Sử dụng **PyTest (Python)** để kiểm thử chuyên sâu thuật toán, làm sạch dữ liệu AI/Scraping, và các bài test bất đồng bộ Đa luồng (Multi-threading / Asyncio) xử lý tranh chấp dữ liệu (Race Condition) trong DB PostgreSQL.

---

## 📁 1. Cấu Trúc Cây Thư Mục & Quy Chuẩn Tập Tin (Clean Naming Architecture)

Hệ thống thư mục được tổ chức theo đúng **5 Nhóm Chức Năng Chính** (loại bỏ hoàn toàn tiền tố số, đảm bảo chuẩn clean naming). Bên trong mỗi thư mục sẽ chứa các tập tin kiểm thử tương ứng theo bộ công cụ đã chọn:

```text
test/
├── 📄 README.md                                 # Tài liệu đặc tả ma trận test & hướng dẫn tool
│
├── 📁 backend/                                  # TÍCH HỢP API & TRANSACTIONS [CÔNG CỤ: POSTMAN]
│   ├── auth_account/                            # • Ví dụ: Auth_Integration.postman_collection.json
│   ├── student_features/                        # • API Đặt lịch (Escrow Trừ tiền), Ví nạp tiền & Lịch sử
│   ├── tutor_features/                          # • API Duyệt/Từ chối lớp (Hoàn tiền 100%), Lớp dạy & Rút lương
│   ├── admin_features/                          # • API Quản lý Gia sư/Học viên, Duyệt rút tiền & Thống kê
│   └── expansion_modules/                       # • API AI Matchmaker, Virtual Classroom (Time log), Realtime, Redis
│
├── 📁 black_box/                                # KIỂM THỬ HỘP ĐEN (FORM BINDINGS & BVA) [CÔNG CỤ: POSTMAN]
│   ├── auth_account/                            # • Data-driven test: Form Đăng nhập, Đăng ký (Độ mạnh pass)
│   ├── student_features/                        # • Giá trị biên Số tiền Nạp Ví ($10k \le x \le 100M$), Chống trùng giờ
│   ├── tutor_features/                          # • Giá trị biên Rút lương Gia sư (Min $50k$, Giới hạn số dư)
│   ├── admin_features/                          # • Kịch bản Validate linh hoạt Optional Email (Add Tutor thủ công)
│   └── expansion_modules/                       # • Kịch bản API/UI cho Phòng học Virtual Classroom & Toast Push
│
└── 📁 white_box/                                # KIỂM THỬ HỘP TRẮNG (UNIT TEST LOGIC LÕI) [CÔNG CỤ: PYTEST]
    ├── conftest.py                              # • Fixtures dùng chung cho PyTest (DB mock, auth tokens, config)
    ├── auth_account/                            # • test_jwt_bcrypt.py, test_rbac_middleware.py (Rẽ nhánh Bảo mật)
    ├── finance_transactions/                    # • test_wallet_race_condition.py (Test đa luồng chống Double-spending)
    └── expansion_modules/                       # • test_scraping_sanitization.py, test_ai_semantic_parser.py
```

---

## 🛠️ 2. Hướng Dẫn Thực Thi Tự Động Hóa (CLI Execution & Automation)

### A. Thực thi Postman Collections cho `backend/` và `black_box/` (Newman CLI)
Mỗi cụm chức năng trong `backend/` hoặc `black_box/` sẽ đóng gói 2 tệp tiêu chuẩn:
1. `*_Collection.postman_collection.json` (Bộ API và script test `pm.test()`).
2. `EduMatch_Local.postman_environment.json` (Biến môi trường chứa `base_url = http://localhost:5000/api`, `token`,...).

> **Lệnh chạy tự động hóa trên CLI / Terminal:**
```powershell
# Chạy bộ test tích hợp luồng Xác thực (Auth Integration)
newman run test/backend/auth_account/Auth_Integration.postman_collection.json -e test/backend/auth_account/EduMatch_Local.postman_environment.json --reporters cli,htmlesxt

# Chạy bộ test Giá trị biên Hộp Đen (Black-box Boundary Value Analysis)
newman run test/black_box/student_features/Wallet_Deposit_Boundary.postman_collection.json -e test/black_box/EduMatch_Local.postman_environment.json
```

### B. Thực thi PyTest Unit & Async Stress Tests cho `white_box/` (PyTest)
Môi trường Python PyTest được tích hợp để bắn tải Đa luồng (Multi-threaded) trực tiếp vào DB và test cấu trúc rẽ nhánh hàm lõi:

> **Lệnh chạy tự động hóa trên CLI / Terminal:**
```powershell
# Di chuyển vào thư mục dự án và chạy toàn bộ bộ Hộp Trắng
pytest test/white_box/ -v

# Chạy cụ thể bài test Race Condition (Tranh chấp tài chính số dư Ví)
pytest test/white_box/finance_transactions/test_wallet_race_condition.py -v --capture=no
```

---

## 📊 3. Ma Trận Kế Hoạch Kiểm Thử Chi Tiết (Grouped by 5 Core Domains)

Dưới đây là bảng phân bổ toàn bộ 100% chức năng của EduMatch vào từng thư mục và công cụ kiểm thử chỉ định:

### 🔐 1. Nhóm Xác Thực & Quản Lý Tài Khoản (`auth_account`)
| ID | Chức Năng / Module | Tham Chiếu Code & UI | Phân Hạch Test Folder | Công Cụ | Các Mục Tiêu & Kịch Bản Kiểm Thử |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AUTH-01** | Đăng Ký Tài Khoản Mới | `authController.js`<br>`RegisterPage.jsx` | `black_box/auth_account`<br>`backend/auth_account` | **Postman** | • **Black-box:** Validate cú pháp Email, mật khẩu yếu ($< 8$ ký tự, thiếu số). Kiểm nghiệm thông báo lỗi 400.<br>• **Backend:** Kiểm tra dữ liệu vào DB có hash Bcrypt an toàn, trả về status `201 Created`. |
| **AUTH-02** | Đăng Nhập Hệ Thống | `authController.js`<br>`LoginPage.jsx`, `AdminLoginPage.jsx` | `backend/auth_account`<br>`white_box/auth_account` | **Postman**<br>**PyTest** | • **Backend (Postman):** Verify đăng nhập trả về đúng JWT Token kèm role (`Admin`, `Tutor`, `Student`).<br>• **White-box (PyTest):** Unit test độ cứng cáp của hàm giải mã Bcrypt và thuật toán ký JWT Token. |
| **AUTH-03** | Quên & Khôi Phục Mật Khẩu | `forgotPasswordController.js`<br>`ForgotPasswordPage.jsx` | `backend/auth_account`<br>`black_box/auth_account` | **Postman** | • Test quy trình gửi OTP/link reset mật khẩu, kiểm thử Rate Limiting (giới hạn thử nghiệm liên tục) & đặt MK mới thành công. |
| **AUTH-04** | Cập Nhật Hồ Sơ Profile | `authController.js` (`/me`)<br>`ProfilePage.jsx` | `backend/auth_account`<br>`black_box/auth_account` | **Postman** | • Verify gọi `/api/auth/me` với Header `Authorization: Bearer <Token>`. Nếu thiếu Token lập tức trả về `401 Unauthorized`. |
| **AUTH-05** | Phân Quyền Bảo Mật (RBAC)| Middlewares: `auth.js` | `white_box/auth_account` | **PyTest** | • **Unit Test Rẽ Nhánh Middleware:** Cố tình đưa Token của Học viên/Gia sư gọi vào Route của Admin $\rightarrow$ Hệ thống chặn 100% với mã `403 Forbidden`. |

---

### 🎓 2. Nhóm Chức Năng Dành Cho Học Viên (`student_features`)
| ID | Chức Năng / Module | Tham Chiếu Code & UI | Phân Hạch Test Folder | Công Cụ | Các Mục Tiêu & Kịch Bản Kiểm Thử |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **STU-01** | Bộ Lọc Tìm Kiếm Gia sư | `tutorController.js`<br>`TutorSearchPage.jsx` | `black_box/student_features` | **Postman** | • Test Query String lọc đồng thời: Môn học + Cấp lớp + Khoảng học phí + Số sao. Trả về đúng mảng JSON Gia sư thỏa mãn. |
| **STU-02** | Thuê Gia Sư & Giữ Tiền (Escrow)| `studentBookingController.js`<br>`BookingPage.jsx` | `backend/student_features`<br>`black_box/student_features` | **Postman** | • **Black-box:** Phát hiện và từ chối khi đặt giờ học trùng lịch (Time Conflict) hoặc khi ví Hết tiền ($= 0$ VNĐ).<br>• **Backend Transaction:** Khi book thành công, số dư ví Student lập tức giảm và bị niêm phong tại quỹ Escrow, đơn chuyển sang `Pending`. |
| **STU-03** | Lịch Sử Thuê & Đánh Giá | `studentBookingController.js`<br>`BookingHistoryPage.jsx` | `backend/student_features`<br>`black_box/student_features` | **Postman** | • Test bộ lọc trang Lịch sử (Pending/Confirmed/Rejected/Completed).<br>• Test quyền Đánh Giá & Chấm sao: Chỉ mở sau khi lớp mang trạng thái `Completed`. |
| **STU-04** | Ví Điện Tử & Nạp Tiền (Deposit)| `walletController.js`<br>`WalletPage.jsx` | `black_box/student_features`<br>`white_box/finance_transactions` | **Postman**<br>**PyTest** | • **Black-box BVA (Postman):** Nạp hợp lệ trong khoảng $10.000 \le \text{Amount} \le 100.000.000$. Báo lỗi từ chối khi nạp số âm ($-50k$), số $0$, chữ cái.<br>• **White-box Concurrency (PyTest):** Chữa cháy **Race Condition** - giả lập 20 Threads cùng gọi nạp/trừ tiền trong 1 mili-giây, đảm bảo Database Lock chuẩn xác không bị gian lận tiền! |

---

### 👨‍🏫 3. Nhóm Chức Năng Dành Cho Gia Sư (`tutor_features`)
| ID | Chức Năng / Module | Tham Chiếu Code & UI | Phân Hạch Test Folder | Công Cụ | Các Mục Tiêu & Kịch Bản Kiểm Thử |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TUT-01** | Ứng Tuyển & Nộp CV Gia sư| `applicationController.js`<br>`LandingPage.jsx` | `backend/tutor_features`<br>`black_box/tutor_features` | **Postman** | • Test form nộp hồ sơ bằng cấp, mô tả chuyên môn, định dạng giá tiền mong muốn và chứng chỉ kèm theo. |
| **TUT-02** | Nhận / Từ Chối Bookings| `tutorBookingController.js`<br>`TutorDashboard.jsx` | `backend/tutor_features`<br>`black_box/tutor_features` | **Postman** | • **Confirm Booking:** Chốt lịch dạy sang `Confirmed`.<br>• **Reject Booking $\rightarrow$ ĐẠI THỬ NGHIỆM ACID TRANSACTION:** Verify khi Gia sư Từ chối, hệ thống tự động châm ngòi giao dịch **Hoàn Trả 100% Tiền Quỹ Escrow Về Ví Học Viên!** |
| **TUT-03** | Quản Lý Lớp Của Tôi | `tutorBookingController.js`<br>`MyClassesPage.jsx` | `backend/tutor_features` | **Postman** | • Test lấy danh sách các lớp đã chốt hợp lệ, xem liên lạc học viên và thao tác chốt trạng thái "Hoàn thành bài giảng". |
| **TUT-04** | Tài Chính & Rút Lương (Payouts)| `tutorFinanceController.js`<br>`TutorFinancePage.jsx` | `black_box/tutor_features`<br>`backend/tutor_features` | **Postman** | • **Black-box BVA:** Test gửi đơn Rút tiền hợp lệ ($\le$ Số dư khả dụng và $\ge 50.000$ VNĐ). Báo lỗi nếu đòi rút $5.000$ VNĐ hoặc vượt số dư.<br>• Số dư tương ứng lập tức chuyển sang trạng thái đóng băng chờ duyệt (`Pending Payout`). |

---

### 👑 4. Nhóm Chức Năng Dành Cho Quản Trị Viên (`admin_features`)
| ID | Chức Năng / Module | Tham Chiếu Code & UI | Phân Hạch Test Folder | Công Cụ | Các Mục Tiêu & Kịch Bản Kiểm Thử |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ADM-01** | Thống Kê Tổng Quan Dashboard | `DashboardOverview.jsx` | `backend/admin_features` | **Postman** | • Verify con số thống kê API chính xác 100% với tổng hồ sơ thực tế (Người dùng, Tổng bookings, Doanh thu hệ thống). |
| **ADM-02** | Quản Lý Gia Sư & Duyệt CV | `tutorController.js`<br>`TutorManagement.jsx`, `CvViewerPage.jsx`, `AddTutor.jsx` | `backend/admin_features`<br>`black_box/admin_features` | **Postman** | • Test thao tác Phê Duyệt / Từ Chối CV hồ sơ Gia sư mới.<br>• Test Ban / Unban tài khoản vi phạm.<br>• **Test Thêm Gia sư Thủ Công:** Verify logic đặc biệt cho phép Bỏ Trống HOẶC buộc phải đúng định dạng khi nhập **Optional Email**. |
| **ADM-03** | Quản Lý Học Viên | `adminStudentController.js`<br>`StudentManagement.jsx` | `backend/admin_features` | **Postman** | • Test soi xét thông tin số dư Ví của học viên, chi tiết các booking đã tạo và Khóa tài khoản Học viên sai phạm. |
| **ADM-04** | Giám Sát Lớp & Giải Quyết Tranh Chấp | `adminBookingController.js`, `adminClassController.js`<br>`AdminBookingManagement.jsx` | `backend/admin_features` | **Postman** | • Test quyền Admin can thiệp vào các đơn thuê đang tranh chấp (Dispute), cập nhật trạng thái cưỡng chế khi có khiếu nại chất lượng. |
| **ADM-05** | Tài Chính & Duyệt Rút Tiền | `adminFinanceController.js`<br>`FinanceManagement.jsx` | `backend/admin_features`<br>`white_box/finance_transactions` | **Postman**<br>**PyTest** | • **Postman:** Khi bấm Duyệt (`Approve`), hóa đơn Rút lương chuyển `Completed`, trừ thẳng vào quỹ thu nhập Gia sư.<br>• **PyTest:** Unit test kiểm định hàm làm tròn chiết khấu (%) và sai số thập phân số liệu Tài chính. |

---

### 🚀 5. Nhóm Các Mô-đun Mở Rộng Nâng Cao (`expansion_modules`)
| ID | Chức Năng / Module | Tham Chiếu Code & UI | Phân Hạch Test Folder | Công Cụ | Các Mục Tiêu & Kịch Bản Kiểm Thử |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **EXP-01** | Trợ Lý AI Matchmaker | `aiController.js`<br>`TutorSearchPage.jsx` (AI) | `backend/expansion_modules`<br>`black_box/expansion_modules` | **Postman** | • Test nhập chuỗi văn bản tự nhiên (VD: *"Tôi cần tìm gia sư dạy Văn lớp 10 ôn thi, vui vẻ nhẹ nhàng"*).<br>• Verify thuật toán đo độ tương đồng, trả về JSON chứa Top 3 Gia sư phù hợp nhất kèm điểm Similarity Score. |
| **EXP-02** | Pipeline Cào Dữ Liệu (Scraping) | `data_scraping/` Python pipeline | `white_box/expansion_modules` | **PyTest** | • **PyTest White-box:** Unit test cho các script Python làm sạch chuỗi (Sanitize), gạt bỏ tag HTML/dữ liệu rác và parse dạng CSV/JSON đúng chuẩn trước khi import DB. |
| **EXP-03** | Phòng Học Trực Tuyến Virtual Classroom | `classSessionRoutes.js`<br>`VirtualClassroom.jsx` | `backend/expansion_modules`<br>`black_box/expansion_modules` | **Postman** | • Test tạo phiên phòng học Video Call và cơ cấu bảng vẽ Whiteboard.<br>• **Test Time Logging:** Xác minh Backend tự động đóng dấu Thời Gian Thực chuẩn (`start_time` và `end_time`) khi Gia sư bấm Bắt đầu/Kết thúc giờ học! |
| **EXP-04** | Chat Real-time & Chia Sẻ Tài Liệu| `chatController.js`<br>Socket.io Chat components | `backend/expansion_modules` | **Postman** | • Test gửi/nhận tin nhắn qua REST/Socket, upload file đính kèm bài tập (PDF, DOCX, Hình ảnh). Chặn tải lên file quá dung lượng hoặc đuôi thực thi nguy hiểm (`.exe`, `.sh`). |
| **EXP-05** | Thông Báo Real-time (Push Toast) | `notificationController.js`<br>Bell Icon & Popups | `backend/expansion_modules` | **Postman** | • Test sự kiện Push Notification kích hoạt chuông nảy Toast Popup khi có Booking mới hoặc Đơn rút lương được duyệt. |
| **EXP-06** | Redis Caching & Tự Động Fallback| Redis Middleware trên API Admin | `backend/expansion_modules` | **Postman** | • **Test Cache Hit/Miss:** Gọi API thống kê 2 lần liên tiếp. Lần 1 đọc từ PostgreSQL (Cache Miss), Lần 2 lấy siêu tốc từ Redis Cache Hit.<br>• **Test Fallback Resilience:** Giả lập tắt server Redis (Offline), kiểm chứng Backend KHÔNG BỘP BỘP CRASH mà tự động fallback đọc từ PostgreSQL mượt mà 100%! |
