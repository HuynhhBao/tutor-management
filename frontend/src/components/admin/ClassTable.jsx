import React from 'react';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Edit3, 
  MessageSquare,
  RefreshCw
} from 'lucide-react';
import { formatDate } from '../../utils/formatters';

const STATUS_BADGES = {
  confirmed: { label: 'Đang học', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  disputed: { label: 'Tranh chấp', color: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' },
  resolved: { label: 'Đã giải quyết', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  completed: { label: 'Hoàn thành', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  cancelled: { label: 'Đã hủy', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  pending: { label: 'Chờ xác nhận', color: 'bg-amber-50 text-amber-700 border-amber-200' },
};

const ClassTable = ({ classes, loading, onSelectClass }) => {
  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-primary-600 mb-2" />
        <p className="text-xs">Đang tải danh sách lớp học...</p>
      </div>
    );
  }

  if (!classes || classes.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64 text-slate-500 bg-white rounded-2xl border border-slate-200">
        <Calendar className="w-12 h-12 mb-3 text-slate-300" />
        <p className="font-medium text-slate-700 text-sm">Không tìm thấy lớp học nào</p>
        <p className="text-xs text-slate-400">Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-2xl border border-slate-200 shadow-sm">
      <table className="min-w-full divide-y divide-slate-200 text-left">
        <thead className="bg-slate-50 text-gray-500 text-sm font-medium">
          <tr>
            <th className="px-6 py-3.5 font-medium">
              Lớp & Môn học
            </th>
            <th className="px-6 py-3.5 font-medium">
              Học viên
            </th>
            <th className="px-6 py-3.5 font-medium">
              Gia sư
            </th>
            <th className="px-6 py-3.5 font-medium">
              Thời gian học
            </th>
            <th className="px-6 py-3.5 text-center font-medium">
              Trạng thái
            </th>
            <th className="px-6 py-3.5 text-right font-medium">
              Thao tác
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-100">
          {classes.map((item) => {
            const badge = STATUS_BADGES[item.status] || { label: item.status, color: 'bg-slate-100 text-slate-700' };

            return (
              <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                {/* Subject & ID */}
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded-md">
                        #{item.id}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">{item.subject}</span>
                    </div>
                    <span className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Ngày tạo: {formatDate(item.created_at)}
                    </span>
                    {item.admin_note && (
                      <div className="mt-2 text-xs bg-amber-50/80 border border-amber-200/60 rounded-lg p-2 text-amber-900 flex items-start gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-semibold text-amber-800">Admin note:</span> {item.admin_note}
                        </div>
                      </div>
                    )}
                  </div>
                </td>

                {/* Student Info */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      className="w-9 h-9 rounded-full object-cover border border-slate-200"
                      src={item.student_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.student_name)}&background=random`}
                      alt={item.student_name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.student_name)}&background=random`;
                      }}
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{item.student_name}</p>
                      <p className="text-xs text-slate-500">{item.student_phone || item.student_email}</p>
                    </div>
                  </div>
                </td>

                {/* Tutor Info */}
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <img
                      className="w-9 h-9 rounded-full object-cover border border-slate-200"
                      src={item.tutor_avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(item.tutor_name)}&background=random`}
                      alt={item.tutor_name}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(item.tutor_name)}&background=random`;
                      }}
                    />
                    <div>
                      <p className="text-sm font-medium text-slate-800">{item.tutor_name}</p>
                      <p className="text-xs text-slate-500">{item.tutor_qualification || item.tutor_email}</p>
                    </div>
                  </div>
                </td>

                {/* Schedule Time */}
                <td className="px-6 py-4">
                  <div className="text-xs text-slate-700 font-medium">
                    {item.schedule_time || 'Thỏa thuận với gia sư'}
                  </div>
                </td>

                {/* Status */}
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${badge.color}`}>
                    {item.status === 'disputed' && <AlertTriangle className="w-3 h-3 mr-1" />}
                    {badge.label}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-6 py-4 text-right">
                  <button
                    type="button"
                    onClick={() => onSelectClass(item)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors border border-primary-200"
                    title="Xử lý / Cập nhật trạng thái"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Xử lý</span>
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ClassTable;
