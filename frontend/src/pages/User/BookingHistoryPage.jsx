import React, { useState, useEffect, useCallback } from 'react';
import { CalendarCheck, Calendar, BookOpen, CheckCircle, Clock, XCircle, AlertTriangle, RefreshCw, ChevronDown } from 'lucide-react';

const API_BASE = 'http://localhost:3001/api';

const STATUS_CONFIG = {
  all:       { label: 'Tất cả',       color: 'bg-slate-100 text-slate-700' },
  pending:   { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Đã xác nhận',  color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Hoàn thành',   color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Đã hủy',       color: 'bg-red-100 text-red-700' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// Modal xác nhận hủy lịch
function CancelModal({ booking, onConfirm, onClose }) {
  if (!booking) return null;
  
  const now = new Date();
  const scheduleTime = new Date(booking.schedule_time);
  const hoursDifference = (scheduleTime - now) / (1000 * 60 * 60);
  const isEligibleForRefund = booking.status === 'pending' || hoursDifference >= 24;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
        <div className="flex justify-center mb-5">
          <div className={`p-4 rounded-full ${isEligibleForRefund ? 'bg-amber-50' : 'bg-red-50'}`}>
            <AlertTriangle className={`h-10 w-10 ${isEligibleForRefund ? 'text-amber-500' : 'text-red-500'}`} />
          </div>
        </div>
        <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Xác nhận hủy lịch học</h3>
        <p className="text-slate-500 text-center text-sm mb-6 leading-relaxed">
          Bạn đang yêu cầu hủy lịch học môn <strong className="text-slate-800">{booking.subject}</strong>{' '}
          với gia sư <strong className="text-slate-800">{booking.tutor_name}</strong>.
        </p>

        <div className={`p-5 rounded-2xl border mb-8 text-sm ${
          isEligibleForRefund 
            ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
            : 'bg-rose-50 border-rose-100 text-rose-800'
        }`}>
          <div className="flex gap-3">
            {isEligibleForRefund ? (
              <>
                <CheckCircle className="h-5 w-5 shrink-0" />
                <div className="space-y-1">
                  <p className="font-bold">Đủ điều kiện hoàn tiền 100%</p>
                  <p className="text-xs opacity-90">Vì lịch học chưa được xác nhận hoặc bạn báo trước giờ học trên 24 tiếng.</p>
                  <p className="text-xs font-bold mt-1">✓ Bạn sẽ nhận lại 100.000đ vào ví.</p>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle className="h-5 w-5 shrink-0" />
                <div className="space-y-1">
                  <p className="font-bold">Không được hoàn tiền phí đặt lịch</p>
                  <p className="text-xs opacity-90">Vì lịch học đã được gia sư xác nhận và thời gian hủy cách giờ học dưới 24 tiếng.</p>
                  <p className="text-xs font-bold mt-1">⚠️ Bạn sẽ mất 100.000đ phí đặt lịch.</p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            id="confirm-cancel-btn"
            onClick={() => onConfirm(booking.id)}
            className={`w-full py-4 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95 ${
              isEligibleForRefund 
                ? 'bg-amber-600 shadow-amber-100 hover:bg-amber-700' 
                : 'bg-red-600 shadow-red-100 hover:bg-red-700'
            }`}
          >
            {isEligibleForRefund ? 'Xác nhận hủy và hoàn tiền' : 'Tôi chấp nhận hủy và mất phí'}
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all active:scale-95"
          >
            Không, giữ lại
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BookingHistoryPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      const res = await fetch(`${API_BASE}/student/bookings?${params}`, { credentials: 'include' });
      const data = await res.json();
      if (data.status === 'ok') setBookings(data.data);
    } catch (err) {
      console.error('fetchBookings error:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  const handleCancelConfirm = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/student/bookings/${id}/cancel`, {
        method: 'PUT',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message, 'success');
        setCancelTarget(null);
        fetchBookings();
      } else {
        showToast(data.message || 'Có lỗi xảy ra', 'error');
        setCancelTarget(null);
      }
    } catch {
      showToast('Không thể kết nối đến máy chủ', 'error');
      setCancelTarget(null);
    }
  };

  const formatDateTime = (dt) => {
    if (!dt) return '—';
    try {
      return new Date(dt).toLocaleString('vi-VN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return dt; }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarCheck className="h-7 w-7 text-blue-600" />
            Lịch đặt của tôi
          </h1>
          <p className="text-sm text-slate-500 mt-1">Theo dõi và quản lý các lịch học của bạn</p>
        </div>
        <button
          id="refresh-bookings-btn"
          onClick={fetchBookings}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shadow-sm"
        >
          <RefreshCw className="h-4 w-4" />
          Làm mới
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`flex items-center gap-3 p-4 rounded-xl border text-sm font-medium ${
          toast.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle className="h-5 w-5 shrink-0" />
            : <XCircle className="h-5 w-5 shrink-0" />}
          {toast.message}
        </div>
      )}

      {/* Filter */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          Hiển thị <strong className="text-slate-800">{bookings.length}</strong> lịch đặt
        </p>
        <div className="relative">
          <select
            id="booking-status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white cursor-pointer"
          >
            {Object.entries(STATUS_CONFIG).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Booking list */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <CalendarCheck className="h-8 w-8 text-slate-400" />
            </div>
            <h4 className="font-medium text-slate-900">Chưa có lịch đặt nào</h4>
            <p className="text-sm text-slate-500 mt-1">Hãy tìm gia sư và đặt lịch học nhé!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {bookings.map((b) => (
              <div key={b.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-start gap-4 justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <img
                      src={b.tutor_avatar
                        ? `http://localhost:3001${b.tutor_avatar}`
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(b.tutor_name || 'T')}&background=dbeafe&color=1d4ed8`}
                      alt={b.tutor_name}
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-slate-900">{b.tutor_name}</h4>
                        <StatusBadge status={b.status} />
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-medium">Môn:</span> {b.subject}
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-medium">Thời gian:</span> {formatDateTime(b.schedule_time)}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        Đặt lúc: {formatDateTime(b.created_at)}
                      </div>
                      {b.message && (
                        <p className="text-xs text-slate-500 italic bg-slate-50 rounded-lg px-3 py-1.5 border-l-2 border-slate-300">
                          "{b.message}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="shrink-0 flex items-center gap-2">
                    {b.status === 'confirmed' && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl font-medium border border-blue-100">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Đã xác nhận
                      </span>
                    )}
                    {(b.status === 'pending' || b.status === 'confirmed') && (
                      <button
                        id={`cancel-booking-${b.id}`}
                        onClick={() => setCancelTarget(b)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-xl transition-colors border border-red-100"
                      >
                        <XCircle className="w-4 h-4" />
                        Hủy lịch
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CancelModal
        booking={cancelTarget}
        onConfirm={handleCancelConfirm}
        onClose={() => setCancelTarget(null)}
      />
    </div>
  );
}
