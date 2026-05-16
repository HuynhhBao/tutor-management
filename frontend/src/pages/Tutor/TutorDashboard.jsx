import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Star, CheckCircle, Clock, Moon, User, CalendarCheck } from 'lucide-react';
import { API_BASE_URL } from '../../utils/constants';

const STATUS_MAP = {
  pending:   { label: 'Chờ xác nhận', color: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Đã xác nhận',  color: 'bg-emerald-100 text-emerald-700' },
  cancelled: { label: 'Đã hủy',       color: 'bg-red-100 text-red-600' },
  completed: { label: 'Hoàn thành',   color: 'bg-slate-100 text-slate-600' },
};

export default function TutorDashboard() {
  const { user } = useAuth();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isReady, setIsReady] = useState(user?.status === 'Sẵn sàng nhận lớp');
  const [bookings, setBookings] = useState([]);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState(null); // id booking đang xác nhận

  useEffect(() => {
    if (user?.status) setIsReady(user.status === 'Sẵn sàng nhận lớp');
  }, [user?.status]);

  // Fetch bookings dành cho tutor này
  const fetchBookings = useCallback(async () => {
    try {
      setBookingsLoading(true);
      const res = await fetch(`${API_BASE_URL}/tutor/bookings`, { credentials: 'include' });
      const json = await res.json();
      if (json.status === 'ok') setBookings(json.data || []);
    } catch (err) {
      console.error('Error fetching tutor bookings:', err);
    } finally {
      setBookingsLoading(false);
    }
  }, []);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const confirmToggle = async () => {
    const nextReadyState = !isReady;
    const nextStatusText = nextReadyState ? 'Sẵn sàng nhận lớp' : 'Tạm nghỉ';
    try {
      const response = await fetch(`${API_BASE_URL}/tutors/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tutorId: user.id, status: nextStatusText }),
      });
      if (response.ok) setIsReady(nextReadyState);
      else alert('Có lỗi xảy ra khi cập nhật trạng thái');
    } catch {
      alert('Không thể kết nối đến server');
    } finally {
      setShowConfirmModal(false);
    }
  };

  const handleConfirm = async (bookingId) => {
    setConfirmingId(bookingId);
    try {
      const res = await fetch(`${API_BASE_URL}/tutor/bookings/${bookingId}/confirm`, {
        method: 'PUT',
        credentials: 'include',
      });
      const json = await res.json();
      if (json.status === 'ok') {
        // Cập nhật local state luôn không cần fetch lại
        setBookings(prev =>
          prev.map(b => b.id === bookingId ? { ...b, status: 'confirmed' } : b)
        );
      } else {
        alert(json.message || 'Xác nhận thất bại');
      }
    } catch {
      alert('Không thể kết nối đến server');
    } finally {
      setConfirmingId(null);
    }
  };

  const activeBookings  = bookings.filter(b => b.status === 'confirmed');
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const recentBookings  = bookings.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Xin chào, {user?.fullName || user?.username}! 👋
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Chào mừng bạn quay lại với bảng điều khiển dành cho Gia sư.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl transition-colors duration-300 ${isReady ? 'bg-green-50' : 'bg-slate-100'}`}>
                {isReady
                  ? <CheckCircle className="h-6 w-6 text-green-600 animate-in zoom-in duration-300" />
                  : <Moon className="h-6 w-6 text-slate-400 animate-in zoom-in duration-300" />
                }
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Trạng thái hiện tại</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className={`h-2 w-2 rounded-full ${isReady ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
                  <p className={`text-lg font-bold transition-colors duration-300 ${isReady ? 'text-slate-900' : 'text-slate-400'}`}>
                    {isReady ? 'Sẵn sàng nhận lớp' : 'Tạm nghỉ'}
                  </p>
                </div>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer group">
              <span className="sr-only">Bật tắt trạng thái sẵn sàng</span>
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isReady}
                onChange={() => setShowConfirmModal(true)}
              />
              <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500" />
            </label>
          </div>
        </div>

        {/* Lớp đang dạy */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Lớp đang dạy</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{activeBookings.length}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Chờ xác nhận */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Yêu cầu chờ xác nhận</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">{pendingBookings.length}</p>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl">
              <Star className="h-6 w-6 text-amber-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Yêu cầu đặt lịch */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Yêu cầu đặt lịch gần đây</h3>
          <span className="text-xs text-slate-400 font-medium bg-slate-100 px-3 py-1 rounded-full">
            {bookings.length} lịch
          </span>
        </div>

        {bookingsLoading ? (
          <div className="p-8 space-y-4">
            {[1, 2].map(i => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-200 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/3" />
                  <div className="h-3 bg-slate-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : recentBookings.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <CalendarCheck className="h-8 w-8 text-slate-400" />
            </div>
            <h4 className="text-base font-medium text-slate-900">Chưa có yêu cầu nào</h4>
            <p className="mt-1 text-sm text-slate-500">
              Khi có học viên đặt lịch, thông tin sẽ hiển thị ở đây.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {recentBookings.map(b => {
              const st = STATUS_MAP[b.status] || STATUS_MAP.pending;
              return (
                <div key={b.id} className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">
                      {b.student_name || b.user_name || 'Học viên'}
                    </p>
                    <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        {b.subject}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {b.schedule_time
                          ? new Date(b.schedule_time).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
                          : '—'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {b.status === 'pending' ? (
                      <button
                        onClick={() => handleConfirm(b.id)}
                        disabled={confirmingId === b.id}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white text-xs font-bold rounded-xl transition-all active:scale-95 flex items-center gap-1.5"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        {confirmingId === b.id ? 'Đang xử lý...' : 'Xác nhận'}
                      </button>
                    ) : (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${st.color}`}>
                        {st.label}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Status Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isReady ? 'bg-amber-50' : 'bg-green-50'}`}>
              {isReady
                ? <Moon className="w-10 h-10 text-amber-600 animate-pulse" />
                : <CheckCircle className="w-10 h-10 text-green-600 animate-bounce" />
              }
            </div>
            <h3 className="text-2xl font-bold text-slate-900 text-center mb-2">Xác nhận thay đổi</h3>
            <p className="text-slate-500 text-center mb-8 leading-relaxed">
              Bạn có chắc chắn muốn chuyển trạng thái sang{' '}
              <strong>{isReady ? 'Tạm nghỉ' : 'Sẵn sàng nhận lớp'}</strong> không?
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={confirmToggle}
                className={`w-full py-4 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95 ${
                  isReady ? 'bg-amber-600 shadow-amber-200 hover:bg-amber-700' : 'bg-green-600 shadow-green-200 hover:bg-green-700'
                }`}
              >
                Xác nhận thay đổi
              </button>
              <button
                onClick={() => setShowConfirmModal(false)}
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
