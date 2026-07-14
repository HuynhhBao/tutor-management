# Báo cáo Kỹ thuật: Tính năng "Lớp của tôi" (My Classes) - Tutor Dashboard

> **Ngày thực hiện:** 13/07/2026  
> **Phân hệ:** Tutor Dashboard  
> **Route:** `/tutor-dashboard/my-classes`

---

## 1. Tổng quan thay đổi

Tính năng **"Lớp của tôi"** cho phép gia sư xem danh sách các lớp đang dạy (booking đã được xác nhận - `confirmed`) và đánh dấu hoàn thành khi kết thúc khóa học. Toàn bộ được phát triển theo kiến trúc **Modular Monolith** đã có sẵn trong dự án.

### Danh sách file thay đổi

| STT | File | Loại | Mô tả |
|-----|------|------|-------|
| 1 | `backend/services/bookingService.js` | Sửa | Thêm method `completeBookingAsTutor` |
| 2 | `backend/validations/bookingValidation.js` | Sửa | Thêm schema `completeBookingParamsSchema` |
| 3 | `backend/controllers/tutorBookingController.js` | Sửa | Thêm hàm `completeBooking` |
| 4 | `backend/routes/tutorBookings.js` | Sửa | Thêm route `PUT /bookings/:id/complete` |
| 5 | `frontend/src/pages/Tutor/MyClassesPage.jsx` | **Mới** | Trang giao diện "Lớp của tôi" |
| 6 | `frontend/src/App.jsx` | Sửa | Kết nối route `my-classes` |

---

## 2. Chi tiết Backend

### 2.1. Kiến trúc Modular Monolith

Tuân thủ đúng kiến trúc phân lớp hiện có của hệ thống. Luồng xử lý khi gia sư bấm "Hoàn thành lớp":

```
Client (Frontend)
  │
  ▼
Route (tutorBookings.js)          ← Định nghĩa endpoint, áp dụng middleware
  │
  ▼
Controller (tutorBookingController.js)  ← Nhận Request, gọi Service, trả Response
  │
  ▼
Service (bookingService.js)       ← Chứa business logic, tương tác Database
  │
  ▼
Database (PostgreSQL)             ← UPDATE bookings SET status = 'completed'
```

### 2.2. API Endpoint mới

```
PUT /api/tutor/bookings/:id/complete
```

- **Middleware bảo vệ:** `verifyTutor` — chỉ user có role `tutor` mới truy cập được.
- **Input:** `id` (booking ID) từ URL params.
- **Output thành công:** `{ status: "ok", message: "Đã hoàn thành lớp học thành công!" }`
- **Lỗi có thể xảy ra:**
  - `404` — Không tìm thấy lớp học (booking không tồn tại hoặc không thuộc tutor).
  - `400` — Lớp không ở trạng thái `confirmed` (chỉ lớp đang dạy mới hoàn thành được).

### 2.3. Service Layer — `completeBookingAsTutor(tutorId, bookingId)`

**Kỹ thuật sử dụng:**

- **Kiểm tra quyền sở hữu:** Query `WHERE id = $1 AND tutor_id = $2` đảm bảo tutor chỉ hoàn thành lớp của chính mình.
- **Kiểm tra trạng thái hợp lệ:** Chỉ cho phép chuyển từ `confirmed` → `completed`. Các trạng thái khác (`pending`, `cancelled`, `completed`) sẽ bị từ chối.
- **Tự động gửi tin nhắn:** Sau khi hoàn thành, hệ thống tự INSERT một message vào bảng `messages` để thông báo cho học viên.
- **Sử dụng `ApiError`:** Throw lỗi chuẩn qua class `ApiError` để error handler middleware bắt và trả response đúng format.

