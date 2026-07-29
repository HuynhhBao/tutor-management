# TÀI LIỆU KHẢO SÁT & KỊCH BẢN KIỂM TRỌNG HỢP GIAO DIỆN FRONTEND EDUMATCH (PILLAR 4: FRONTEND COMPONENT & UNIT QA)

Tài liệu này đặc tả tường tận và trung thực nhất toàn bộ **39 Test Cases Kiểm Định Tự Động (Unit & Component Assertions)** được triển khai trên tầng Frontend (React/Vite) của dự án EduMatch. Cỗ máy chạy khảo thử sử dụng công nghệ tối tân nhất: **Vitest + React Testing Library + JSDOM + V8 Code Coverage**, bảo đảm mọi logic định dạng số tiền, ngày tháng, ảnh Avatar, cùng các component UI cốt lõi (Thanh đo độ mạnh mật khẩu, Thanh phân quyền Sidebar, Menu tài khoản người dùng) hoạt động chính xác 100%, không xảy ra tình trạng vỡ layout hay crash trắng màn hình.

---

## 1. Kết Quả Đo Lường Độ Phủ Mã Nguồn Thực Trị (V8 Code Coverage Report)
* **Tầng Utility (Hàm Logic):** Đạt tuyệt đối **100% Statements, 100% Functions, 100% Lines Coverage**.
* **Tầng Components (Giao Diện):** Đạt ngưỡng siêu cao **96.00% Statements, 93.33% Functions, 95.16% Lines Coverage**.
* **Trang Thái Chung Cộc:** **39 / 39 Test Cases PASSED 100% (Zero-Defects)**.

---

## 2. Ma Trận Chi Tiết Trọn Vẹn 39 Test Cases Kiểm Định Tự Động (Full 39 Assertions Table)

