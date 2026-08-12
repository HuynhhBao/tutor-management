import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Search, 
  RefreshCw, 
  BookOpen, 
  CheckCircle, 
  AlertTriangle, 
  XCircle
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import ClassTable from '../../components/admin/ClassTable';
import DisputeResolutionModal from '../../components/admin/DisputeResolutionModal';

const STATS_CARDS = [
  { key: 'total', label: 'Tổng số Lớp học', icon: BookOpen, color: 'text-primary-600 bg-primary-50 border-primary-100' },
  { key: 'confirmed', label: 'Đang học / Đã xác nhận', icon: CheckCircle, color: 'text-blue-600 bg-blue-50 border-blue-100' },
  { key: 'disputed', label: 'Có tranh chấp', icon: AlertTriangle, color: 'text-rose-600 bg-rose-50 border-rose-100' },
  { key: 'completed', label: 'Đã hoàn thành', icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
  { key: 'cancelled', label: 'Đã hủy', icon: XCircle, color: 'text-slate-600 bg-slate-100 border-slate-200' },
];

const TABS = [
  { id: 'all', label: 'Tất cả' },
  { id: 'confirmed', label: 'Đang học' },
  { id: 'disputed', label: 'Có tranh chấp' },
  { id: 'resolved', label: 'Đã giải quyết' },
  { id: 'completed', label: 'Hoàn thành' },
  { id: 'cancelled', label: 'Đã hủy' },
  { id: 'pending', label: 'Chờ xác nhận' },
];

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [stats, setStats] = useState({ total: 0, confirmed: 0, disputed: 0, completed: 0, cancelled: 0 });
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams();
      if (activeTab !== 'all') queryParams.append('status', activeTab);
      if (searchTerm.trim()) queryParams.append('search', searchTerm.trim());

      const res = await apiClient(`/admin/classes?${queryParams.toString()}`);
      const data = await res.json();

      if (data.status === 'ok') {
        setClasses(data.data || []);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách lớp học:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, [activeTab]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchClasses();
  };

  const handleUpdateStatus = async (classId, { status, adminNote, isRefund }) => {
    const res = await apiClient(`/admin/classes/${classId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminNote, isRefund })
    });
    const data = await res.json();
    if (data.status === 'ok') {
      fetchClasses();
    } else {
      throw new Error(data.message || 'Không thể cập nhật trạng thái');
    }
  };

  const openModal = (classItem) => {
    setSelectedClass(classItem);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-7 h-7 text-primary-600" />
            Sắp xếp & Quản lý Lớp học
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Theo dõi tất cả các lớp học giữa Gia sư và Học viên, xử lý và can thiệp các tranh chấp phát sinh.
          </p>
        </div>

        <button type="button"
          onClick={fetchClasses}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-sm transition-colors self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Làm mới
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {STATS_CARDS.map((card) => {
          const Icon = card.icon;
          const val = stats[card.key] || 0;
          return (
            <div
              key={card.key}
              className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3"
            >
              <div className={`p-3 rounded-xl border ${card.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">{card.label}</p>
                <p className="text-xl font-bold text-slate-900">{val}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            {TABS.map((tab) => (
              <button type="button"
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo Học viên, Gia sư, Môn..."
              className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          </form>
        </div>

        {/* Class Table */}
        <ClassTable
          classes={classes}
          loading={loading}
          onSelectClass={openModal}
        />
      </div>

      {/* Modal Xử lý tranh chấp / Cập nhật */}
      <DisputeResolutionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedClass(null);
        }}
        selectedClass={selectedClass}
        onUpdateStatus={handleUpdateStatus}
      />
    </div>
  );
};

export default ClassManagement;
