import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, BookOpen, Star, CheckCircle, Clock } from 'lucide-react';

export default function TutorDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Xin chào, {user?.fullName || user?.username}! 👋
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Chào mừng bạn quay lại với bảng điều khiển dành cho Gia sư.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Status Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Trạng thái hiện tại</p>
              <div className="flex items-center gap-2 mt-2">
                <div className="h-3 w-3 rounded-full bg-green-500"></div>
                <p className="text-xl font-bold text-slate-900">Sẵn sàng nhận lớp</p>
              </div>
            </div>
            <div className="p-3 bg-green-50 rounded-xl">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Classes Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Lớp đang dạy</p>
              <p className="text-2xl font-bold text-slate-900 mt-1">0</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Rating Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Đánh giá trung bình</p>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-2xl font-bold text-slate-900">4.9</p>
                <span className="text-sm text-slate-500">/ 5.0</span>
              </div>
            </div>
            <div className="p-3 bg-yellow-50 rounded-xl">
              <Star className="h-6 w-6 text-yellow-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity or Notifications Placeholder */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="text-lg font-semibold text-slate-900">Lớp học sắp tới</h3>
        </div>
        <div className="p-12 text-center">
          <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Clock className="h-8 w-8 text-slate-400" />
          </div>
          <h4 className="text-base font-medium text-slate-900">Chưa có lịch học nào</h4>
          <p className="mt-1 text-sm text-slate-500">
            Hiện tại bạn chưa nhận lớp nào. Hãy tìm kiếm lớp mới phù hợp với chuyên môn của bạn nhé!
          </p>
          <button className="mt-6 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-sm">
            Tìm lớp mới ngay
          </button>
        </div>
      </div>
    </div>
  );
}
