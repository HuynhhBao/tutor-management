import React, { useState } from 'react';
import { X, CheckCircle, BookOpen, Clock, MessageSquare, ChevronRight, GraduationCap, Star, ShieldCheck, Laptop, Tag, Wallet, Calendar, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../../utils/constants';

const daysOfWeek = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ Nhật'];

const BookingModal = ({ tutor, onClose, onSuccess }) => {
  const [subject, setSubject] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [duration, setDuration] = useState(1); // Mặc định 1 giờ
  const [recurringSlots, setRecurringSlots] = useState({}); // VD: { 'Thứ 3': '19:00', 'Thứ 5': '19:00' }
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const subjectList = tutor.subjects
    ? tutor.subjects.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const hourlyRate = 100000;
  const totalFee = hourlyRate * Number(duration);

  const quickGoals = [
    'Học thử & Đánh giá trình độ',
    'Ôn tập cấp tốc bài kiểm tra',
    'Luyện đề thi chuyên sâu',
    'Củng cố kiến thức mất gốc'
  ];

  const getDefaultTime = () => {
    if (scheduleTime) {
      const timePart = scheduleTime.split('T')[1];
      if (timePart) return timePart.slice(0, 5);
    }
    return '19:00';
  };

  const handleToggleDay = (day) => {
    if (recurringSlots[day] !== undefined) {
      const next = { ...recurringSlots };
      delete next[day];
      setRecurringSlots(next);
    } else {
      setRecurringSlots({
        ...recurringSlots,
        [day]: getDefaultTime()
      });
    }
  };

  const handleTimeChange = (day, timeStr) => {
    setRecurringSlots({
      ...recurringSlots,
      [day]: timeStr
    });
  };

  const syncAllToLessonOne = () => {
    const defaultT = getDefaultTime();
    const next = { ...recurringSlots };
    Object.keys(next).forEach(k => { next[k] = defaultT; });
    setRecurringSlots(next);
  };

  const handleAddGoal = (goal) => {
    if (!message) {
      setMessage(`[Mục tiêu]: ${goal}`);
    } else if (!message.includes(goal)) {
      setMessage(`${message}\n[Mục tiêu]: ${goal}`);
    }
  };

  const formattedRecurringDays = daysOfWeek
    .filter(day => recurringSlots[day] !== undefined)
    .map(day => `${day} (${recurringSlots[day]})`)
    .join(', ');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject || !scheduleTime) {
      setError('Vui lòng chọn môn học và thời gian cho Buổi 1.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/student/bookings`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          tutorId: tutor.id, 
          subject, 
          scheduleTime, 
          duration: Number(duration),
          recurringDays: formattedRecurringDays,
          message 
        }),
      });
      const json = await res.json();
      if (json.status === 'ok') {
        setDone(true);
        onSuccess?.();
      } else {
        setError(json.message || 'Đặt lịch thất bại.');
      }
    } catch {
      setError('Không thể kết nối đến server.');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name = '') =>
    name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl p-6 max-w-xl w-full shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {done ? (
          <div className="flex flex-col items-center py-8 text-center relative">
            <button
              onClick={onClose}
              className="absolute top-0 right-0 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              aria-label="Đóng hộp thoại"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-5 shadow-inner">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-900 mb-2">Đặt lịch thành công!</h3>
            <p className="text-sm text-slate-500 mb-2 max-w-md">
              Yêu cầu chốt <strong>Buổi 1</strong> môn <strong>{subject}</strong> ({duration}h) đã được gửi đến gia sư <strong>{tutor.full_name}</strong>.
            </p>
            {formattedRecurringDays && (
              <p className="text-xs text-blue-700 bg-blue-50 px-3.5 py-2 rounded-xl border border-blue-100 font-extrabold mb-2 shadow-2xs">
                🔄 Lịch duy trì chu kỳ: {formattedRecurringDays}
              </p>
            )}
            <p className="text-xs text-emerald-600 bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-100 font-semibold mb-6">
              ✔ Học phí Buổi 1 ({totalFee.toLocaleString('vi-VN')}đ) đã được tạm giữ an toàn trong Ví Escrow. Vui lòng chờ gia sư xác nhận.
            </p>
            <button
              onClick={onClose}
              className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-emerald-200"
            >
              Hoàn tất
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Modal Title & Close Button Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span className="w-2 h-5 bg-blue-600 rounded-full inline-block"></span>
                Đăng ký & Đặt lịch học
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors -mr-1"
                aria-label="Đóng hộp thoại"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Header / Tutor Mini Card */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center font-extrabold text-lg flex-shrink-0 shadow-md shadow-blue-200">
                {getInitials(tutor.full_name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-slate-900 truncate">{tutor.full_name}</h3>
                  {tutor.rating ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md">
                      <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                      {tutor.rating} {tutor.review_count ? `(${tutor.review_count})` : ''}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 bg-slate-100 text-slate-600 border border-slate-200/80 rounded-md" title="Gia sư chưa có lượt đánh giá nào">
                      <Star className="w-3 h-3 text-slate-400" />
                      Chưa có đánh giá
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                  <GraduationCap className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span className="truncate">{tutor.qualification || 'Gia sư chuyên nghiệp EduMatch'}</span>
                </div>
              </div>
              <div className="text-right sm:border-l sm:border-slate-200 sm:pl-4">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Đơn giá tiêu chuẩn</span>
                <span className="text-sm font-black text-blue-600">100.000đ / giờ</span>
              </div>
            </div>

            {/* Learning Mode Banner */}
            <div className="flex items-center gap-3 p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-blue-800 text-xs">
              <Laptop className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div>
                <strong>Hình thức học Trực tuyến (Online)</strong>
                <p className="text-blue-600 text-[11px] mt-0.5">Học trực tiếp trên Phòng học ảo EduMatch (tích hợp gọi Video, Bảng trắng & Chat).</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Môn học + Thời gian học */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    Môn học <span className="text-red-500">*</span>
                  </label>
                  {subjectList.length > 0 ? (
                    <select
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm font-medium transition-all"
                    >
                      <option value="">-- Chọn môn học --</option>
                      {subjectList.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={subject}
                      onChange={e => setSubject(e.target.value)}
                      placeholder="Nhập môn học..."
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5" title="Thời điểm bắt đầu buổi học trải nghiệm đầu tiên">
                    Thời gian Buổi 1 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="datetime-local"
                      value={scheduleTime}
                      onChange={e => setScheduleTime(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all font-medium text-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Thời lượng ca học */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Thời lượng ca học Buổi 1 (Số giờ)
                </label>
                <select
                  value={duration}
                  onChange={e => setDuration(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 text-sm font-semibold text-slate-800 transition-all"
                >
                  <option value={1}>⏱️ 1.0 giờ (Học thử / Ca tiêu chuẩn) — 100.000 đ</option>
                  <option value={1.5}>⏱️ 1.5 giờ (Chuyên sâu 90 phút) — 150.000 đ</option>
                  <option value={2}>⏱️ 2.0 giờ (Ôn thi / Luyện đề 120 phút) — 200.000 đ</option>
                </select>
              </div>

              {/* Lịch duy trì chu kỳ hàng tuần & Tinh chỉnh khung giờ */}
              <div className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-1.5 text-sm font-bold text-slate-800 mb-1">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>Lịch học định kỳ hàng tuần mong muốn</span>
                  <span className="text-[11px] font-normal text-slate-500 ml-auto">(Tùy chọn)</span>
                </div>
                <p className="text-[12px] text-slate-600 mb-2.5">
                  Bấm chọn ngày để gia sư ưu tiên giữ chỗ (slot) cố định cho bạn trong tương lai. Bạn có thể chỉnh khung giờ riêng cho từng ngày phía dưới:
                </p>
                <div className="mb-3.5 p-2.5 bg-blue-100/50 border border-blue-200/80 rounded-xl text-blue-900 text-[11px] leading-relaxed flex items-start gap-2 shadow-2xs">
                  <span className="text-sm leading-none mt-0.5">💡</span>
                  <div>
                    <strong>Mẹo nhỏ:</strong> Nếu chưa chắc chắn về thời khóa biểu lâu dài, bạn có thể <strong>bỏ trống phần này</strong> để học trải nghiệm Buổi 1 trước. Sau đó bạn vẫn có thể dễ dàng đăng ký gia hạn lộ trình cố định tại trang <strong>Lịch của tôi</strong>!
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map((day) => {
                    const isSelected = recurringSlots[day] !== undefined;
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => handleToggleDay(day)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all border ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200 scale-[1.02]'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                        }`}
                      >
                        {day} {isSelected && '✓'}
                      </button>
                    );
                  })}
                </div>

                {/* Bảng tinh chỉnh khung giờ cho từng ngày */}
                {Object.keys(recurringSlots).length > 0 && (
                  <div className="mt-3.5 pt-3 border-t border-slate-200/80 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2.5">
                      <span className="text-xs font-bold text-slate-700">⏰ Tinh chỉnh giờ học cho từng ngày:</span>
                      <button
                        type="button"
                        onClick={syncAllToLessonOne}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/80 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition-all flex items-center gap-1 self-start sm:self-auto shadow-2xs"
                        title="Đồng bộ toàn bộ các ngày về cùng giờ bắt đầu với Buổi 1"
                      >
                        ⚡ Đặt theo giờ Buổi 1 ({getDefaultTime()})
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {daysOfWeek
                        .filter(day => recurringSlots[day] !== undefined)
                        .map(day => (
                          <div key={day} className="flex items-center justify-between gap-2 p-2.5 bg-white rounded-xl border border-blue-200 shadow-2xs hover:border-blue-400 transition-colors">
                            <span className="text-xs font-extrabold text-blue-700 whitespace-nowrap shrink-0">{day}:</span>
                            <input
                              type="time"
                              value={recurringSlots[day]}
                              onChange={e => handleTimeChange(day, e.target.value)}
                              className="w-24 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-black text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center cursor-pointer transition-all shrink-0"
                            />
                          </div>
                        ))}
                    </div>
                    <p className="text-[11px] text-blue-700 bg-blue-50/60 p-2 rounded-lg border border-blue-100 mt-2.5 font-medium">
                      ✓ Chu kỳ đã lập: <strong>{formattedRecurringDays}</strong> (Hàng tuần)
                    </p>
                  </div>
                )}
              </div>

              {/* Ghi chú & Tag mục tiêu */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-slate-700">
                    Ghi chú cho gia sư
                  </label>
                  <span className="text-[11px] text-slate-400">Chọn nhanh mục tiêu bên dưới</span>
                </div>
                
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {quickGoals.map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => handleAddGoal(goal)}
                      className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 font-medium rounded-lg border border-slate-200 hover:border-blue-200 transition-all"
                    >
                      <Tag className="w-3 h-3" />
                      + {goal}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <MessageSquare className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Ví dụ: Lời nhắn hoặc chi tiết nội dung bạn cần gia sư hỗ trợ..."
                    rows={2}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none transition-all"
                  />
                </div>
              </div>

              {/* Error Box */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl font-medium flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Payment Summary Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600 font-medium">Thanh toán trải nghiệm Buổi 1:</span>
                  <span className="font-bold text-slate-900">100.000đ x {duration}h</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-emerald-600" />
                    Tổng thanh toán (Trừ từ Ví):
                  </span>
                  <span className="text-lg font-black text-blue-600">{totalFee.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="space-y-1 text-[11px] text-slate-600 bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-100">
                  <div className="font-bold text-emerald-800 flex items-center gap-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    Cam kết An toàn & Minh bạch Dòng tiền:
                  </div>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-600">
                    <li>Bạn chỉ phải thanh toán trước cho <strong>Buổi 1</strong>. Tiền được tạm giữ an toàn tại Ví Escrow.</li>
                    <li>Sau khi trải nghiệm Buổi 1 thành công, bạn có thể gia hạn chu kỳ theo gói Tuần/Tháng để chốt cố định lịch dạy lâu dài.</li>
                    <li>Nếu sau Buổi 1 không hợp phong cách dạy, bạn có thể dừng học mà <strong>không tốn thêm chi phí chu kỳ nào</strong>! (Chi phí Buổi 1 đã diễn ra sẽ được quyết toán cho gia sư).</li>
                  </ul>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                {loading ? 'Đang xử lý...' : `Xác nhận Đặt Buổi 1 (${totalFee.toLocaleString('vi-VN')}đ)`}
                <ChevronRight className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingModal;
