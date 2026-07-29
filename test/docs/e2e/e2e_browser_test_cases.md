# 🌐 Ma Trận Kiểm Thử Tự Động Trình Duyệt E2E (EduMatch Playwright Automated E2E Test Cases)

Tài liệu này chi tiết hóa trọn vẹn **26 kịch bản kiểm thử tích hợp giao diện (End-to-End Browser Automated Test Cases)** thuộc hệ thống EduMatch, được xây dựng trên framework **Playwright (Chromium Engine)** tại thư mục cô lập `test/e2e/`.

---

## 📊 Thống Kê Tổng Quan
- **Tổng số kịch bản E2E:** 26 kịch bản (Test Scenarios)
- **Tỉ lệ thành công:** **100% Passed** (26/26 Passed)
- **Engine kiểm thử:** Playwright Automated Testing (Headless Chromium Chromium-v133)
- **Tối ưu máy quay (Zero-Configuration Integration):** Playwright cấu hình trỏ tự động về `http://localhost:5173` và tự khởi động máy chủ Frontend Vite (`npm run dev`).

---

## 📋 Chi Tiết 5 Bộ Kịch Bản Kiểm Thử Chuyên Sâu

### 1️⃣ Module 1: Khảo Sát Trang Chủ & Điều Hướng Công Khai (`01_landing_navigation.spec.js`)
Kiểm định trải nghiệm khách truy cập (Guest Visitor) tại Trang chủ (Landing Page) và các cổng điều hướng công khai.

| ID | Tên kịch bản | Mô tả kịch bản (Scenario) | Hành động kiểm thử (Actions) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **E2E-1.1** | Khảo sát Trang chủ (`/`) | Khách truy cập vào Landing Page gốc của EduMatch | Mở URL `http://localhost:5173/`, kiểm tra header, banner hero và thanh điều hướng | Hiển thị trọn vẹn Header, Logo, Navigation bar không xung đột Context | ✅ PASSED |
| **E2E-1.2** | Kiểm chứng Cổng Đăng Nhập (`/login`) | Khách điều hướng từ trang chủ vào trang đăng nhập Học viên / Gia sư | Trác nghiệm form Đăng nhập (Input Email, Password và Button Submit) | Form Đăng nhập mount chính xác đầy đủ ô nhập liệu và nút chức năng | ✅ PASSED |
| **E2E-1.3** | Kiểm chứng Cổng Đăng Ký (`/register`) | Khách bấm nút Tạo tài khoản mới | Chuyển đến `/register`, kiểm đếm tối thiểu 2 ô input và tiêu đề đăng ký | Hiển thị thẻ heading `"Đăng ký tài khoản"` cùng cấu trúc nhập liệu đầy đủ | ✅ PASSED |
| **E2E-1.4** | Kiểm chứng Cổng Đăng Nhập Admin (`/admin/login`) | Truy cập chuyên biệt vào trang Admin Login | Vào thẳng `/admin/login`, tìm kiếm input password dành cho Admin | Mở đúng giao diện đăng nhập Admin Portal riêng biệt | ✅ PASSED |
| **E2E-1.5** | Chặn URL lạ (404 Fallback Routing) | Truy cập một đường dẫn ngẫu nhiên không hợp lệ | Điều hướng thẳng tới `/invalid-random-path-987654321` | Router catch-all (`*`) lập tức bắt và điều hướng trả về Trang chủ `/` | ✅ PASSED |

---

### 2️⃣ Module 2: Xác Thực Tài Khoản, Xử Lý Lỗi & Chặn Bảo Mật RBAC (`02_auth_security_rbac.spec.js`)
Kiểm thử thao tác điền form, mô phỏng phản hồi lỗi từ Backend và kiểm định hệ thống khóa phòng vệ **ProtectedRoute RBAC**.

