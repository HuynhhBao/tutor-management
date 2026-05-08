import React from 'react';
import { History, Calendar, User, Star, Clock, AlertCircle } from 'lucide-react';

const HiringHistoryPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Lịch sử thuê Gia sư</h1>
      
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <History className="w-5 h-5 text-blue-600" />
            Danh sách lịch sử
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-1.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-200 transition-colors">
              Tất cả
            </button>
            <button className="px-4 py-1.5 text-slate-500 text-sm font-medium rounded-lg hover:bg-slate-100 transition-colors">
              Đang học
            </button>
            <button className="px-4 py-1.5 text-slate-500 text-sm font-medium rounded-lg hover:bg-slate-100 transition-colors">
              Đã kết thúc
            </button>
          </div>
        </div>

        <div className="p-12 flex flex-col items-center justify-center text-center text-slate-400">
          <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
          <p>Bạn chưa có lịch sử thuê gia sư nào.</p>
          <p className="text-sm">Bắt đầu tìm kiếm gia sư để bắt đầu học nhé!</p>
        </div>
      </div>
    </div>
  );
};

export default HiringHistoryPage;
