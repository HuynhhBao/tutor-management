import React, { useState, useEffect } from 'react';
import { History, AlertCircle, Calendar, Clock, User, XCircle, AlertTriangle } from 'lucide-react';

const HiringHistoryPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/student/bookings', {
          credentials: 'include' // Bắt buộc để gửi kèm cookie/token
        });
        const data = await res.json();
        if (data.status === 'ok') {
          setBookings(data.data);
        }
      } catch (error) {
        console.error('Lỗi khi tải lịch sử:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const getStatusDisplay = (status) => {
    switch (status) {
      case 'pending': return <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-full text-xs font-bold">Chờ xác nhận</span>;
      case 'confirmed': return <span className="px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-full text-xs font-bold">Đã xác nhận</span>;
      case 'completed': return <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-xs font-bold">Đã hoàn thành</span>;
      case 'cancelled': return <span className="px-3 py-1 bg-red-50 text-red-600 border border-red-200 rounded-full text-xs font-bold">Đã hủy</span>;
      case 'dispute': return <span className="px-3 py-1 bg-purple-50 text-purple-600 border border-purple-200 rounded-full text-xs font-bold">Đang khiếu nại</span>;
      default: return <span className="px-3 py-1 bg-slate-50 text-slate-600 border border-slate-200 rounded-full text-xs font-bold">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Lịch sử thuê Gia sư</h1>
      
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2 font-bold text-slate-900">
          <History className="w-5 h-5 text-blue-600" />
          Danh sách lịch sử
        </div>
        
        {loading ? (
          <div className="p-12 text-center text-slate-500 font-medium animate-pulse">
            Đang tải dữ liệu...
          </div>
        ) : bookings.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-center text-slate-400">
            <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
            <p>Bạn chưa có lịch sử thuê gia sư nào.</p>
            <p className="text-sm mt-1">Bắt đầu tìm kiếm gia sư để bắt đầu học nhé!</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {bookings.map((booking) => (
              <div key={booking.id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Thông tin Gia sư & Môn học */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 text-blue-600 font-bold rounded-2xl flex items-center justify-center text-lg flex-shrink-0">
                    {booking.tutor_name?.charAt(0) || 'T'}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg">{booking.tutor_name}</h3>
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500 mt-1">
                      <span className="flex items-center gap-1"><User className="w-4 h-4"/> {booking.subjects || 'Đa môn'}</span>
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4"/> {new Date(booking.created_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                  </div>
                </div>

                {/* Trạng thái & Nút hành động */}
                <div className="flex flex-col sm:flex-row items-center gap-3 md:items-end">
                  <div className="mb-1">{getStatusDisplay(booking.status)}</div>
                  
                  {/* Nếu đang chờ xác nhận thì hiển thị nút Hủy */}
                  {booking.status === 'pending' && (
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-lg border border-red-100 transition-colors">
                      <XCircle className="w-3.5 h-3.5" /> Hủy lịch
                    </button>
                  )}

                  {/* Nếu đã hoàn thành thì hiển thị nút Khiếu nại */}
                  {booking.status === 'completed' && (
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-lg transition-colors">
                      <AlertTriangle className="w-3.5 h-3.5" /> Khiếu nại
                    </button>
                  )}
                </div>
                
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HiringHistoryPage;
