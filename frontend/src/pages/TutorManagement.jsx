import React, { useState } from 'react';
import { Search, Filter, MoreVertical, Edit2, Trash2, Star, CheckCircle, XCircle } from 'lucide-react';

const mockTutors = [];

export default function TutorManagement() {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Quản lý Gia sư</h2>
          <p className="text-sm text-gray-500 mt-1">Danh sách tất cả gia sư đang hợp tác</p>
        </div>
        <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
          + Thêm gia sư mới
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-center bg-gray-50/50">
          <div className="relative w-full sm:w-80">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="w-4 h-4 text-gray-400" />
            </span>
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
              placeholder="Tìm kiếm theo tên, môn học..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto justify-center">
            <Filter className="w-4 h-4 mr-2" />
            Lọc kết quả
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 font-semibold">Tên gia sư</th>
                <th className="px-6 py-4 font-semibold">Môn dạy</th>
                <th className="px-6 py-4 font-semibold">Đánh giá</th>
                <th className="px-6 py-4 font-semibold">Trạng thái</th>
                <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {mockTutors.length > 0 ? (
                mockTutors.map((tutor) => (
                  <tr key={tutor.id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <img src={tutor.avatar} alt={tutor.name} className="w-10 h-10 rounded-full bg-gray-100 object-cover border border-gray-200" />
                        <div className="ml-3">
                          <p className="font-medium text-gray-900">{tutor.name}</p>
                          <p className="text-xs text-gray-500">ID: TS-{tutor.id.toString().padStart(4, '0')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {tutor.subject.split(', ').map(sub => (
                          <span key={sub} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                            {sub}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-amber-500 font-medium">
                        <Star className="w-4 h-4 mr-1 fill-current" />
                        {tutor.rating}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {tutor.status === 'Đang dạy' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          {tutor.status}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                          <XCircle className="w-3.5 h-3.5 mr-1" />
                          {tutor.status}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Chỉnh sửa">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Xóa">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors" title="Thêm">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-gray-500 bg-white">
                    Chưa có dữ liệu gia sư.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500 bg-gray-50/50">
          <p>Hiển thị 1 đến 5 của 124 kết quả</p>
          <div className="flex space-x-1">
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50" disabled>Trước</button>
            <button className="px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700">1</button>
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">2</button>
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">3</button>
            <span className="px-2 py-1">...</span>
            <button className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50">Sau</button>
          </div>
        </div>
      </div>
    </div>
  );
}