| ID | Tên kịch bản | Mô tả kịch bản (Scenario) | Hành động kiểm thử (Actions) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **E2E-2.1** | Tương tác nhập liệu Login Form | Khách thao tác gõ vào trường Email và Password | Type `'e2e.tester@gmail.com'` và `'SecurePass123!'` vào form | Trường input ghi nhận và giữ chính xác giá trị đã nhập | ✅ PASSED |
| **E2E-2.2** | Xử lý lỗi từ Server khi sai mật khẩu | Người dùng nhập sai mật khẩu đăng nhập | Mô phỏng API `POST /api/auth/login` trả về lỗi 401 Unauthorized, ấn Đăng Nhập | Giao diện hiện câu thông báo lỗi `"Tài khoản hoặc mật khẩu không chính xác"` | ✅ PASSED |
| **E2E-2.3** | Đăng nhập thành công Học viên | Người dùng nhập đúng credentials tài khoản Học viên | Mock API login trả 200 OK với thông tin `role: 'user'`, ấn nút Submit | Trang web tự động điều hướng mượt mà sang `/student-dashboard` | ✅ PASSED |
| **E2E-2.4** | **Bảo Mật RBAC:** Khách truy cập cấm vào Student Dashboard | Khách vãng lai chưa đăng nhập cố tình gõ thẳng URL của Học viên | Try accessing `http://localhost:5173/student-dashboard` mà không có token | `ProtectedRoute` block truy cập và lập tức đẩy về Trang chủ `/` | ✅ PASSED |
| **E2E-2.5** | **Bảo Mật RBAC:** Khách truy cập cấm vào Executive Admin Suite | Người dùng trái phép cố gắng trèo rào qua URL Admin Portal | Try accessing `http://localhost:5173/admin` | `ProtectedRoute` block và bắt buộc chuyển hướng về trang `/admin/login` | ✅ PASSED |

---

### 3️⃣ Module 3: Hành Trình Học Viên, Trợ Lý AI & Quản Trị Học Tập (`03_student_ai_matchmaking.spec.js`)
Mô phỏng 100% luồng sử dụng của một Học viên chính thức: Từ Bảng điều khiển, tìm gia sư bằng Trợ Lý AI, xem lịch sử lớp học và ví tiền Escrow.

| ID | Tên kịch bản | Mô tả kịch bản (Scenario) | Hành động kiểm thử (Actions) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **E2E-3.1** | Kiểm tra Bảng điều khiển Học viên (`/student-dashboard`) | Học viên đăng nhập vào Dashboard chính | Mở `/student-dashboard`, kiểm tra vùng làm việc chính (Main Workspace) | Render đầy đủ widget lời chào và khung bố cục StudentLayout | ✅ PASSED |
| **E2E-3.2** | Truy cập cổng Trợ Lý AI Tìm Gia Sư (`/student-dashboard/search`) | Học viên muốn tìm kiếm gia sư theo yêu cầu riêng | Truy cập `/student-dashboard/search`, kiểm tra khung nhập liệu của AI | Hiện thanh nhập Prompt AI / Bộ lọc gia sư chuyên nghiệp | ✅ PASSED |
| **E2E-3.3** | Gõ câu lệnh Prompt AI Tìm kiếm | Học viên gõ mô tả nhu cầu vào Trợ Lý AI | Type `"Tìm gia sư môn Toán lớp 12 luyện thi đại học điểm cao"`, xác định list Gia sư | Danh sách gia sư Toán/Anh từ Backend mock hiển thị tức thời trên DOM | ✅ PASSED |
| **E2E-3.4** | Mở trang Lịch Sử Lớp Học (`/student-dashboard/booking-history`) | Học viên kiểm tra các lớp đã book trong quá khứ | Vào `/student-dashboard/booking-history`, mock dữ liệu bảng lịch sử | Hiển thị cấu trúc bảng danh sách lớp học và trạng thái thanh toán | ✅ PASSED |
| **E2E-3.5** | Kiểm chứng trang Ví Tiền Escrow (`/student-dashboard/wallet`) | Học viên tra cứu số dư tiền nạp và ký quỹ | Chuyển tới trang `/student-dashboard/wallet` với mock số dư `2,500,000 VND` | Giao diện hiển thị container ví tiền và nút thao tác thanh toán | ✅ PASSED |

