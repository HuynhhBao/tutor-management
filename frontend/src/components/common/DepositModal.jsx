import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Wallet, X, ArrowRight, ShieldCheck, CreditCard, Smartphone, CheckCircle, ArrowLeft, QrCode, Copy } from 'lucide-react';

const banks = [
  { id: 'MB', name: 'MBBank - Ngân hàng Quân Đội', number: '9999', holder: 'EDUMATCH PLATFORM' }
];

const DepositModal = ({ isOpen, onClose, onDeposit, loading }) => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Bank');
  const [step, setStep] = useState(1); // 1: Nhập tiền, 2: Chuyển khoản
  const [selectedBank, setSelectedBank] = useState('MB');
  const [viewMode, setViewMode] = useState('qr'); // 'qr' hoặc 'manual'
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const presetAmounts = [50000, 100000, 200000, 500000];

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanAmount = Number.parseFloat(amount.toString().replace(/\D/g, ''));
    if (!cleanAmount || cleanAmount <= 0) {
      setError('Vui lòng nhập số tiền hợp lệ');
      return;
    }
    setError('');

    if (paymentMethod === 'Bank') {
      setStep(2); // Chuyển sang bước thanh toán ngân hàng
    } else {
      onDeposit(cleanAmount, paymentMethod);
    }
  };

  const handleConfirmQR = () => {
    const cleanAmount = Number.parseFloat(amount.toString().replace(/\D/g, ''));
    onDeposit(cleanAmount, paymentMethod);
    setStep(1);
  };

  const formatCurrencyInput = (val) => {
    const num = val.toString().replace(/\D/g, '');
    if (!num) return '';
    return Number.parseInt(num, 10).toLocaleString('vi-VN');
  };

  const cleanAmount = Number.parseFloat(amount.toString().replace(/\D/g, '')) || 0;
  const currentBank = banks.find((b) => b.id === selectedBank);
  const qrUrl = `https://img.vietqr.io/image/${currentBank.id}-${currentBank.number}-compact.jpg?amount=${cleanAmount}&addInfo=EDUMATCH%20NAP%20${cleanAmount}&accountName=EDUMATCH%20PLATFORM`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <button 
          onClick={() => { setStep(1); onClose(); }}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {step === 1 ? (
          <>
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
                <span className="block text-sm font-bold text-slate-700 mb-3">Mệnh giá gợi ý</span>
                <div className="grid grid-cols-2 gap-3">
                  {presetAmounts.map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => {
                        setAmount(preset.toLocaleString('vi-VN'));
                        setError('');
                      }}
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
                <label htmlFor="deposit-amount-input" className="text-sm font-bold text-slate-700 block mb-2">Số tiền muốn nạp (đ)</label>
                <div className="relative">
                  <input
                    id="deposit-amount-input"
                    type="text"
                    value={amount}
                    onChange={(e) => {
                      setAmount(formatCurrencyInput(e.target.value));
                      setError('');
                    }}
                    placeholder="Ví dụ: 150.000"
                    className={`w-full px-4 py-3 border rounded-xl font-bold text-slate-900 focus:outline-none focus:ring-2 focus:border-transparent text-lg transition-all ${
                      error ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-500'
                    }`}
                  />
                  <span className="absolute right-4 top-3.5 text-slate-400 font-bold">VNĐ</span>
                </div>
                {error && <p className="text-xs text-rose-500 font-bold mt-1.5">{error}</p>}
              </div>

              {/* Phương thức thanh toán */}
              <div>
                <span className="block text-sm font-bold text-slate-700 mb-3">Phương thức thanh toán</span>
                <div className="space-y-3">
                  {[
                    { id: 'Bank', label: 'Chuyển khoản Ngân hàng', icon: CreditCard },
                    { id: 'VNPay', label: 'Cổng thanh toán VNPay', icon: Smartphone },
                    { id: 'MoMo', label: 'Ví điện tử MoMo', icon: Smartphone },
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
                {loading ? 'Đang xử lý giao dịch...' : `Tiếp tục nạp ${amount || '0'} đ`}
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          </>
        ) : (
          /* BƯỚC 2: CHUYỂN KHOẢN NGÂN HÀNG (QR / THỦ CÔNG) */
          <div className="space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <button onClick={() => setStep(1)} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Thanh toán chuyển khoản</h3>
                <p className="text-xs text-slate-500">Chọn ngân hàng của hệ thống để chuyển</p>
              </div>
            </div>

            {/* Dropdown chọn ngân hàng */}
            <div>
              <label htmlFor="bank-select" className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Ngân hàng thụ hưởng</label>
              <select
                id="bank-select"
                value={selectedBank}
                onChange={(e) => setSelectedBank(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-2xl font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 cursor-pointer"
              >
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Tab view mode */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => setViewMode('qr')}
                className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  viewMode === 'qr' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <QrCode className="w-4 h-4" />
                Quét mã QR
              </button>
              <button
                type="button"
                onClick={() => setViewMode('manual')}
                className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  viewMode === 'manual' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                Tự nhập thông tin
              </button>
            </div>

            {/* Chế độ hiển thị mã QR */}
            {viewMode === 'qr' ? (
              <div className="flex flex-col items-center p-4 bg-gradient-to-br from-blue-500/5 to-blue-600/10 rounded-3xl border border-blue-500/20">
                <div className="bg-white p-3 rounded-2xl shadow-md mb-3">
                  <img src={qrUrl} alt="VietQR" className="w-44 h-44 object-contain" />
                </div>
                <p className="text-sm font-bold text-slate-800">{currentBank.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">Chủ tài khoản: {currentBank.holder}</p>
              </div>
            ) : (
              /* Chế độ tự nhập thông tin thủ công */
              <div className="bg-slate-50 rounded-2xl p-4 space-y-3 text-sm border border-slate-200/60">
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500">Ngân hàng:</span>
                  <span className="font-bold text-slate-800">{currentBank.id}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500">Số tài khoản:</span>
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    {currentBank.number}
                    <Copy
                      onClick={() => navigator.clipboard.writeText(currentBank.number)}
                      className="w-4 h-4 text-blue-600 cursor-pointer hover:scale-110 active:scale-95"
                    />
                  </span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500">Chủ tài khoản:</span>
                  <span className="font-bold text-slate-800">{currentBank.holder}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-slate-200/60">
                  <span className="text-slate-500">Số tiền nạp:</span>
                  <span className="font-bold text-blue-600">{cleanAmount.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Nội dung chuyển:</span>
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    EDUMATCH NAP {cleanAmount}
                    <Copy
                      onClick={() => navigator.clipboard.writeText(`EDUMATCH NAP ${cleanAmount}`)}
                      className="w-4 h-4 text-blue-600 cursor-pointer hover:scale-110 active:scale-95"
                    />
                  </span>
                </div>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <button
                type="button"
                onClick={handleConfirmQR}
                disabled={loading}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                {loading ? 'Đang xác nhận...' : 'Tôi đã chuyển khoản xong'}
                <CheckCircle className="w-5 h-5" />
              </button>

              <p className="text-xs text-slate-400 text-center">
                Hệ thống sẽ tự động đối soát và cộng tiền vào ví trong vài giây.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

DepositModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onDeposit: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default DepositModal;
