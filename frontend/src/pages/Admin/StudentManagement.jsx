import React, { useState, useEffect } from 'react';
import { api } from '../../services/apiClient';
import { toast } from 'react-hot-toast';
import { FiSearch, FiRefreshCw } from 'react-icons/fi';
import StudentTable from '../../components/admin/StudentTable';
import { useAlert } from '../../context/AlertContext';

const StudentManagement = () => {
  const { showConfirm } = useAlert();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/students', {
        params: { search: search.trim() }
      });
      if (res.data.status === 'ok') {
        setStudents(res.data.students);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Lỗi khi tải danh sách học viên');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Delay search to avoid spamming API
    const delayDebounceFn = setTimeout(() => {
      fetchStudents();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleToggleStatus = (id) => {
    showConfirm('Bạn có chắc chắn muốn thay đổi trạng thái hoạt động của học viên này?', async () => {
      try {
        const res = await api.put(`/admin/students/${id}/toggle-status`);
        if (res.data.status === 'ok') {
          toast.success(res.data.message);
          // Update state locally
          setStudents(prev => prev.map(student => 
            student.id === id 
              ? { ...student, is_active: res.data.student.is_active } 
              : student
          ));
        }
      } catch (error) {
        toast.error(error.response?.data?.message || 'Lỗi khi cập nhật trạng thái');
      }
    });
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Học viên</h1>
          <p className="text-slate-500 mt-1">Xem danh sách và quản lý tài khoản người học</p>
        </div>
        
        <button type="button" 
          onClick={fetchStudents}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
        >
          <FiRefreshCw className={loading ? "animate-spin" : ""} />
          Làm mới
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <div className="relative w-72">
            <input
              type="text"
              placeholder="Tìm kiếm theo tên, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            />
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {/* Table Content */}
        <div className="flex-1 overflow-auto p-0">
          <StudentTable 
            students={students} 
            loading={loading} 
            onToggleStatus={handleToggleStatus} 
          />
        </div>
      </div>
    </div>
  );
};

export default StudentManagement;
