import React, { useState } from 'react';
import { X, CheckCircle, BookOpen, Clock, MessageSquare, ChevronRight } from 'lucide-react';
import { API_BASE_URL } from '../../utils/constants';

const BookingModal = ({ tutor, onClose, onSuccess }) => {
  const [subject, setSubject] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const subjectList = tutor.subjects
    ? tutor.subjects.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject || !scheduleTime) {
      setError('Vui lòng chọn môn học và thời gian học.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/student/bookings`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tutorId: tutor.id, subject, scheduleTime, message }),
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {done ? (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-5">
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Đặt lịch thành công!</h3>
            <p className="text-sm text-slate-500 mb-6">
              Yêu cầu của bạn đã được gửi đến gia sư <strong>{tutor.full_name}</strong>.
              Vui lòng chờ gia sư xác nhận.
            </p>
            <button
              onClick={onClose}
              className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl transition-all"
            >
              Đóng
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Đặt lịch học</h3>
                <p className="text-sm text-slate-500">Gia sư: <strong>{tutor.full_name}</strong></p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Môn học <span className="text-red-500">*</span>
                </label>
                {subjectList.length > 0 ? (
                  <select
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-sm"
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
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Thời gian học <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="datetime-local"
                    value={scheduleTime}
                    onChange={e => setScheduleTime(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Ghi chú cho gia sư
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Ví dụ: Tôi cần ôn thi học kỳ 2, lớp 12..."
                    rows={3}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                  {error}
                </div>
              )}

              <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs px-4 py-3 rounded-xl">
                💳 Phí đặt lịch: <strong>100.000đ</strong> sẽ được trừ từ ví của bạn. Nếu hủy khi đang chờ xác nhận, bạn sẽ được hoàn tiền 100%.
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all"
              >
                {loading ? 'Đang xử lý...' : 'Xác nhận đặt lịch'}
                <ChevronRight className="w-5 h-5" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default BookingModal;
