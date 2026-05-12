import React from 'react';
import PropTypes from 'prop-types';
import { GraduationCap, CheckCircle, Clock, Edit2, Trash2, KeyRound, BookOpen, Loader2, Moon } from 'lucide-react';

const StatusBadge = ({ status }) => {
  if (status === 'Sẵn sàng nhận lớp') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Sẵn sàng
      </span>
    );
  }
  if (status === 'Tạm nghỉ') {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
        <Moon className="w-3.5 h-3.5 mr-1" /> Tạm nghỉ
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
      <Clock className="w-3.5 h-3.5 mr-1" /> {status}
    </span>
  );
};

StatusBadge.propTypes = {
  status: PropTypes.string,
};

const TutorTable = ({ tutors, loading, searchTerm, onEdit, onDelete, onGrant }) => {
  const filtered = tutors.filter(t =>
    t.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.subjects.toLowerCase().includes(searchTerm.toLowerCase())
  );

  let tableContent;
  if (loading) {
    tableContent = (
      <tr>
        <td colSpan="5" className="px-6 py-12 text-center text-gray-500 bg-white">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            <p>Đang tải dữ liệu...</p>
          </div>
        </td>
      </tr>
    );
  } else if (filtered.length > 0) {
    tableContent = filtered.map((tutor) => (
      <tr key={tutor.id} className="hover:bg-slate-100/80 transition-colors">
        <td className="px-6 py-4">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold uppercase border border-primary-200">
              {tutor.full_name.charAt(0)}
            </div>
            <div className="ml-3">
              <p className="font-medium text-gray-900">{tutor.full_name}</p>
              <p className="text-xs text-gray-500">ID: TS-{tutor.id.toString().padStart(4, '0')} • {tutor.gender}, {tutor.age} tuổi</p>
              {tutor.email && <p className="text-xs text-gray-400 mt-0.5">{tutor.email}</p>}
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex flex-wrap gap-1">
            {tutor.subjects.split(',').map(sub => (
              <span key={sub} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-blue-800 border border-indigo-100">
                {sub.trim()}
              </span>
            ))}
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center text-slate-600">
            <GraduationCap className="w-4 h-4 mr-2 text-slate-400" />
            {tutor.qualification}
          </div>
        </td>
        <td className="px-6 py-4">
          <StatusBadge status={tutor.status} />
        </td>
        <td className="px-6 py-4 text-right">
          <div className="flex items-center justify-end space-x-2">
            <button onClick={() => onGrant(tutor)} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors" title="Cấp tài khoản">
              <KeyRound className="w-4 h-4" />
            </button>
            <button onClick={() => onEdit(tutor)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Chỉnh sửa">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={() => onDelete(tutor.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </td>
      </tr>
    ));
  } else {
    tableContent = (
      <tr>
        <td colSpan="5" className="px-6 py-12 text-center text-gray-500 bg-white">
          <div className="flex flex-col items-center gap-2">
            <BookOpen className="w-12 h-12 text-slate-200" />
            <p>Chưa có dữ liệu gia sư.</p>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <table className="w-full text-left text-sm">
      <thead className="bg-slate-100 text-gray-500 border-b border-gray-100">
        <tr>
          <th className="px-6 py-4 font-semibold">Tên gia sư</th>
          <th className="px-6 py-4 font-semibold">Môn dạy</th>
          <th className="px-6 py-4 font-semibold">Bằng cấp</th>
          <th className="px-6 py-4 font-semibold">Trạng thái</th>
          <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {tableContent}
      </tbody>
    </table>
  );
};

TutorTable.propTypes = {
  tutors: PropTypes.array.isRequired,
  loading: PropTypes.bool.isRequired,
  searchTerm: PropTypes.string.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onGrant: PropTypes.func.isRequired,
};

export default TutorTable;
