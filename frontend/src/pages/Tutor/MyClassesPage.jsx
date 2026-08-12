import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { BookOpen, Clock, User, MessageSquare, CheckCircle, GraduationCap, Search, Loader2, Video } from 'lucide-react';
import { API_BASE_URL } from '../../utils/constants';


export default function MyClassesPage() {
export default function MyClassesPage() {
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch bookings và filter chỉ lấy confirmed
  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/tutor/bookings`, { credentials: 'include' });
      const json = await res.json();
      if (json.status === 'ok') {
        const confirmed = (json.data || []).filter(b => b.status === 'confirmed');
        setClasses(confirmed);
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClasses(); }, [fetchClasses]);

  // Hoàn thành lớp học
  const handleComplete = async () => {
    if (!selectedBooking) return;
    setCompletingId(selectedBooking.id);
    try {
      const res = await fetch(`${API_BASE_URL}/tutor/bookings/${selectedBooking.id}/complete`, {
        method: 'PUT',
        credentials: 'include',
      });
      const json = await res.json();
      if (json.status === 'ok') {
        showAlert('Đã hoàn thành lớp học! 🎉');
        // Xóa khỏi danh sách local
        setClasses(prev => prev.filter(b => b.id !== selectedBooking.id));
      } else {
        showAlert(json.message || 'Có lỗi xảy ra');
      }
    } catch {
      showAlert('Không thể kết nối đến server');
    } finally {
      setCompletingId(null);
      setShowCompleteModal(false);
      setSelectedBooking(null);
    }
  };

  // Mở modal xác nhận
  const openCompleteModal = (booking) => {
    setSelectedBooking(booking);
    setShowCompleteModal(true);
  };

  // Lọc theo tìm kiếm
  const filteredClasses = classes.filter(b => {
    const term = searchTerm.toLowerCase();
    return (
      (b.student_name || '').toLowerCase().includes(term) ||
      (b.subject || '').toLowerCase().includes(term)
    );
  });

  // Render content
  const renderContent = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 animate-pulse">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-12 h-12 bg-slate-200 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-3 mb-5">
                <div className="h-3 bg-slate-200 rounded w-full" />
                <div className="h-3 bg-slate-200 rounded w-3/4" />
              </div>
              <div className="flex gap-3">
                <div className="h-10 bg-slate-200 rounded-xl flex-1" />
                <div className="h-10 bg-slate-200 rounded-xl flex-1" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (filteredClasses.length === 0) {
      return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <div className="mx-auto w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-5">
            <GraduationCap className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {searchTerm ? 'Không tìm thấy lớp nào' : 'Chưa có lớp nào đang dạy'}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {searchTerm
              ? 'Thử thay đổi từ khóa tìm kiếm để tìm lớp bạn cần.'
              : 'Khi có học viên đặt lịch và bạn xác nhận, lớp học sẽ xuất hiện ở đây.'}
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClasses.map((b, index) => {
          const startTime = b.schedule_time ? new Date(b.schedule_time).getTime() : 0;
          const durationHours = Number.parseFloat(b.duration || 1);
          const endTime = startTime + durationHours * 3600000;
          const isTimeGated = Date.now() < endTime && startTime > 0;
          const unlockTimeStr = startTime > 0
            ? new Date(endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
            : '';
          const fullUnlockDateStr = startTime > 0
            ? new Date(endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' ngày ' + new Date(endTime).toLocaleDateString('vi-VN')
            : '';

          return (
            <div
              key={b.id}
              className="group bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-blue-100 hover:-translate-y-1"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              {/* Card Header - Gradient Accent */}
              <div className="h-1.5 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600" />

              <div className="p-6">
                {/* Student Info */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-blue-200 group-hover:border-blue-300 transition-colors">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 truncate text-base">
                      {b.student_name || 'Học viên'}
                    </h3>
                    <p className="text-xs text-slate-500 truncate mt-0.5">
                      {b.student_email || 'Học viên đã đăng ký'}
                    </p>
                  </div>
                  {/* Badge trạng thái */}
                  <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    {' '}Đang diễn ra
                  </span>
                </div>

                {/* Course Details */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-2 bg-violet-50 rounded-lg">
                      <BookOpen className="w-4 h-4 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Môn học</p>
                      <p className="font-semibold text-slate-900">{b.subject} ({b.duration || 1} giờ)</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="p-2 bg-amber-50 rounded-lg">
                      <Clock className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Lịch học & Kết thúc ca</p>
                      <p className="font-semibold text-slate-900">
                        {b.schedule_time
                          ? `${new Date(b.schedule_time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${unlockTimeStr} (${new Date(b.schedule_time).toLocaleDateString('vi-VN')})`
                          : 'Chưa xác định'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2.5">
                  <button type="button"
                    onClick={() => navigate(`/classroom/${b.id}`)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all active:scale-95 shadow-md shadow-blue-100"
                  >
                    <Video className="w-4.5 h-4.5" />
                    Vào phòng học trực tuyến
                  </button>
                  <div className="flex gap-3">
                    <button type="button"
                      onClick={() => navigate('/tutor-dashboard/chat')}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border-2 border-blue-200 text-blue-600 text-sm font-bold rounded-xl hover:bg-blue-50 hover:border-blue-300 transition-all active:scale-95"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Nhắn tin
                    </button>
                    <button type="button"
                      onClick={() => openCompleteModal(b)}
                      disabled={completingId === b.id || isTimeGated}
                      title={isTimeGated ? `Nút sẽ mở khóa vào lúc ${fullUnlockDateStr}` : 'Xác nhận hoàn thành để nhận học phí'}
                      className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-white text-xs font-bold rounded-xl transition-all active:scale-95 ${
                        isTimeGated 
                          ? 'bg-slate-400 cursor-not-allowed opacity-90 hover:bg-slate-400' 
                          : 'bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 shadow-lg shadow-emerald-200'
                      }`}
                    >
                      {completingId === b.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Đang xử lý...
                        </>
                      ) : isTimeGated ? (
                        <>
                          <Clock className="w-3.5 h-3.5 animate-pulse" />
                          Mở lúc {unlockTimeStr}
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Hoàn thành
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-blue-600" />
            Lớp của tôi
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Quản lý các lớp đang dạy của bạn
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-4 py-2 bg-blue-50 text-blue-700 text-sm font-bold rounded-xl border border-blue-100">
            {classes.length} lớp đang dạy
          </span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên học viên hoặc môn học..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition-all"
        />
      </div>

      {/* Content */}
      {renderContent()}

      {/* Complete Confirmation Modal */}
      {showCompleteModal && selectedBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-emerald-600 animate-bounce" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 text-center mb-2">
              Hoàn thành lớp học?
            </h3>
            <p className="text-slate-500 text-center mb-3 leading-relaxed">
              Bạn có chắc chắn muốn đánh dấu lớp này là đã hoàn thành?
            </p>
            <div className="bg-slate-50 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-3 mb-2">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-sm font-semibold text-slate-900">{selectedBooking.student_name || 'Học viên'}</span>
              </div>
              <div className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-600">{selectedBooking.subject}</span>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button type="button"
                onClick={handleComplete}
                disabled={completingId}
                className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {completingId ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  'Xác nhận hoàn thành'
                )}
              </button>
              <button type="button"
                onClick={() => {
                  setShowCompleteModal(false);
                  setSelectedBooking(null);
                }}
                className="w-full py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
