import React, { useState, useEffect, useCallback } from 'react';
import { Users, UserSquare, PlayCircle, DollarSign, ArrowUpRight, Clock, Loader2 } from 'lucide-react';
import apiClient from '../../services/apiClient';
import { formatStatus } from '../../utils/statusFormatter';

export default function DashboardOverview() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    totalTutors: 0,
    totalStudents: 0,
    activeClasses: 0,
    monthlyRevenue: 0,
    recentClasses: []
  });

  const fetchOverview = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient('/admin/finance/system-overview');
      const json = await res.json();
      if (res.ok && json.status === 'ok' && json.data) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Lỗi khi tải thống kê trang tổng quan:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const stats = [
    { 
      title: 'Tổng số gia sư', 
      value: data.totalTutors.toLocaleString('vi-VN'), 
      icon: Users, 
      change: '100% thực tế', 
      color: 'text-blue-600', 
      bg: 'bg-blue-100',
      hint: 'Toàn bộ gia sư trong DB'
    },
    { 
      title: 'Học viên', 
      value: data.totalStudents.toLocaleString('vi-VN'), 
      icon: UserSquare, 
      change: '100% thực tế', 
      color: 'text-green-600', 
      bg: 'bg-green-100',
      hint: 'Tài khoản học sinh tham gia'
    },
    { 
      title: 'Lớp đang chạy', 
      value: data.activeClasses.toLocaleString('vi-VN'), 
      icon: PlayCircle, 
      change: 'Lịch học xác nhận', 
      color: 'text-blue-600', 
      bg: 'bg-blue-100',
      hint: 'Các ca dạy đang diễn ra'
    },
    { 
      title: 'Doanh thu 30 ngày', 
      value: `${data.monthlyRevenue.toLocaleString('vi-VN')} đ`, 
      icon: DollarSign, 
      change: 'Tự động tổng hợp', 
      color: 'text-orange-600', 
      bg: 'bg-orange-100',
      hint: 'Dòng tiền giao dịch & lớp xong'
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-3">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
        <p className="text-sm font-medium text-gray-500">Đang đồng bộ dữ liệu thống kê từ hệ thống...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Tổng quan</h2>
        <p className="text-sm text-gray-500 mt-1">Theo dõi các chỉ số quan trọng của hệ thống</p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={index} 
              className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start">
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.bg}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-green-600 flex items-center font-medium">
                  <ArrowUpRight className="w-4 h-4 mr-1 shrink-0" />
                  {stat.change}
                </span>
                <span className="text-gray-400 font-medium">{stat.hint}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Connected Classes Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-8">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Lớp học mới kết nối</h3>
            <p className="text-xs text-gray-500 mt-0.5">Danh sách 10 giao dịch đặt lịch và ghép lớp mới nhất trên toàn nền tảng</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-100 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">Mã lớp</th>
                <th className="px-6 py-3 font-medium">Gia sư</th>
                <th className="px-6 py-3 font-medium">Môn học</th>
                <th className="px-6 py-3 font-medium">Học viên</th>
                <th className="px-6 py-3 font-medium">Thời gian tạo / Lịch</th>
                <th className="px-6 py-3 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.recentClasses.length > 0 ? (
                data.recentClasses.map((item) => {
                  const statusBadge = formatStatus(item.status);
                  return (
                    <tr key={item.id} className="hover:bg-slate-100 transition-colors">
                      <td className="px-6 py-4 font-medium text-blue-600">{item.id}</td>
                      <td className="px-6 py-4 font-medium text-gray-700">{item.tutor}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          {item.subject}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{item.student}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center text-gray-500 text-xs">
                          <Clock className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                          {item.time}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={statusBadge.className}>
                          {statusBadge.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500 bg-white">
                    Chưa có lớp học mới kết nối.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