---

### 4️⃣ Module 4: Hành Trình Gia Sư, Tài Chính & Lớp Học Ảo Excalidraw (`04_tutor_virtual_classroom.spec.js`)
Xác minh hành trình làm việc của Gia sư từ quản lý khóa giảng dạy, rà soát doanh thu cho tới kiểm thử Phòng học ảo (Virtual Classroom).

| ID | Tên kịch bản | Mô tả kịch bản (Scenario) | Hành động kiểm thử (Actions) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **E2E-4.1** | Khảo sát Tutor Dashboard (`/tutor-dashboard`) | Gia sư vào Bảng điều khiển công việc giảng dạy | Mở `/tutor-dashboard` dưới quyền Gia sư (`role: 'tutor'`) | Render chuẩn xác bố cục TutorLayout và các mục thống kê nhanh | ✅ PASSED |
| **E2E-4.2** | Kiểm thử Trang Danh sách Lớp Dạy (`/tutor-dashboard/my-classes`) | Gia sư quản lý lịch biểu các khóa học đang có | Vào `/tutor-dashboard/my-classes`, kiểm tra vùng nội dung danh sách lớp | Container bảng khóa học load thành công không lỗi cú pháp | ✅ PASSED |
| **E2E-4.3** | Truy cập Bảng Kế Toán Doanh Thu (`/tutor-dashboard/finance`) | Gia sư tra cứu doanh thu giảng dạy và tiền đang rút | Điều hướng qua `/tutor-dashboard/finance`, xác thực hiển thị biểu đồ/bảng | Hiển thị chi tiết bảng cân đối thu nhập gia sư mượt mà | ✅ PASSED |
| **E2E-4.4** | Thâm nhập Phòng Học Ảo Excalidraw (`/classroom/room-101`) | Gia sư mở lớp học trực tuyến tích hợp Bảng Trí Tuệ | Tráng nghiệm link `/classroom/room-101`, kiểm tra DOM tìm thẻ `canvas` Whiteboard | Thẻ `<canvas>` Excalidraw hoặc container Phòng học Ảo khởi tạo thành công | ✅ PASSED |
| **E2E-4.5** | Độ bền Bố cục Lớp học Trực Tuyến | Khảo sát thanh điều khiển âm thanh/video và công cụ bảng | Kiểm tra tính ổn định, thao tác giữ phiên học trong trình duyệt Chromium | Phòng học ảo duy trì ổn định, không bị chập lò xo hay trắng màn hình (Fatal Error) | ✅ PASSED |

---

### 5️⃣ Module 5: Trung Tâm Điều Hành Admin & Thao Tác Trình Đơn (`05_admin_executive_suite.spec.js`)
Đảm bảo toàn bộ quyền uy của Ban Giám Đốc (Super Admin) trong việc điều hướng, giám sát, phê Duyệt gia sư, phân tích doanh thu và xuất trình đơn Đăng xuất an toàn.