| STT | Phân Hệ / Tệp Tin Kiểm Thử | Tên Test Case (Kịch Bản Kiểm Định Chi Tiết) | Phương Pháp & Thao Tác Kiểm Thử (Method & Actions) | Kết Quả Mong Đợi (Expected Assertions) | Trạng Thái |
|:---:|:---|:---|:---|:---|:---:|
| 1 | `formatters.test.js` | `formatDateTime returns empty string if null/undefined` | Gọi `formatDateTime(null/undefined/'')` | Trả về chuỗi rỗng `""` an toàn, không ném lỗi TypeError | **PASS** |
| 2 | `formatters.test.js` | `formatDateTime formats valid datetime strings correctly`| Gọi `formatDateTime('2026-07-29T08:30:00Z')` | Trả về chuỗi thời gian chuẩn Việt Nam hợp lệ (chứa thứ, ngày, năm, giờ) | **PASS** |
| 3 | `formatters.test.js` | `formatDate returns empty string if dateStr is null/undefined` | Gọi `formatDate(null/undefined/'')` | Trả về chuỗi rỗng `""` cản crash giao diện | **PASS** |
| 4 | `formatters.test.js` | `formatDate formats valid date string into localized representation`| Gọi `formatDate('2026-07-29')` | Trả về ngày định dạng VN (`29/7/2026` hoặc tương đương) | **PASS** |
| 5 | `formatters.test.js` | `formatCurrency returns empty string when amount is undefined/null`| Gọi `formatCurrency(null/undefined)` | Trả về chuỗi rỗng `""`, không hiện `$NaN` | **PASS** |
| 6 | `formatters.test.js` | `formatCurrency formats integer amount into VND currency string`| Gọi `formatCurrency(500000)` | Chuỗi kết quả chứa chữ số formatted `500.000` kèm ký hiệu tiền tệ VNĐ | **PASS** |
| 7 | `formatters.test.js` | `formatCurrency handles 0 correctly` | Gọi `formatCurrency(0)` | Trả về chuỗi `0` hợp lệ, không coi 0 là nullish | **PASS** |
| 8 | `formatters.test.js` | `formatCurrency handles negative currency values correctly`| Gọi `formatCurrency(-50000)` | Trả về định dạng đúng kèm dấu âm `-50.000` | **PASS** |
| 9 | `statusFormatter.test.js` | `returns N/A and gray badge when status is empty, null or undefined`| Gọi `formatStatus(null/undefined/'')` | Nhãn label `N/A`, lớp màu `bg-gray-50 text-gray-600` | **PASS** |
| 10| `statusFormatter.test.js` | `formats completed status correctly` | Gọi `formatStatus('completed')` | Nhãn `Hoàn thành`, màu huy hiệu ngọc lục bảo (`emerald-50 text-emerald-700`)| **PASS** |
| 11| `statusFormatter.test.js` | `formats approved and payout statuses`| Gọi với `'approved'`, `'đã giải ngân'`, `'thành công'`| Đồng loạt trả về nhãn chính quy `Đã giải ngân` (Emerald badge) | **PASS** |
| 12| `statusFormatter.test.js` | `formats active status` | Gọi `formatStatus('active')` | Nhãn chuẩn hóa `Hoạt động`, lớp màu xanh Emerald | **PASS** |
| 13| `statusFormatter.test.js` | `formats confirmed status correctly` | Gọi `formatStatus('confirmed')` | Nhãn `Đã xác nhận`, lớp màu xanh lam (`blue-50 text-blue-700`) | **PASS** |
| 14| `statusFormatter.test.js` | `formats in_progress and running statuses`| Gọi với `'in_progress'`, `'running'`, `'đang chạy'` | Đồng loạt trả về nhãn `Đang chạy` (Blue badge) | **PASS** |
| 15| `statusFormatter.test.js` | `formats pending status correctly` | Gọi `formatStatus('pending')` | Nhãn `Chờ xác nhận`, màu huy hiệu hổ phách (`amber-50 text-amber-700`) | **PASS** |
| 16| `statusFormatter.test.js` | `formats payout pending status correctly`| Gọi `formatStatus('chờ giải ngân')`| Nhãn `Chờ giải ngân`, lớp màu vàng Amber | **PASS** |
| 17| `statusFormatter.test.js` | `formats cancelled status correctly` | Gọi `formatStatus('cancelled')` | Nhãn `Đã hủy`, màu huy hiệu đỏ hoa hồng (`rose-50 text-rose-700`) | **PASS** |
| 18| `statusFormatter.test.js` | `formats rejected status correctly` | Gọi `formatStatus('rejected')` | Nhãn `Bị từ chối`, màu đỏ Rose badge | **PASS** |
| 19| `statusFormatter.test.js` | `formats blocked and khóa statuses correctly`| Gọi với `'blocked'`, `'khóa'` | Đồng loạt trả về nhãn `Tạm ngưng` | **PASS** |
| 20| `statusFormatter.test.js` | `returns raw status string with slate default badge for unknown status`| Gọi với chuỗi lạ `'Đang chờ thi cử'`| Trả đúng nội dung truyền vào cùng màu mặc định tháo bối (`slate-50 text-slate-700`)| **PASS** |
| 21| `avatar.test.js` | `returns data URI unchanged when provided in avatarUrl`| Truyền vào chuỗi ảnh mã hóa Base64 Data URI | Giữ nguyên 100% chuỗi Base64 để render thẻ `<img />` trực tiếp | **PASS** |
| 22| `avatar.test.js` | `returns full http/https URLs unchanged`| Truyền URL ảnh từ cloud/mạng ngoại biên (`https://...`)| Trả về nguyên văn đường dẫn HTTP(S) gốc | **PASS** |
| 23| `avatar.test.js` | `prepends localhost:3001 to relative avatar URLs from backend`| Truyền vào đường dẫn tương đối `/uploads/avatars/user.jpg`| Ghép chuẩn xác thành URL backend `http://localhost:3001/uploads/avatars/user.jpg`| **PASS** |
| 24| `avatar.test.js` | `returns UI-Avatars fallback with blue theme for default user role`| Truyền `avatarUrl = null`, `name = 'Huynh Bao', role = 'user'`| Tự động cấp URL ảnh chữ ký từ UI-Avatars kèm nền màu xanh dương Blue (`dbeafe`)| **PASS** |
| 25| `avatar.test.js` | `returns UI-Avatars fallback with indigo theme for tutor role`| Truyền `role = 'tutor'` không ảnh Avatar | Tự động sinh ảnh đại diện với nền màu chàm Indigo (`e0e7ff`) | **PASS** |
| 26| `avatar.test.js` | `returns UI-Avatars fallback with purple theme for admin role`| Truyền `role = 'admin'` không ảnh Avatar | Tự động sinh ảnh đại diện uy quyền với màu tím Purple (`f3e8ff`) | **PASS** |
| 27| `avatar.test.js` | `handles empty or whitespace name safely by defaulting to User`| Truyền chuỗi rỗng toàn dấu cách `'   '` vào trường name | Không tạo ra URL rác `name=`, tự động thay thế bằng nhãn fallback `'User'` | **PASS** |
| 28| `PasswordStrengthIndicator.test.jsx`| `renders nothing when password prop is empty or undefined`| Render `<PasswordStrengthIndicator password="" />`| Component ẩn lặn hoàn toàn khỏi cây DOM (`container.firstChild === null`) | **PASS** |
| 29| `PasswordStrengthIndicator.test.jsx`| `renders "Rất yếu" for very simple passwords (score <= 1)`| Render với `password = "abc"` (Độ dài thấp, không chữ hoa, không số)| Hiển thị chính xác nhãn cảnh báo đỏ **"Rất yếu"** trên DOM | **PASS** |
| 30| `PasswordStrengthIndicator.test.jsx`| `renders "Yếu" or "Trung bình" for moderate passwords`| Render với `password = "abcdef123"` và `password = "abc123"` | Thanh đo chuyển sang màu vàng nhạt và hiện đúng văn bản **"Trung bình"** hoặc **"Yếu"**| **PASS** |
| 31| `PasswordStrengthIndicator.test.jsx`| `renders "Mạnh" for strong passwords (score 4)`| Render với `password = "Abcdef123"` (Đủ độ dài, có Hoa/Thường, có Số)| Thanh đo đạt 80% chiều rộng, chuyển màu xanh lá và hiện văn bản **"Mạnh"** | **PASS** |
| 32| `PasswordStrengthIndicator.test.jsx`| `renders "Rất mạnh" for complex secure passwords (score 5)`| Render với `password = "P@ssw0rd_123!"` (Thêm ký tự đặc biệt)| Thanh đo đạt 100%, xuất hiện thông điệp an ninh số một: **"Rất mạnh"** | **PASS** |
| 33| `Sidebar.test.jsx` | `renders admin sidebar title and navigation links correctly`| Render `<Sidebar />` bên trong `MemoryRouter` với AuthContext role = 'admin'| Xuất hiện đầy đủ logo **"TutorAdmin"** và 5 tab chức năng (Tổng quan, Gia sư, Học viên,...) | **PASS** |
| 34| `Sidebar.test.jsx` | `displays pending applications badge when API returns positive count`| Mock `fetch('http://localhost:3001/api/tutors/stats')` trả về `{ pendingApplications: 5 }`| Thẻ màu đỏ hiển thị đúng con số **"5"** báo tin hồ sơ chờ duyệt trên tab Quản lý Gia sư | **PASS** |
| 35| `Sidebar.test.jsx` | `toggles UserAccountMenu dropdown when clicking user account profile button`| Mô phỏng sự kiện click của người dùng `fireEvent.click(profileButton)`| Trước click: menu bồi rỗng; Sau click: xổ ra menu có chứa nút **"Đăng xuất"** và cấu hình| **PASS** |
| 36| `UserAccountMenu.test.jsx`| `renders correct label and links for admin role`| Render `<UserAccountMenu user={{ role: 'admin', fullName: 'Super Admin' }} />`| Hiển thị nhãn **"Quản trị viên"** (Title Case) và dẫn liên kết về `/admin` | **PASS** |
| 37| `UserAccountMenu.test.jsx`| `renders correct dashboard link for tutor role`| Render với `role = 'tutor'` và tên `'Gia Sư Toán'` | Hiển thị nhãn **"Gia sư"**, nút Bảng điều khiển dẫn về `/tutor-dashboard` | **PASS** |
| 38| `UserAccountMenu.test.jsx`| `renders default user label for student role` | Render với `role = 'student'` | Hiển thị nhãn **"Tài khoản cá nhân"**, nút Bảng điều khiển dẫn về `/student-dashboard` | **PASS** |
| 39| `UserAccountMenu.test.jsx`| `triggers onLogout and onClose when clicking logout button`| Mô phỏng nhấp chuột `userEvent.click(logoutBtn)` bằng con trỏ tương tác thực | Hàm callback `onLogout` và `onClose` đều được kích hoạt thành công đúng 1 lần (`Times(1)`) | **PASS** |

---

## 3. Cẩm Nang Thực Thi (How To Run)
Bạn có thể tự tay nghiệm thu chất lượng phần Giao Diện bất cứ khi nào bằng lệnh Terminal ngay tại thư mục `frontend`:
```bash
cd frontend
npm run test:coverage
```
Hệ thống sẽ chạy qua 39 bài kiểm tra chỉ trong ~2 giây và tạo hồ sơ thống kê chi tiết HTML ngay trong folder `frontend/coverage_report/index.html`.
