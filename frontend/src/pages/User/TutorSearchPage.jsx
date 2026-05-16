import React, { useState, useEffect } from 'react';
import {
  Search, Filter, GraduationCap, User, Calendar,
  BookOpen, ChevronRight, X, Clock, MessageSquare, CheckCircle,
} from 'lucide-react';
import { API_BASE_URL } from '../../utils/constants';

/* ─── Booking Modal ───────────────────────────────────────── */
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
          /* ── Thành công ── */
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
          /* ── Form ── */
          <>
            {/* Header */}
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
              {/* Môn học */}
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

              {/* Thời gian */}
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

              {/* Ghi chú */}
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

/* ─── Main Page ───────────────────────────────────────────── */
const TutorSearchPage = () => {
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [bookingTutor, setBookingTutor] = useState(null); // tutor đang mở modal

  useEffect(() => {
    const fetchTutors = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE_URL}/tutors`, { credentials: 'include' });
        const json = await res.json();
        if (json.status === 'ok') setTutors(json.data);
      } catch (err) {
        console.error('Lỗi khi tải danh sách gia sư:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTutors();
  }, []);

  const allSubjects = [...new Set(
    tutors.flatMap(t => (t.subjects ? t.subjects.split(',').map(s => s.trim()) : []))
  )].filter(Boolean);

  const filtered = tutors.filter(t => {
    const matchSearch =
      !searchQuery ||
      t.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subjects?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.qualification?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSubject =
      !selectedSubject ||
      t.subjects?.toLowerCase().includes(selectedSubject.toLowerCase());
    return matchSearch && matchSubject;
  });

  const getInitials = (name = '') =>
    name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase();

  const avatarColors = [
    'bg-blue-500', 'bg-violet-500', 'bg-emerald-500',
    'bg-rose-500', 'bg-amber-500', 'bg-cyan-500',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Tìm kiếm Gia sư</h1>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm theo tên, môn học hoặc kỹ năng..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Bộ lọc */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 font-bold text-slate-900 mb-4">
              <Filter className="w-4 h-4" />
              Bộ lọc
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Môn học</label>
                <select
                  value={selectedSubject}
                  onChange={e => setSelectedSubject(e.target.value)}
                  className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-sm"
                >
                  <option value="">Tất cả môn học</option>
                  {allSubjects.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Danh sách gia sư */}
        <div className="lg:col-span-3">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-5 animate-pulse">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-slate-200 rounded-full" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-200 rounded" />
                    <div className="h-3 bg-slate-200 rounded w-5/6" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <Search className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Không tìm thấy gia sư</h3>
              <p className="text-slate-500 mt-2">
                {tutors.length === 0
                  ? 'Dữ liệu gia sư sẽ sớm được cập nhật tại đây.'
                  : 'Thử tìm với từ khóa hoặc bộ lọc khác.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filtered.map((tutor, idx) => {
                const subjects = tutor.subjects
                  ? tutor.subjects.split(',').map(s => s.trim()).filter(Boolean)
                  : [];
                const colorClass = avatarColors[idx % avatarColors.length];
                return (
                  <div
                    key={tutor.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-200 p-5 flex flex-col gap-4 group"
                  >
                    {/* Avatar + Tên */}
                    <div className="flex items-center gap-3">
                      <div className={`w-14 h-14 ${colorClass} rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
                        {getInitials(tutor.full_name)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-base truncate">{tutor.full_name}</p>
                        <p className="text-xs text-slate-400 truncate">{tutor.email}</p>
                      </div>
                    </div>

                    {/* Thông tin */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span>{tutor.age ? `${tutor.age} tuổi` : '—'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span>{tutor.gender || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600 col-span-2">
                        <GraduationCap className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{tutor.qualification || '—'}</span>
                      </div>
                    </div>

                    {/* Môn dạy */}
                    {subjects.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap">
                        <BookOpen className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        {subjects.map(sub => (
                          <span
                            key={sub}
                            className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Nút đặt lịch */}
                    <button
                      onClick={() => setBookingTutor(tutor)}
                      className="mt-auto w-full py-2.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white font-semibold rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-1.5 group-hover:shadow-sm"
                    >
                      Đặt lịch học
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {bookingTutor && (
        <BookingModal
          tutor={bookingTutor}
          onClose={() => setBookingTutor(null)}
          onSuccess={() => {/* có thể refresh booking list ở đây nếu cần */}}
        />
      )}
    </div>
  );
};

export default TutorSearchPage;
