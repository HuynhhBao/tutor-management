import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar, Search, XCircle, CheckCircle, Clock,
  AlertTriangle, RefreshCw, User, BookOpen, ChevronDown
} from 'lucide-react';

const API_BASE = 'http://localhost:3001/api';

const STATUS_CONFIG = {
  all:       { label: 'Tất cả',       color: 'bg-slate-100 text-slate-700' },
  pending:   { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Đã xác nhận',  color: 'bg-blue-100 text-blue-700' },
  completed: { label: 'Hoàn thành',   color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Đã hủy',       color: 'bg-red-100 text-red-700' },
};

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5">{value ?? '—'}</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'bg-slate-100 text-slate-600' };
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${cfg.color}`}>
      {cfg.label}
    </span>
  );
}

// Modal xác nhận hủy lịch
function ConfirmCancelModal({ booking, onConfirm, onClose }) {
  if (!booking) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100">
        <div className="flex justify-center mb-5">
          <div className="bg-red-50 p-4 rounded-full">
            <AlertTriangle className="h-10 w-10 text-red-500" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-slate-900 text-center mb-2">Xác nhận hủy lịch</h3>
        <p className="text-slate-500 text-center mb-1">
          Bạn có chắc chắn muốn hủy lịch học này không?
        </p>
        <p className="text-slate-500 text-center text-sm mb-6">
          Học viên <strong className="text-slate-700">{booking.student_name}</strong> sẽ được
          <strong className="text-green-600"> hoàn 100.000đ</strong> vào ví.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => onConfirm(booking.id)}
            className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-all shadow-md shadow-red-100 active:scale-95"
          >
            Xác nhận hủy lịch
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

export default function AdminBookingManagement() {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/admin/bookings/stats`, { credentials: 'include' });
      const data = await res.json();
      if (data.status === 'ok') setStats(data.data);
    } catch (err) {
      console.error('fetchStats error:', err);
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (search) params.append('search', search);

      const res = await fetch(`${API_BASE}/admin/bookings?${params}`, { credentials: 'include' });
      const data = await res.json();
      if (data.status === 'ok') setBookings(data.data);
    } catch (err) {
      console.error('fetchBookings error:', err);
    } finally {
      setLoading(false);
    }
  }, [filterStatus, search]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleCancelConfirm = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/admin/bookings/${id}/cancel`, {
        method: 'PUT',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message || 'Đã hủy lịch thành công!', 'success');
        setCancelTarget(null);
        fetchBookings();
        fetchStats();
      } else {
        showToast(data.message || 'Có lỗi xảy ra', 'error');
        setCancelTarget(null);
      }
    } catch (err) {
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
    } catch {
      return dt;
    }
  };

  const canCancel = (status) => status === 'pending' || status === 'confirmed';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="h-7 w-7 text-primary-600" />
            Quản lý đặt lịch
          </h1>
          <p className="text-sm text-slate-500 mt-1">Xem và quản lý toàn bộ lịch đặt gia sư của học viên</p>
        </div>
        <button
          onClick={() => { fetchBookings(); fetchStats(); }}
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Calendar} label="Tổng lịch đặt" value={stats?.total} color="bg-slate-100 text-slate-600" />
        <StatCard icon={Clock} label="Chờ xác nhận" value={stats?.pending} color="bg-yellow-100 text-yellow-600" />
        <StatCard icon={CheckCircle} label="Hoàn thành" value={stats?.completed} color="bg-green-100 text-green-600" />
        <StatCard icon={XCircle} label="Đã hủy" value={stats?.cancelled} color="bg-red-100 text-red-600" />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo tên học viên, gia sư, môn học..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            Tìm
          </button>
        </form>

        {/* Status Filter */}
        <div className="relative">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="appearance-none pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-400 bg-white cursor-pointer"
          >
            {Object.entries(STATUS_CONFIG).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <p className="text-sm text-slate-500">
            Hiển thị <strong className="text-slate-800">{bookings.length}</strong> lịch đặt
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-16 text-center">
            <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-slate-400" />
            </div>
            <h4 className="font-medium text-slate-900">Không có lịch đặt nào</h4>
            <p className="text-sm text-slate-500 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {bookings.map((b) => (
              <div key={b.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex flex-col md:flex-row md:items-start gap-4 justify-between">

                  {/* Info block */}
                  <div className="flex flex-col sm:flex-row gap-4 flex-1">
                    {/* Student */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <img
                        src={b.student_avatar
                          ? `http://localhost:3001${b.student_avatar}`
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(b.student_name || 'S')}&background=dbeafe&color=1d4ed8`}
                        alt={b.student_name}
                        className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200"
                      />
                      <div className="min-w-0">
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Học viên</p>
                        <p className="font-semibold text-slate-900 truncate">{b.student_name}</p>
                        <p className="text-xs text-slate-500 truncate">{b.student_email}</p>
                      </div>
                    </div>

                    {/* Tutor */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <img
                        src={b.tutor_avatar
                          ? `http://localhost:3001${b.tutor_avatar}`
                          : `https://ui-avatars.com/api/?name=${encodeURIComponent(b.tutor_name || 'T')}&background=dcfce7&color=15803d`}
                        alt={b.tutor_name}
                        className="w-10 h-10 rounded-full object-cover shrink-0 border border-slate-200"
                      />
                      <div className="min-w-0">
                        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Gia sư</p>
                        <p className="font-semibold text-slate-900 truncate">{b.tutor_name}</p>
                        <p className="text-xs text-slate-500 truncate">{b.tutor_email}</p>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <BookOpen className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-medium">Môn:</span>
                        <span className="truncate">{b.subject || '—'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-medium">Lịch:</span>
                        <span>{formatDateTime(b.schedule_time)}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <User className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-medium">Đặt lúc:</span>
                        <span>{formatDateTime(b.created_at)}</span>
                      </div>
                      {b.message && (
                        <p className="text-xs text-slate-500 italic bg-slate-50 rounded-lg px-3 py-1.5 border-l-2 border-slate-300">
                          "{b.message}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Status & Action */}
                  <div className="flex flex-row md:flex-col items-center md:items-end gap-3 shrink-0">
                    <StatusBadge status={b.status} />
                    {canCancel(b.status) && (
                      <button
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

      {/* Confirm Cancel Modal */}
      <ConfirmCancelModal
        booking={cancelTarget}
        onConfirm={handleCancelConfirm}
        onClose={() => setCancelTarget(null)}
      />
    </div>
  );
}
