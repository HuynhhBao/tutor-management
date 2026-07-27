import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, Filter, GraduationCap, User, Calendar,
  BookOpen, ChevronRight, X, Clock, MessageSquare, CheckCircle, Star
} from 'lucide-react';
import { API_BASE_URL } from '../../utils/constants';

import AiMatchmaker from '../../components/ai/AiMatchmaker';
import BookingModal from '../../components/common/BookingModal';


/* ─── Main Page ───────────────────────────────────────────── */
const TutorSearchPage = () => {
  const [tutors, setTutors] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [bookingTutor, setBookingTutor] = useState(null); // tutor đang mở modal

  const fetchMyBookings = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/student/bookings`, { credentials: 'include' });
      const json = await res.json();
      if (json.status === 'ok') setMyBookings(json.data || []);
    } catch (err) {
      console.error('Lỗi khi tải lịch học của tôi:', err);
    }
  };

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
    fetchMyBookings();
  }, []);

  const tutorBookingMap = myBookings.reduce((acc, b) => {
    if (b.status === 'pending' || b.status === 'confirmed') {
      if (!acc[b.tutor_id] || b.status === 'confirmed') {
        acc[b.tutor_id] = b;
      }
    }
    return acc;
  }, {});

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
        {/* ── Matchmaker AI ── */}
        <AiMatchmaker 
          tutorBookingMap={tutorBookingMap} 
          onBookingSuccess={() => fetchMyBookings()} 
        />

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
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 text-base truncate">{tutor.full_name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {tutor.rating ? (
                            <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              {tutor.rating} {tutor.review_count ? `(${tutor.review_count})` : ''}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200/80 rounded-md">
                              <Star className="w-3.5 h-3.5 text-slate-400" />
                              Chưa có đánh giá
                            </span>
                          )}
                        </div>
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

                    {/* Học phí theo giờ */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-sm mt-1">
                      <span className="text-slate-500 font-medium">Học phí:</span>
                      <span className="font-extrabold text-blue-600 bg-blue-50/80 border border-blue-100 px-2.5 py-1 rounded-xl shadow-2xs">100.000đ / giờ</span>
                    </div>

                    {/* Nút đặt lịch hoặc huy hiệu trạng thái */}
                    {(() => {
                      const activeBooking = tutorBookingMap[tutor.id];
                      if (activeBooking?.status === 'pending') {
                        return (
                          <Link
                            to="/student-dashboard/booking-history"
                            className="mt-auto w-full py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-bold rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-2 border border-amber-200/80 shadow-2xs group-hover:shadow-sm"
                            title="Bạn có lịch chờ xác nhận với gia sư này. Bấm để chuyển đến Lịch của tôi."
                          >
                            <span>⏳ Đang chờ gia sư xác nhận...</span>
                          </Link>
                        );
                      }
                      if (activeBooking?.status === 'confirmed') {
                        return (
                          <Link
                            to="/student-dashboard/booking-history"
                            className="mt-auto w-full py-2.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white font-bold rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-1.5 border border-emerald-200/80 hover:border-emerald-600 shadow-2xs group-hover:shadow-sm"
                            title="Gia sư này đã chốt lịch với bạn. Bấm để truy cập Lịch của tôi / Phòng học."
                          >
                            <CheckCircle className="w-4 h-4 text-emerald-600 group-hover:text-white" />
                            <span>🎓 Đang theo học (Đã chốt lịch)</span>
                          </Link>
                        );
                      }
                      return (
                        <button
                          onClick={() => setBookingTutor(tutor)}
                          className="mt-auto w-full py-2.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white font-semibold rounded-xl text-sm transition-all duration-200 flex items-center justify-center gap-1.5 group-hover:shadow-sm"
                        >
                          Đặt lịch học
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      );
                    })()}
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
          onSuccess={() => {
            fetchMyBookings();
          }}
        />
      )}
    </div>
  );
};

export default TutorSearchPage;
