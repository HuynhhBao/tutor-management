import React, { useState, useEffect } from 'react';
import { Wallet, Plus, ArrowUpRight, ArrowDownLeft, Clock, ShieldCheck, CheckCircle, XCircle } from 'lucide-react';
import DepositModal from '../../components/common/DepositModal';

const WalletPage = () => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [notification, setNotification] = useState({
    isOpen: false,
    type: 'success',
    title: '',
    message: ''
  });

  const fetchWallet = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/wallet', {
        credentials: 'include'
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setBalance(data.data.balance);
        setTransactions(data.data.transactions);
      }
    } catch (err) {
      console.error('Error fetching wallet:', err);
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    fetchWallet();
  }, []);

  const handleDeposit = async (amount, paymentMethod) => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/wallet/deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount, paymentMethod })
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setNotification({
          isOpen: true,
          type: 'success',
          title: 'Thành công',
          message: data.message || `Nạp thành công ${amount.toLocaleString('vi-VN')}đ vào tài khoản!`
        });
        setBalance(data.data.balance);
        setTransactions((prev) => [data.data.transaction, ...prev]);
        setIsModalOpen(false);
      } else {
        setNotification({
          isOpen: true,
          type: 'error',
          title: 'Thất bại',
          message: data.message || 'Có lỗi xảy ra khi nạp tiền'
        });
      }
    } catch (err) {
      console.error('Deposit error:', err);
      setNotification({
        isOpen: true,
        type: 'error',
        title: 'Lỗi kết nối',
        message: 'Lỗi kết nối server'
      });
    } finally {
      setLoading(false);
    }
  };

  const renderTransactions = () => {
    if (fetching) {
      return <div className="flex items-center justify-center p-12 text-slate-400">Đang tải lịch sử...</div>;
    }
    if (transactions.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center p-16 text-slate-400 text-center">
          <Wallet className="w-16 h-16 mb-4 opacity-10" />
          <p className="font-medium">Bạn chưa có giao dịch nào.</p>
          <p className="text-xs text-slate-400 mt-1">Các giao dịch nạp tiền hoặc thanh toán sẽ xuất hiện ở đây.</p>
        </div>
      );
    }
    return (
      <div className="divide-y divide-slate-100">
        {transactions.map((tx) => {
          const isDeposit = tx.type === 'deposit';
          return (
            <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                  isDeposit ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                }`}>
                  {isDeposit ? <ArrowDownLeft className="w-6 h-6" /> : <ArrowUpRight className="w-6 h-6" />}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-base">{tx.description || (isDeposit ? 'Nạp tiền vào ví' : 'Thanh toán dịch vụ')}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(tx.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>

              <div className={`font-bold text-lg text-right ${isDeposit ? 'text-emerald-600' : 'text-red-600'}`}>
                {isDeposit ? '+' : '-'}{Number.parseFloat(tx.amount).toLocaleString('vi-VN')} đ
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Ví tiền của tôi</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Balance Card */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-8 rounded-3xl text-white shadow-xl shadow-blue-100 relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-blue-100 text-sm font-medium mb-1">Số dư hiện tại</p>
              <h2 className="text-4xl font-bold mb-8">
                {fetching ? '...' : `${balance.toLocaleString('vi-VN')} đ`}
              </h2>
              <button 
                onClick={() => setIsModalOpen(true)}
                className="w-full py-4 bg-white text-blue-600 font-bold rounded-2xl hover:bg-blue-50 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
              >
                <Plus className="w-5 h-5" />
                Nạp tiền ngay
              </button>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-3 text-sm text-blue-700 shadow-sm">
            <ShieldCheck className="w-5 h-5 flex-shrink-0 text-blue-600" />
            <p>Mọi giao dịch đều được bảo mật và giám sát bởi hệ thống EduMatch.</p>
          </div>
        </div>

        {/* Transaction History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-slate-400" />
                Lịch sử giao dịch
              </h3>
              <span className="text-xs bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-full">
                {transactions.length} giao dịch
              </span>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[500px]">
              {renderTransactions()}
            </div>
          </div>
        </div>
      </div>

      <DepositModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onDeposit={handleDeposit}
        loading={loading}
      />

      {/* Notification Modal */}
      {notification.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-200">
            <div className="flex justify-center mb-5">
              {notification.type === 'success' ? (
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 animate-bounce">
                  <CheckCircle className="w-10 h-10" />
                </div>
              ) : (
                <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600">
                  <XCircle className="w-10 h-10" />
                </div>
              )}
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">{notification.title}</h3>
            <p className="text-slate-500 text-sm mb-6 whitespace-pre-line leading-relaxed">{notification.message}</p>
            <button
              onClick={() => setNotification({ ...notification, isOpen: false })}
              className={`w-full py-3.5 font-bold rounded-2xl transition-all active:scale-95 shadow-lg ${
                notification.type === 'success'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
                  : 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-200'
              }`}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletPage;
