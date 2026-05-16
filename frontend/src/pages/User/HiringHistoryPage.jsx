import React from 'react';
import { History, AlertCircle } from 'lucide-react';

const HiringHistoryPage = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Lịch sử thuê Gia sư</h1>
      
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2 font-bold text-slate-900">
          <History className="w-5 h-5 text-blue-600" />
          Danh sách lịch sử
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
