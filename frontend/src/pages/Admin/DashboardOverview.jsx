import React from 'react';
import { Users, UserSquare, PlayCircle, DollarSign, ArrowUpRight, Clock } from 'lucide-react';

const stats = [
  { title: 'Tổng số gia sư', value: '0', icon: Users, change: '--', color: 'text-blue-600', bg: 'bg-blue-100' },
  { title: 'Học viên', value: '0', icon: UserSquare, change: '--', color: 'text-green-600', bg: 'bg-green-100' },
  { title: 'Lớp đang chạy', value: '0', icon: PlayCircle, change: '--', color: 'text-purple-600', bg: 'bg-purple-100' },
  { title: 'Doanh thu tháng', value: '0', icon: DollarSign, change: '--', color: 'text-orange-600', bg: 'bg-orange-100' },
];

const recentClasses = [];

export default function DashboardOverview() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Tổng quan</h2>
        <p className="text-sm text-gray-500 mt-1">Theo dõi các chỉ số quan trọng của hệ thống</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.bg}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-500 flex items-center font-medium">
                  <ArrowUpRight className="w-4 h-4 mr-1" />
                  {stat.change}
                </span>
                <span className="text-gray-400 ml-2">so với tháng trước</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mt-8">
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold text-gray-900">Lớp học mới kết nối</h3>
          <button className="text-sm text-primary-600 font-medium hover:text-primary-700">Xem tất cả</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">Mã lớp</th>
                <th className="px-6 py-3 font-medium">Gia sư</th>
                <th className="px-6 py-3 font-medium">Môn học</th>
                <th className="px-6 py-3 font-medium">Học viên</th>
                <th className="px-6 py-3 font-medium">Thời gian</th>
                <th className="px-6 py-3 font-medium">Trạng thái</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentClasses.length > 0 ? (
                recentClasses.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-gray-900">{item.id}</td>
                    <td className="px-6 py-4 text-gray-700">{item.tutor}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                        {item.subject}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{item.student}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-gray-500 text-xs">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {item.time}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500 bg-white">
                    Chưa có dữ liệu lớp học mới kết nối.
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
