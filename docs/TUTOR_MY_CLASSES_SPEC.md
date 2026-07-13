# Hướng dẫn Phát triển tính năng: Lớp của tôi (My Classes) dành cho Gia sư

Tài liệu này đóng vai trò là bản đặc tả yêu cầu (Specification) dành cho Developer được giao nhiệm vụ phát triển tính năng **Lớp của tôi** thuộc phân hệ **Tutor Dashboard**.

## 1. Tổng quan (Overview)
- **Mục tiêu:** Xây dựng một trang quản lý danh sách các học viên đã chốt lịch thành công với gia sư.
- **Route Frontend:** `/tutor-dashboard/my-classes`
- **File cần tạo/sửa (Frontend):** `frontend/src/pages/Tutor/MyClassesPage.jsx`
- **Vai trò truy cập:** Chỉ dành cho User có role là `tutor`.

## 2. Phân tích Giao diện (UI/UX)
Trang "Lớp của tôi" nên được thiết kế dưới dạng danh sách (List) hoặc dạng thẻ (Grid/Cards). Mỗi thẻ đại diện cho một Lớp học (Booking đã được `confirmed`).

**Thông tin cần hiển thị trên mỗi thẻ:**
1. **Thông tin Học viên:** Tên học viên, Ảnh đại diện (nếu có).
2. **Thông tin Khóa học:** Môn học (Subject), Thời gian lịch học (Schedule Time).
3. **Trạng thái:** Huy hiệu (Badge) báo trạng thái đang học (Đang diễn ra).
4. **Hành động (Call to Action):** 
   - Nút **"Nhắn tin"**: Dẫn sang trang `/tutor-dashboard/chat` để chat với học viên.
   - Nút **"Hoàn thành lớp"**: Để gia sư đánh dấu khóa học đã kết thúc.

## 3. Luồng xử lý dữ liệu (Logic)

### 3.1. Lấy danh sách lớp học (Fetch Data)
- **API Endpoint đã có sẵn:** `GET /api/tutor/bookings`
  - Hàm này hiện đang trả về toàn bộ yêu cầu đặt lịch của gia sư.
- **Xử lý trên Frontend:** 
  - Gọi API trên để lấy mảng `bookings`.
  - Lọc (Filter) mảng dữ liệu này chỉ lấy các booking có `status === 'confirmed'` (Đây chính là các "lớp đang dạy").
  *(Có thể tham khảo logic gọi API này trong file `frontend/src/pages/Tutor/TutorDashboard.jsx`).*

### 3.2. Chức năng Đánh dấu hoàn thành
Khi gia sư bấm nút "Hoàn thành lớp", hệ thống cần chuyển trạng thái của Booking từ `confirmed` sang `completed`.

- **Tuân thủ Kiến trúc Modular Monolith:** 
  Tính năng này cần được phát triển theo đúng chuẩn kiến trúc hiện tại của hệ thống. Không viết chung code xử lý vào Route mà phải chia tách rõ ràng:
  - **Route:** Tạo endpoint `PUT /api/tutor/bookings/:id/complete` trong file `backend/routes/tutor.js` (hoặc `bookings.js`).
  - **Validation:** Bổ sung schema xác thực `id` vào file `backend/validations/bookingValidation.js`.
  - **Controller:** Gọi hàm `completeBooking` trong `backend/controllers/bookingController.js` (Chỉ làm nhiệm vụ nhận Request và trả về Response).
  - **Service:** Logic tương tác với CSDL (chuyển status thành `completed`) bắt buộc phải nằm ở `backend/services/bookingService.js`.

- **Cập nhật Frontend:**
  - Gọi API PUT tới endpoint trên.
  - Thành công: Hiển thị thông báo (Dùng `useAlert` từ `AlertContext`) và tải lại danh sách lớp.

## 4. Các bước triển khai (Checklist for Developer)

- [ ] **Bước 1:** Khởi tạo file `MyClassesPage.jsx` trong thư mục `frontend/src/pages/Tutor/`.
- [ ] **Bước 2:** Bổ sung Route `path="my-classes"` trong file `App.jsx` trỏ tới `MyClassesPage`.
- [ ] **Bước 3:** Code giao diện (HTML/Tailwind) hiển thị danh sách dạng Card trống.
- [ ] **Bước 4:** Thêm logic `useEffect` để fetch dữ liệu từ `GET /api/tutor/bookings` và render ra giao diện.
- [ ] **Bước 5:** (Backend) Phát triển API `completeBooking` đảm bảo phân lớp chuẩn Modular Monolith (Route -> Validation -> Controller -> Service). 
- [ ] **Bước 6:** (Frontend) Gắn sự kiện `onClick` cho nút "Hoàn thành lớp", gọi API và xử lý hiển thị.

## 5. Lưu ý quan trọng
- Nhớ import và sử dụng hook `useAlert` để hiển thị thông báo thành công/thất bại:
```javascript
import { useAlert } from '../../context/AlertContext';
// ...
const { showAlert } = useAlert();
showAlert('Đã hoàn thành lớp học!');
```
- Khi thiết kế giao diện, nên tận dụng các component và màu sắc Tailwind đã có sẵn trong dự án (ví dụ: `bg-slate-50`, text màu `slate-900`, nút màu `blue-600`...) để đảm bảo tính đồng bộ UI.

---
*Chúc bạn code vui vẻ và không gặp bug! 🚀*