```javascript
async completeBookingAsTutor(tutorId, bookingId) {
  // 1. Kiểm tra booking tồn tại + thuộc tutor
  const check = await pool.query(
    `SELECT * FROM bookings WHERE id = $1 AND tutor_id = $2`,
    [bookingId, tutorId]
  );
  if (check.rows.length === 0) {
    throw new ApiError(404, 'Không tìm thấy lớp học');
  }

  // 2. Kiểm tra trạng thái phải là confirmed
  if (check.rows[0].status !== 'confirmed') {
    throw new ApiError(400, 'Chỉ có thể hoàn thành lớp đang ở trạng thái "Đã xác nhận"');
  }

  // 3. Chuyển trạng thái sang completed
  await pool.query(`UPDATE bookings SET status = 'completed' WHERE id = $1`, [bookingId]);

  // 4. Gửi tin nhắn tự động cho học viên
  const autoMsg = `Lớp học môn ${check.rows[0].subject} đã được đánh dấu hoàn thành...`;
  await pool.query(
    `INSERT INTO messages (...) VALUES ($1, 'tutor', $2, 'user', $3)`,
    [tutorId, check.rows[0].user_id, autoMsg]
  );

  return 'Đã hoàn thành lớp học thành công!';
}
```

### 2.4. Validation Layer — `completeBookingParamsSchema`

Sử dụng **Joi** để validate `id` từ URL params:

```javascript
export const completeBookingParamsSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'any.required': 'Thiếu mã lớp học',
    'number.base': 'Mã lớp học phải là số',
    'number.integer': 'Mã lớp học phải là số nguyên',
    'number.positive': 'Mã lớp học không hợp lệ',
  }),
});
```

### 2.5. Controller Layer — `completeBooking`

Controller chỉ đóng vai trò **cầu nối** giữa Route và Service, không chứa business logic:

```javascript
export const completeBooking = async (req, res, next) => {
  try {
    const tutorId = req.user.id;        // Lấy từ JWT đã decode bởi verifyTutor
    const { id } = req.params;          // Lấy booking ID từ URL
    const message = await bookingService.completeBookingAsTutor(tutorId, id);
    return sendSuccess(res, 200, message);
  } catch (err) {
    next(err);                          // Chuyển lỗi cho errorHandler middleware
  }
};
```

---

## 3. Chi tiết Frontend

### 3.1. Trang `MyClassesPage.jsx`

**Kỹ thuật và thư viện sử dụng:**

| Kỹ thuật | Mô tả |
|----------|-------|
| **React Hooks** | `useState`, `useEffect`, `useCallback` để quản lý state và side-effect |
| **React Router** | `useNavigate` để điều hướng sang trang chat |
| **Context API** | `useAuth()` lấy thông tin user, `useAlert()` hiển thị thông báo |
| **Fetch API** | Gọi REST API với `credentials: 'include'` để gửi cookie JWT |
| **Tailwind CSS** | Styling toàn bộ giao diện, đồng bộ với design system hiện có |
| **Lucide React** | Icon library (BookOpen, Clock, User, MessageSquare, CheckCircle...) |

### 3.2. Luồng lấy dữ liệu (Data Flow)

```
useEffect (mount)
  │
  ▼
fetch GET /api/tutor/bookings     ← API có sẵn, trả về TẤT CẢ bookings
  │
  ▼
Filter: status === 'confirmed'   ← Lọc phía Frontend chỉ lấy lớp đang dạy
  │
  ▼
setClasses(confirmed)             ← Cập nhật state → React re-render
```

**Giải thích:** API `GET /api/tutor/bookings` trả về toàn bộ bookings (pending, confirmed, cancelled, completed). Frontend lọc chỉ lấy `confirmed` vì đây là các lớp "đang dạy".

### 3.3. Luồng hoàn thành lớp (Complete Flow)

```
Bấm "Hoàn thành lớp"
  │
  ▼
Mở Modal xác nhận                ← Hiển thị tên học viên + môn học
  │
  ▼
Bấm "Xác nhận hoàn thành"
  │
  ▼
fetch PUT /api/tutor/bookings/:id/complete
  │
  ├── Thành công ──→ showAlert('Đã hoàn thành lớp học! 🎉')
  │                   + Xóa booking khỏi state (không cần fetch lại)
  │
  └── Thất bại ───→ showAlert(error message)
```

