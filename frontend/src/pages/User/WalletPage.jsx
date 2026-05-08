import React from 'react';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, Clock, ShieldCheck } from 'lucide-react';

const WalletPage = () => {
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Ví tiền của tôi</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Balance Card */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-purple-600 to-indigo-700 p-8 rounded-3xl text-white shadow-xl shadow-purple-100 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-purple-100 text-sm font-medium mb-1">Số dư hiện tại</p>
              <h2 className="text-4xl font-bold mb-8">0đ</h2>
              <button className="w-full py-3 bg-white text-purple-600 font-bold rounded-xl hover:bg-purple-50 transition-colors flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" />
                Nạp tiền ngay
              </button>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-3 text-sm text-blue-700">
            <ShieldCheck className="w-5 h-5 flex-shrink-0" />
            <p>Mọi giao dịch đều được bảo mật và giám sát bởi hệ thống EduMatch.</p>
          </div>
        </div>

        {/* Transaction History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-400" />
                Lịch sử giao dịch
              </h3>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-slate-400">
              <Wallet className="w-16 h-16 mb-4 opacity-10" />
              <p>Bạn chưa có giao dịch nào.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletPage;
