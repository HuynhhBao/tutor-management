import React, { useState } from 'react';
import { FiUnlock, FiLock, FiCalendar, FiUser } from 'react-icons/fi';
import { formatCurrency, formatDate } from '../../utils/formatters';
import StudentBookingHistoryModal from './StudentBookingHistoryModal';

const StudentTable = ({ students, loading, onToggleStatus }) => {
  const [selectedStudentId, setSelectedStudentId] = useState(null);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!students || students.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-slate-500">
        <FiUser className="w-12 h-12 mb-3 text-slate-300" />
        <p>Không tìm thấy học viên nào</p>
      </div>
    );
  }

  return (
    <>
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50 sticky top-0 z-10">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Học viên
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Liên hệ
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Số dư ví
            </th>
            <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Tham gia
            </th>
            <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Trạng thái
            </th>
            <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Hành động
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {students.map((student) => (
            <tr key={student.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10">
                    <img 
                      className="h-10 w-10 rounded-full object-cover border border-slate-200" 
                      src={student.avatar_url || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(student.full_name) + '&background=random'} 
                      alt="" 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(student.full_name) + '&background=random';
                      }}
                    />
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-slate-900">{student.full_name}</div>
                    <div className="text-sm text-slate-500">ID: #{student.id}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-slate-900">{student.email}</div>
                <div className="text-sm text-slate-500">{student.phone_number || 'Chưa cập nhật'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-green-600">
                  {formatCurrency(student.balance || 0)}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                {formatDate(student.created_at)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  student.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {student.is_active ? 'Hoạt động' : 'Bị khóa'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex justify-end gap-2">
                  <button 
                    onClick={() => setSelectedStudentId(student.id)}
                    className="p-1.5 text-primary-600 hover:bg-primary-50 rounded transition-colors"
                    title="Lịch sử thuê gia sư"
                  >
                    <FiCalendar className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => onToggleStatus(student.id)}
                    className={`p-1.5 rounded transition-colors ${
                      student.is_active 
                        ? 'text-red-500 hover:bg-red-50' 
                        : 'text-green-500 hover:bg-green-50'
                    }`}
                    title={student.is_active ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                  >
                    {student.is_active ? <FiLock className="w-5 h-5" /> : <FiUnlock className="w-5 h-5" />}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Booking History Modal */}
      {selectedStudentId && (
        <StudentBookingHistoryModal 
          studentId={selectedStudentId} 
          isOpen={!!selectedStudentId} 
          onClose={() => setSelectedStudentId(null)} 
        />
      )}
    </>
  );
};

export default StudentTable;
