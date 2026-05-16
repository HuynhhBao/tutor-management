import React, { useState, useEffect, useCallback } from 'react';
import { Search, GraduationCap, Star, BookOpen, X, Calendar, CheckCircle, ChevronDown, Wallet } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API_BASE = 'http://localhost:3001/api';

// ─── Modal đặt lịch ───────────────────────────────────────────────────────────
function BookingModal({ tutor, onClose, onSuccess }) {
  const [form, setForm] = useState({ subject: '', scheduleTime: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.subject.trim() || !form.scheduleTime) {
      setError('Vui lòng điền môn học và thời gian học');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/student/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tutorId: tutor.id, ...form }),
      });
      const data = await res.json();
      if (res.ok) {
        onSuccess(data.message || 'Đặt lịch thành công!');
      } else {
        setError(data.message || 'Có lỗi xảy ra khi đặt lịch');
      }
    } catch {
      setError('Không thể kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-slate-100 relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Tutor info */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
          <img
            src={tutor.avatar_url
              ? `http://localhost:3001${tutor.avatar_url}`
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.full_name)}&background=dbeafe&color=1d4ed8`}
            alt={tutor.full_name}
            className="w-14 h-14 rounded-full object-cover border-2 border-blue-100"
          />
          <div>
            <h3 className="text-lg font-bold text-slate-900">{tutor.full_name}</h3>
            <p className="text-sm text-slate-500">{tutor.subjects || 'Nhiều môn học'}</p>
            <p className="text-xs text-slate-400">{tutor.qualification || ''}</p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-slate-900 mb-1">Đặt lịch học</h2>
        <p className="text-sm text-slate-500 mb-5 flex items-center gap-1.5">
          <Wallet className="w-4 h-4 text-blue-500" />
          Phí đặt lịch: <strong className="text-blue-600 ml-1">100.000đ</strong>
          <span className="text-slate-400 ml-1">(trừ từ ví của bạn)</span>
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Môn học <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="VD: Toán, Tiếng Anh, Vật lý..."
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Thời gian học mong muốn <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={form.scheduleTime}
              onChange={(e) => setForm({ ...form, scheduleTime: e.target.value })}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Lời nhắn <span className="text-slate-400 font-normal">(tùy chọn)</span>
            </label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Mô tả thêm về nhu cầu học của bạn..."
              rows={3}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all">
              Hủy bỏ
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-2xl transition-all shadow-md shadow-blue-100 active:scale-95">
              {loading ? 'Đang đặt...' : 'Xác nhận đặt lịch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Card gia sư ──────────────────────────────────────────────────────────────
function TutorCard({ tutor, onBook }) {
  const isAvailable = tutor.status === 'Sẵn sàng nhận lớp';
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col">
      <div className="p-6 flex-1">
        <div className="flex items-start gap-4">
          <img
            src={tutor.avatar_url
              ? `http://localhost:3001${tutor.avatar_url}`
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(tutor.full_name)}&background=dbeafe&color=1d4ed8&size=80`}
            alt={tutor.full_name}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-slate-100 shrink-0"
          />
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 truncate">{tutor.full_name}</h3>
            <p className="text-xs text-slate-500 mt-0.5 truncate">{tutor.qualification || 'Gia sư'}</p>
            <div className="flex items-center gap-1 mt-1">
              <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
              <span className="text-xs font-medium text-slate-700">{tutor.rating || '4.9'}</span>
            </div>
          </div>
        </div>

        {tutor.subjects && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {tutor.subjects.split(',').slice(0, 3).map((s, i) => (
              <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                {s.trim()}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="px-6 pb-6 flex items-center justify-between">
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
          isAvailable ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isAvailable ? 'bg-green-500 animate-pulse' : 'bg-slate-400'}`} />
          {isAvailable ? 'Sẵn sàng' : 'Bận'}
        </span>
        <button
          id={`book-tutor-${tutor.id}`}
          onClick={() => onBook(tutor)}
          disabled={!isAvailable}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold rounded-xl transition-colors"
        >
          Đặt lịch
        </button>
      </div>
    </div>
  );
}

// ─── Trang chính ──────────────────────────────────────────────────────────────
export default function BookingPage() {
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const fetchTutors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/tutors`, { credentials: 'include' });
      const data = await res.json();
      if (data.status === 'ok') {
        let list = (data.data || []).filter(t => t.status !== 'Đang chờ');
        if (search) {
          const q = search.toLowerCase();
          list = list.filter(t =>
            t.full_name?.toLowerCase().includes(q) ||
            t.subjects?.toLowerCase().includes(q)
          );
        }
        if (subjectFilter) {
          list = list.filter(t => t.subjects?.toLowerCase().includes(subjectFilter.toLowerCase()));
        }
        setTutors(list);
      }
    } catch (err) {
      console.error('fetchTutors error:', err);
    } finally {
      setLoading(false);
    }
  }, [search, subjectFilter]);

  useEffect(() => { fetchTutors(); }, [fetchTutors]);

  const handleSearch = (e) => { e.preventDefault(); setSearch(searchInput); };

  const handleBookSuccess = (msg) => {
    setSelectedTutor(null);
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 5000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <GraduationCap className="h-7 w-7 text-blue-600" />
          Đặt lịch học
        </h1>
        <p className="text-sm text-slate-500 mt-1">Chọn gia sư phù hợp và đặt lịch học ngay</p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm font-medium">
          <CheckCircle className="w-5 h-5 shrink-0" />
          {successMsg}
        </div>
      )}

      {/* Search & filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              id="search-tutor-input"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Tìm theo tên gia sư hoặc môn học..."
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 bg-white"
            />
          </div>
          <button type="submit"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors">
            Tìm
          </button>
        </form>
        <div className="relative">
          <select
            id="subject-filter"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="appearance-none pl-4 pr-10 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-white cursor-pointer"
          >
            <option value="">Tất cả môn học</option>
            <option value="Toán">Toán</option>
            <option value="Văn">Ngữ văn</option>
            <option value="Anh">Tiếng Anh</option>
            <option value="Lý">Vật lý</option>
            <option value="Hóa">Hóa học</option>
            <option value="Sinh">Sinh học</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Tutor list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tutors.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Search className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">Không tìm thấy gia sư</h3>
          <p className="text-slate-500 mt-2 text-sm">Thử thay đổi từ khóa hoặc bộ lọc</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-slate-500">
            Tìm thấy <strong className="text-slate-800">{tutors.length}</strong> gia sư
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {tutors.map(tutor => (
              <TutorCard key={tutor.id} tutor={tutor} onBook={setSelectedTutor} />
            ))}
          </div>
        </>
      )}

      {selectedTutor && (
        <BookingModal
          tutor={selectedTutor}
          onClose={() => setSelectedTutor(null)}
          onSuccess={handleBookSuccess}
        />
      )}
    </div>
  );
}
