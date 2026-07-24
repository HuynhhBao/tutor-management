# Tài Liệu Triển Khai: Widget Dashboard Học Viên (Tin nhắn & Gợi ý Gia sư)

Tài liệu này hướng dẫn từng bước (step-by-step) để các thành viên trong nhóm lập trình chức năng cho 2 widget còn trống trên trang `StudentDashboard.jsx`: **Tin nhắn mới nhất** và **Gợi ý gia sư cho bạn**.

---

## 1. Widget "Tin nhắn mới nhất"

Mục tiêu: Hiển thị tối đa 3 cuộc hội thoại gần đây nhất của học viên để truy cập nhanh.

### Bước 1.1: Backend - Kiểm tra API
Chúng ta đã có sẵn API lấy danh sách cuộc hội thoại tại:
`GET /api/chat/conversations`
*(Được định nghĩa trong `backend/routes/chatRoutes.js` và `backend/controllers/chatController.js`)*.
Bạn không cần code thêm Backend ở phần này, chỉ cần gọi API này từ Frontend.

### Bước 1.2: Frontend - Khai báo State
Mở file `frontend/src/pages/User/StudentDashboard.jsx`.
Thêm state để lưu danh sách tin nhắn:
```javascript
const [recentMessages, setRecentMessages] = useState([]);
```

### Bước 1.3: Frontend - Gọi API lấy dữ liệu
Trong `useEffect` đang có sẵn ở `StudentDashboard.jsx`, thêm logic gọi API chat:
```javascript
// Fetch conversations
try {
  const resChat = await fetch('http://localhost:3001/api/chat/conversations', { credentials: 'include' });
  const dataChat = await resChat.json();
  if (dataChat.status === 'ok') {
    // Chỉ lấy 3 tin nhắn mới nhất
    setRecentMessages(dataChat.data.slice(0, 3));
  }
} catch (err) {
  console.error('Lỗi khi lấy danh sách tin nhắn:', err);
}
```

### Bước 1.4: Frontend - Hiển thị lên UI (Thay thế Placeholder)
Tìm đến đoạn comment `{/* Placeholder for Recent Activity... */}` và thay thế khối `Tin nhắn mới nhất` thành:
```jsx
<div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
  <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
    <MessageSquare className="w-5 h-5 text-blue-600" />
    Tin nhắn mới nhất
  </h3>
  
  {recentMessages.length === 0 ? (
    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
      <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
      <p>Không có tin nhắn mới</p>
    </div>
  ) : (
    <div className="space-y-4">
      {recentMessages.map((msg, idx) => (
        <div key={idx} onClick={() => navigate(`/student-dashboard/chat/${msg.partner_id}`)} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl cursor-pointer border border-transparent hover:border-slate-100 transition-all">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-bold">
            {msg.partner_name?.charAt(0)}
          </div>
          <div className="flex-1 overflow-hidden">
            <h4 className="font-bold text-slate-900 truncate">{msg.partner_name}</h4>
            <p className="text-sm text-slate-500 truncate">{msg.last_message}</p>
          </div>
          <div className="text-xs text-slate-400 whitespace-nowrap">
            {new Date(msg.last_message_time).toLocaleDateString('vi-VN')}
          </div>
        </div>
      ))}
    </div>
  )}
</div>
```

---

## 2. Widget "Gợi ý gia sư cho bạn"

Mục tiêu: Hiển thị 2 gia sư ngẫu nhiên nổi bật. Tuân thủ đúng kiến trúc Backend 3 lớp (Route -> Controller -> Service).

### Bước 2.1: Backend - Viết Service (`backend/services/tutorService.js`)
Thêm hàm lấy gia sư ngẫu nhiên vào `TutorService`:
```javascript
  async getRecommendedTutors(limit = 2) {
    // Lấy ngẫu nhiên gia sư bằng RANDOM()
    const result = await pool.query(
      'SELECT * FROM tutors ORDER BY RANDOM() LIMIT $1',
      [limit]
    );
    return result.rows;
  }
```

### Bước 2.2: Backend - Viết Controller (`backend/controllers/tutorController.js`)
Thêm và export hàm Controller (nhớ import `tutorService` và `sendSuccess` nếu chưa có):
```javascript
export const getRecommendedTutors = async (req, res, next) => {
  try {
    const data = await tutorService.getRecommendedTutors(2);
    return sendSuccess(res, 200, 'Lấy danh sách gợi ý thành công', { data });
  } catch (err) {
    next(err);
  }
};
```

### Bước 2.3: Backend - Khai báo Route (`backend/routes/tutors.js`)
Import `getRecommendedTutors` từ controller và thêm route (lưu ý phải đặt TRƯỚC route `router.get('/:id')` nếu có để tránh bị nhận nhầm params):
```javascript
import { getRecommendedTutors } from '../controllers/tutorController.js';

// ...
router.get('/recommendations', getRecommendedTutors); 
```

### Bước 2.4: Frontend - Khai báo State
Trong `StudentDashboard.jsx`, thêm:
```javascript
const [recommendedTutors, setRecommendedTutors] = useState([]);
```

### Bước 2.5: Frontend - Gọi API mới
Trong `useEffect`, chúng ta sẽ gọi API `GET /api/tutors/recommendations` vừa tạo:
```javascript
// Fetch recommended tutors
try {
  const resTutors = await fetch('http://localhost:3001/api/tutors/recommendations', { credentials: 'include' });
  const dataTutors = await resTutors.json();
  if (dataTutors.status === 'ok') {
    setRecommendedTutors(dataTutors.data);
  }
} catch (err) {
  console.error('Lỗi khi lấy danh sách gia sư gợi ý:', err);
}
```

### Bước 2.6: Frontend - Hiển thị UI
Thay thế khối "Gợi ý gia sư cho bạn" hiện tại bằng code sau:
```jsx
<div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
  <div className="flex items-center justify-between mb-6">
    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
      <Star className="w-5 h-5 text-amber-500" />
      Gợi ý gia sư cho bạn
    </h3>
    <button onClick={() => navigate('/student-dashboard/search')} className="text-sm font-bold text-blue-600 hover:underline">
      Xem tất cả
    </button>
  </div>

  {recommendedTutors.length === 0 ? (
    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
      <Search className="w-12 h-12 mb-4 opacity-20" />
      <p>Khám phá gia sư để nhận gợi ý</p>
    </div>
  ) : (
    <div className="space-y-4">
      {recommendedTutors.map((tutor, idx) => (
        <div key={idx} className="flex items-start gap-4 p-4 border border-slate-100 rounded-xl bg-slate-50">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex flex-shrink-0 items-center justify-center text-amber-600 font-bold">
            {tutor.full_name?.charAt(0)}
          </div>
          <div>
            <h4 className="font-bold text-slate-900">{tutor.full_name}</h4>
            <p className="text-xs text-slate-500 mt-1">{tutor.subjects || 'Đa môn'}</p>
            <button 
              onClick={() => navigate('/student-dashboard/search')} 
              className="mt-3 px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all"
            >
              Xem hồ sơ
            </button>
          </div>
        </div>
      ))}
    </div>
  )}
</div>
```

---
**Lời khuyên cho Developer thực hiện:**
- Code Backend tuân thủ chặt chẽ kiến trúc 3 lớp (Router -> Controller -> Service).
- Test kĩ phần chuyển hướng (navigate) ở các khung chat để chắc chắn ID truyền đi là đúng!