| ID | Tên kịch bản | Mô tả kịch bản (Scenario) | Hành động kiểm thử (Actions) | Kết quả kỳ vọng (Expected Output) | Trạng thái |
| :--- | :--- | :--- | :--- | :--- | :---: |
| **E2E-5.1** | Ban Điều Hành Admin Dashboard (`/admin`) | Quản trị viên theo dõi toàn diện chỉ số nền tảng | Vào cổng `/admin` dưới phân quyền `role: 'admin'`, khảo sát biểu đồ telemetry | Dashboard Executive hiển thị chính xác các khu vực báo cáo | ✅ PASSED |
| **E2E-5.2** | Điều tra Hồ Sơ Phê Duyệt Gia Sư (`/admin/tutors`) | Admin kiểm duyệt danh sách ứng tuyển gia sư mới | Điều hướng sang `/admin/tutors`, kiểm chứng khả năng tải bảng quản lý | Quản lý Gia sư hiển thị thành công danh sách hồ sơ ứng viên | ✅ PASSED |
| **E2E-5.3** | Quản Trị Danh Sách Học Viên (`/admin/students`) | Admin kiểm soát tài khoản người dùng Học viên | Truy cập vào `/admin/students`, soát xét cấu trúc dữ liệu người dùng | Bảng thông tin danh sách học viên render đầy đủ trường dữ liệu | ✅ PASSED |
| **E2E-5.4** | Điều phối Trung Tâm Khóa Học (`/admin/classes`) | Admin xem xét các lớp học và trạng thái lịch dạy | Điều hướng vào trang `/admin/classes` | Container Quản Trị Kì Học hiển thị rõ ràng, mượt mà | ✅ PASSED |
| **E2E-5.5** | Điều Kê Tài Chính & Hoa Hồng Nền Tảng (`/admin/finance`) | Admin thanh kiểm tra tổng chi thu và đối soát Payout | Chuyển sang `/admin/finance` | Quản trị Kế Toán và Giải Phục Thanh Toán mount ổn định trên màn hình | ✅ PASSED |
| **E2E-5.6** | Trình đơn Tài Khoản & Kiểm Trác Đăng Xuất | Admin sử dụng Account Menu trên thanh Header | Bấm mở nút Profile/Account, kiểm định sự xuất hiện của tùy chọn `"Đăng xuất"` | Dropdown menu bật mở mượt mà hiển thị công cụ Đăng xuất và cấu hình | ✅ PASSED |

---

## 🚀 Hướng Dẫn Kích Hoạt Chạy Bộ Kiểm Thử Browser E2E

### Cách 1: Chạy toàn bọc tự động (One-Click Execute - Khuyên Dùng)
Tại terminal, di chuyển vào thư mục `test/e2e` và thi hành chỉ lệnh sau:
```bash
cd test/e2e
npm test
```
*Hệ thống sẽ tự động kích hoạt Playwright, ngầm khởi tạo máy chủ Frontend trên cổng 5173 và chạy trọn vẹn 26/26 kịch bản trên máy quay Chromium siêu tốc (hoàn tất chỉ trong ~30 giây).*

### Cách 2: Chạy kiểm thử có mở giao diện (Playwright Interactive UI Mode)
Dành cho việc trực Quan xem máy quay thao tác lướt web trên thực tế:
```bash
cd test/e2e
npx playwright test --ui
```

### Cách 3: Chạy độc lập từng Module kịch bản
```bash
cd test/e2e
# Lệnh chạy Module 1
npx playwright test tests/01_landing_navigation.spec.js

# Lệnh chạy Module 2
npx playwright test tests/02_auth_security_rbac.spec.js

# Lệnh chạy Module 3
npx playwright test tests/03_student_ai_matchmaking.spec.js

# Lệnh chạy Module 4
npx playwright test tests/04_tutor_virtual_classroom.spec.js

# Lệnh chạy Module 5
npx playwright test tests/05_admin_executive_suite.spec.js
```

---

## 🏆 Giá Trị Thấu Đạt & Khám Phá Lỗi Kiến Trúc (Architectural Discoveries)
Trong quá trình triển khai E2E Automated Testing, hệ thống kiểm tra tự động đã hỗ trợ phát hiện và vá ngay tức thời **2 khiếm khuyết kiến trúc trọng yếu** của ứng dụng thực tế:
1. **Lỗi `useAlert` Context unhandled exception trên Landing Page:** Tránh tai nạn sập trắng màn hình do `LandingPage` gọi hooks khi chưa bọc thẻ `<AlertProvider>` trong `App.jsx`.
2. **Lỗi điều hướng Guest Visitors sai lệch:** Tối ưu bộ thu Axios Interceptor tại `apiClient.js` và `App.jsx`, ngăn chặn hoàn toàn việc khách viếng thăm ở trang chủ bị ép chuyển hướng trái phép sang trang Đăng nhập do sự kiện check-auth trả về 401.

**EduMatch Frontend hiện có hệ thống bảo vệ trọn vẹn từ tầng Code Unit (39 Vitest Cases) đến tầng Trình Duyệt E2E (26 Playwright Cases) với phong độ tuyệt đối 100% Passed! 🛡️**