### 3.4. Các thành phần giao diện

#### a) Header
- Tiêu đề "Lớp của tôi" với icon `BookOpen`
- Badge hiển thị số lượng lớp đang dạy

#### b) Thanh tìm kiếm
- Filter real-time theo **tên học viên** hoặc **môn học**
- Không gọi lại API, lọc trực tiếp trên state đã fetch

#### c) Grid Card (Danh sách lớp)
Mỗi card hiển thị:

| Thông tin | Chi tiết |
|-----------|----------|
| Avatar placeholder | Icon User trong vòng tròn xanh |
| Tên học viên | `b.student_name` — font bold |
| Email | `b.student_email` — text nhỏ |
| Badge trạng thái | "Đang diễn ra" — màu emerald với dot pulse animation |
| Môn học | `b.subject` — icon BookOpen tím |
| Lịch học | `b.schedule_time` — format locale vi-VN |
| Nút "Nhắn tin" | Navigate → `/tutor-dashboard/chat` |
| Nút "Hoàn thành lớp" | Mở modal xác nhận |

**Layout:** Responsive Grid — 1 cột (mobile) → 2 cột (tablet) → 3 cột (desktop).

#### d) Loading Skeleton
Hiển thị 3 card giả với animation `animate-pulse` khi đang fetch dữ liệu.

#### e) Empty State
- Khi không có lớp nào: "Chưa có lớp nào đang dạy"
- Khi tìm kiếm không có kết quả: "Không tìm thấy lớp nào"

#### f) Modal xác nhận hoàn thành
- Hiển thị icon CheckCircle với `animate-bounce`
- Thông tin lớp (tên học viên + môn học) trong khung nền xám
- 2 nút: "Xác nhận hoàn thành" (emerald) và "Hủy bỏ" (slate)
- Có loading state khi đang gọi API

### 3.5. Kỹ thuật UI/UX nổi bật

| Kỹ thuật | Vị trí áp dụng |
|----------|----------------|
| **Hover elevation** | Card nâng lên (`hover:-translate-y-1`) + tăng shadow khi hover |
| **Gradient accent** | Thanh gradient xanh trên đầu mỗi card (`from-blue-500 via-blue-600 to-indigo-600`) |
| **Pulse animation** | Dot xanh trong badge "Đang diễn ra" nhấp nháy liên tục |
| **Active scale** | Nút bấm thu nhỏ nhẹ (`active:scale-95`) tạo cảm giác phản hồi |
| **Backdrop blur** | Modal overlay có blur nền (`backdrop-blur-sm`) |
| **Stagger animation** | Các card xuất hiện lệch nhau (`animationDelay: index * 80ms`) |
| **Disabled state** | Nút bị disable + opacity giảm khi đang xử lý API |

### 3.6. Cập nhật Routing (`App.jsx`)

```diff
+ import MyClassesPage from './pages/Tutor/MyClassesPage';

  {/* Tutor Routes */}
- <Route path="my-classes" element={<div>Lớp của tôi (Đang phát triển)</div>} />
+ <Route path="my-classes" element={<MyClassesPage />} />
```

---

## 4. Tổng kết kỹ thuật sử dụng

| Phía | Công nghệ / Pattern |
|------|---------------------|
| **Backend** | Node.js, Express.js, PostgreSQL, JWT Authentication |
| **Kiến trúc** | Modular Monolith (Route → Validation → Controller → Service) |
| **Validation** | Joi Schema Validation |
| **Error Handling** | Custom `ApiError` class + Global Error Handler middleware |
| **Frontend** | React 18, React Router v6, Tailwind CSS |
| **State Management** | React Context API (`AuthContext`, `AlertContext`) |
| **Icons** | Lucide React |
| **API Communication** | Fetch API with credentials (Cookie-based JWT) |
| **Responsive Design** | Tailwind Grid breakpoints (sm, md, lg) |

---

*Tài liệu được tạo tự động dựa trên các thay đổi thực tế trong source code.*
