import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { BookOpen, Star, CheckCircle, Clock, Moon } from 'lucide-react';
import { API_BASE_URL } from '../../utils/constants';

export default function TutorDashboard() {
  const { user } = useAuth();
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  
  // Initialize state from user profile status
  const [isReady, setIsReady] = useState(user?.status === 'Sẵn sàng nhận lớp');

  // Keep state in sync if user profile changes
  useEffect(() => {
    if (user?.status) {
      setIsReady(user.status === 'Sẵn sàng nhận lớp');
    }
  }, [user?.status]);

  const confirmToggle = async () => {
    const nextReadyState = !isReady;
    const nextStatusText = nextReadyState ? 'Sẵn sàng nhận lớp' : 'Tạm nghỉ';
    
    try {
      const response = await fetch(`${API_BASE_URL}/tutors/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tutorId: user.id, status: nextStatusText })
      });
      
      if (response.ok) {
        setIsReady(nextReadyState);
      } else {
        alert('Có lỗi xảy ra khi cập nhật trạng thái');
      }
    } catch (err) {
      console.error('Error toggling status:', err);
      alert('Không thể kết nối đến server');
    } finally {
      setShowConfirmModal(false);
    }
  };

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
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl transition-colors duration-300 ${isReady ? 'bg-green-50' : 'bg-slate-100'}`}>
                {isReady ? (
                  <CheckCircle className="h-6 w-6 text-green-600 animate-in zoom-in duration-300" />
                ) : (
                  <Moon className="h-6 w-6 text-slate-400 animate-in zoom-in duration-300" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">Trạng thái hiện tại</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className={`h-2 w-2 rounded-full ${isReady ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`}></div>
                  <p className={`text-lg font-bold transition-colors duration-300 ${isReady ? 'text-slate-900' : 'text-slate-400'}`}>
                    {isReady ? 'Sẵn sàng nhận lớp' : 'Tạm nghỉ'}
                  </p>
                </div>
              </div>
            </div>

            {/* Premium Toggle Switch */}
            <label className="relative inline-flex items-center cursor-pointer group">
              <span className="sr-only">Bật tắt trạng thái sẵn sàng</span>
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={isReady}
                onChange={() => setShowConfirmModal(true)}
              />
              <div className="w-11 h-6 bg-slate-200 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
            </label>
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

      {/* Status Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isReady ? 'bg-amber-50' : 'bg-green-50'}`}>
              {isReady ? (
                <Moon className="w-10 h-10 text-amber-600 animate-pulse" />
              ) : (
                <CheckCircle className="w-10 h-10 text-green-600 animate-bounce" />
              )}
            </div>
            <h3 className="text-2xl font-bold text-slate-900 text-center mb-2">
              Xác nhận thay đổi
            </h3>
            <p className="text-slate-500 text-center mb-8 leading-relaxed">
              Bạn có chắc chắn muốn chuyển trạng thái sang <strong>{isReady ? 'Tạm nghỉ' : 'Sẵn sàng nhận lớp'}</strong> không?
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={confirmToggle}
                className={`w-full py-4 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95 ${
                  isReady ? 'bg-amber-600 shadow-amber-200 hover:bg-amber-700' : 'bg-green-600 shadow-green-200 hover:bg-green-700'
                }`}
              >
                Xác nhận thay đổi
              </button>
              <button 
                onClick={() => setShowConfirmModal(false)}
                className="w-full py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
              >
                Hủy bỏ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
