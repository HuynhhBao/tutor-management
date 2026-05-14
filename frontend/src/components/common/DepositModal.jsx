import React, { useState } from 'react';
import { Wallet, X, ArrowRight, ShieldCheck, CreditCard, Smartphone } from 'lucide-react';

const DepositModal = ({ isOpen, onClose, onDeposit, loading }) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('VNPay');

  if (!isOpen) return null;

  const presetAmounts = [50000, 100000, 200000, 500000];

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanAmount = parseFloat(amount.toString().replace(/\D/g, ''));
    if (!cleanAmount || cleanAmount <= 0) {
      alert('Vui lòng nhập số tiền hợp lệ');
      return;
    }
    onDeposit(cleanAmount, paymentMethod);
  };

  const formatCurrencyInput = (val) => {
    const num = val.toString().replace(/\D/g, '');
    if (!num) return '';
    return parseInt(num).toLocaleString('vi-VN');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
            <Wallet className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Nạp tiền vào ví</h3>
            <p className="text-sm text-slate-500">Chọn mệnh giá hoặc tự nhập số tiền</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Mệnh giá gợi ý */}
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-3">Mệnh giá gợi ý</label>
            <div className="grid grid-cols-2 gap-3">
              {presetAmounts.map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setAmount(preset.toLocaleString('vi-VN'))}
                  className={`py-3 px-4 rounded-xl text-sm font-bold border transition-all ${
                    amount.toString().replace(/\D/g, '') == preset
                      ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {preset.toLocaleString('vi-VN')} đ
                </button>
              ))}
            </div>
          </div>

          {/* Số tiền tự nhập */}
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-2">Số tiền muốn nạp (đ)</label>
            <div className="relative">
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(formatCurrencyInput(e.target.value))}
                placeholder="Ví dụ: 150.000"
                className="w-full px-4 py-3 border border-slate-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg transition-all"
              />
              <span className="absolute right-4 top-3.5 text-slate-400 font-bold">VNĐ</span>
            </div>
          </div>

          {/* Phương thức thanh toán */}
          <div>
            <label className="text-sm font-bold text-slate-700 block mb-3">Phương thức thanh toán</label>
            <div className="space-y-3">
              {[
                { id: 'VNPay', label: 'Cổng thanh toán VNPay', icon: Smartphone },
                { id: 'MoMo', label: 'Ví điện tử MoMo', icon: Smartphone },
                { id: 'Bank', label: 'Chuyển khoản Ngân hàng', icon: CreditCard },
              ].map((method) => {
                const Icon = method.icon;
                return (
                  <label
                    key={method.id}
                    className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                      paymentMethod === method.id
                        ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${paymentMethod === method.id ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span>{method.label}</span>
                    </div>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={() => setPaymentMethod(method.id)}
                      className="text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                  </label>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl flex items-center gap-3 text-xs text-slate-500">
            <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <span>Giao dịch được mã hóa SSL 256-bit và hoàn thành ngay tức thì.</span>
          </div>

          <button
            type="submit"
            disabled={loading || !amount}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 transition-all"
          >
            {loading ? 'Đang xử lý giao dịch...' : `Xác nhận nạp ${amount || '0'} đ`}
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default DepositModal;
