import React, { useState, useEffect } from 'react';
import { api } from '../../services/apiClient';
import { formatDate } from '../../utils/formatters';
import { FiX, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi';

const StudentBookingHistoryModal = ({ studentId, isOpen, onClose }) => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && studentId) {
      fetchBookings();
    }
  }, [isOpen, studentId]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/students/${studentId}/bookings`);
      if (res.data.success) {
        setBookings(res.data.data.bookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <span className="flex items-center text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full text-xs font-medium"><FiClock className="mr-1"/> Chờ xác nhận</span>;
      case 'confirmed':
        return <span className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-medium"><FiCheckCircle className="mr-1"/> Đã xác nhận</span>;
      case 'completed':
        return <span className="flex items-center text-blue-600 bg-blue-50 px-2 py-1 rounded-full text-xs font-medium"><FiCheckCircle className="mr-1"/> Hoàn thành</span>;
      case 'cancelled':
        return <span className="flex items-center text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-medium"><FiXCircle className="mr-1"/> Đã hủy</span>;
      default:
        return <span className="text-slate-500 bg-slate-100 px-2 py-1 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={onClose}>
          <div className="absolute inset-0 bg-slate-900 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-100">
              <h3 className="text-lg leading-6 font-medium text-slate-900">
                Lịch sử thuê gia sư (Học viên #{studentId})
              </h3>
              <button 
                onClick={onClose}
                className="text-slate-400 hover:text-slate-500 transition-colors bg-slate-100 hover:bg-slate-200 rounded-full p-2"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center items-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                Học viên này chưa có lượt đặt lịch nào.
              </div>
            ) : (
              <div className="overflow-auto max-h-[60vh]">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Môn học</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Gia sư</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Lịch học</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Trạng thái</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Ngày tạo</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {bookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-slate-900">
                          {booking.subject || 'Không có'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            <img 
                              className="h-8 w-8 rounded-full object-cover mr-2 border border-slate-200" 
                              src={booking.tutor_avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(booking.tutor_name) + '&background=random'} 
                              alt="" 
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(booking.tutor_name) + '&background=random';
                              }}
                            />
                            <span className="text-sm text-slate-700">{booking.tutor_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-500">
                          {booking.schedule_time || 'Thỏa thuận'}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {getStatusBadge(booking.status)}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                          {formatDate(booking.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          <div className="bg-slate-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse border-t border-slate-200">
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md border border-slate-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentBookingHistoryModal;
