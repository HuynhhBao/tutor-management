import React, { useState, useEffect, useCallback } from 'react';
import { useAlert } from '../../context/AlertContext';
import { 
  History, Clock, CheckCircle2, XCircle, AlertCircle, Loader2, Send
} from 'lucide-react';
import { API_BASE_URL } from '../../utils/constants';

const BANK_LIST = [
  { name: 'Vietcombank', code: 'VCB' },
  { name: 'MBBank (Quán Bồi)', code: 'MB' },
  { name: 'Techcombank', code: 'TCB' },
  { name: 'VPBank', code: 'VPB' },
  { name: 'ACB (Á Châu)', code: 'ACB' },
  { name: 'TPBank', code: 'TPB' },
  { name: 'BIDV', code: 'BIDV' },
  { name: 'VietinBank', code: 'VIETIN' },
  { name: 'Sacombank', code: 'STB' },
  { name: 'HDBank', code: 'HDB' },
  { name: 'Agribank', code: 'VBA' },
  { name: 'OCB', code: 'OCB' }
];

export default function TutorFinancePage() {
  const { showAlert } = useAlert();
  const [loading, setLoading] = useState(true);
  const [financeData, setFinanceData] = useState({
    balance: 0,
    bankInfo: { bankName: '', bankAccountNumber: '', bankAccountHolder: '' },
    stats: { totalEarned: 0, totalWithdrawn: 0 },
    transactions: [],
    payoutRequests: []
  });

  // Tab: 'earnings' | 'payouts'
  const [activeTab, setActiveTab] = useState('earnings');

  // Form Bank
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [savingBank, setSavingBank] = useState(false);

  // Modal Payout
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('200000');
  const [submittingPayout, setSubmittingPayout] = useState(false);

  const fetchFinance = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/tutor/finance`, { credentials: 'include' });
      const json = await res.json();
      if (json.status === 'ok') {
        setFinanceData(json.data);
        setBankName(json.data.bankInfo.bankName || '');
        setAccountNumber(json.data.bankInfo.bankAccountNumber || '');
        setAccountHolder(json.data.bankInfo.bankAccountHolder || '');
      }
    } catch (err) {
      console.error('Error fetching tutor finance:', err);
      showAlert('Không thể tải dữ liệu ví thu nhập');
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  useEffect(() => {
    fetchFinance();
  }, [fetchFinance]);

  const handleSaveBank = async (e) => {
    e.preventDefault();
    if (!bankName || !accountNumber || !accountHolder) {
      return showAlert('Vui lòng điền đầy đủ thông tin tài khoản ngân hàng');
    }
    setSavingBank(true);
    try {
      const res = await fetch(`${API_BASE_URL}/tutor/finance/bank`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          bankName,
          bankAccountNumber: accountNumber,
          bankAccountHolder: accountHolder
        })
      });
      const json = await res.json();
      if (json.status === 'ok') {
        showAlert('🎉 Đã cập nhật tài khoản ngân hàng nhận tiền thành công!');
        fetchFinance();
      } else {
        showAlert(json.message || 'Cập nhật thất bại');
      }
    } catch {
      showAlert('Lỗi kết nối tới máy chủ');
    } finally {
      setSavingBank(false);
    }
  };

  const handleRequestPayout = async () => {
    const amt = Number.parseFloat(payoutAmount);
    if (Number.isNaN(amt) || amt < 200000) {
      return showAlert('Số tiền rút tối thiểu là 200.000 VNĐ');
    }
    if (amt > financeData.balance) {
      return showAlert('Số dư khả dụng của bạn không đủ');
    }
    setSubmittingPayout(true);
    try {
      const res = await fetch(`${API_BASE_URL}/tutor/finance/payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ amount: amt })
      });
      const json = await res.json();
      if (json.status === 'ok') {
        showAlert('🎉 Đã gửi yêu cầu rút tiền thành công! Admin sẽ duyệt và giải ngân cho bạn ngay.');
        setShowPayoutModal(false);
        fetchFinance();
      } else {
        showAlert(json.message || 'Gửi yêu cầu thất bại');
      }
    } catch {
      showAlert('Lỗi kết nối tới máy chủ');
    } finally {
      setSubmittingPayout(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
      </div>
    );
  }

  const renderTabContent = () => {
    if (activeTab === 'earnings') {
      if (financeData.transactions.length === 0) {
        return (
          <div className="text-center py-16 text-slate-400">
            <History className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-semibold">Chưa có giao dịch thu nhập nào</p>
            <p className="text-xs text-slate-400 mt-1">Khi bạn dạy xong 1 ca học và bấm "Hoàn thành", tiền thu nhập sẽ hiển thị tại đây.</p>
          </div>
        );
      }
      return (
        <div className="space-y-3.5">
          {financeData.transactions.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-slate-100/70 transition-colors border border-slate-100"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${
                  tx.type === 'tutor_earning' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {tx.type === 'tutor_earning' ? <DollarSign className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-sm">{tx.description || 'Thu nhập ca học'}</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(tx.created_at).toLocaleString('vi-VN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
              </div>
              <div className={`text-base font-extrabold ${
                tx.type === 'tutor_earning' ? 'text-emerald-600' : 'text-rose-600'
              }`}>
                {tx.type === 'tutor_earning' ? '+' : '-'}{Number.parseFloat(tx.amount).toLocaleString('vi-VN')} đ
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (financeData.payoutRequests.length === 0) {
      return (
        <div className="text-center py-16 text-slate-400">
          <Clock className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <p className="font-semibold">Chưa tạo yêu cầu rút tiền nào</p>
          <p className="text-xs text-slate-400 mt-1">Bấm nút "Yêu cầu Rút Tiền" phía trên để chuyển khoản về ngân hàng VNĐ.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {financeData.payoutRequests.map((pr) => {
          const snap = typeof pr.bank_snapshot === 'string' ? JSON.parse(pr.bank_snapshot || '{}') : pr.bank_snapshot || {};
          return (
            <div
              key={pr.id}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-base font-black text-slate-900">
                    {Number.parseFloat(pr.amount).toLocaleString('vi-VN')} VNĐ
                  </span>
                  {pr.status === 'pending' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200">
                      <Clock className="w-3.5 h-3.5 animate-spin" /> Đang chờ Admin duyệt
                    </span>
                  )}
                  {pr.status === 'approved' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Đã chuyển khoản thành công
                    </span>
                  )}
                  {pr.status === 'rejected' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                      <XCircle className="w-3.5 h-3.5" /> Bị từ chối
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  Ngân hàng: <strong className="text-slate-700">{snap.bankName}</strong> - STK: <strong className="text-slate-700">{snap.bankAccountNumber}</strong> ({snap.bankAccountHolder})
                </p>
                {pr.admin_note && (
                  <p className="text-xs font-medium text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200/80">
                    💬 <strong>Ghi chú từ Admin:</strong> {pr.admin_note}
                  </p>
                )}
              </div>
              <div className="text-right text-xs text-slate-400 font-medium shrink-0">
                Tạo lúc: {new Date(pr.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="h-7 w-7 text-emerald-600" />
            Quản lý tài chính & rút tiền
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Theo dõi thu nhập và chủ động yêu cầu rút thù lao về tài khoản Ngân hàng VNĐ
          </p>
        </div>
        <div>
          <button type="button"
            onClick={() => {
              if (!financeData.bankInfo.bankName || !financeData.bankInfo.bankAccountNumber) {
                return showAlert('⚠️ Vui lòng cập nhật Tài khoản Ngân hàng bên dưới trước khi tạo yêu cầu rút tiền!');
              }
              if (financeData.balance < 200000) {
                return showAlert('⚠️ Số dư ví cần đạt tối thiểu 200.000 VNĐ để tạo lệnh rút!');
              }
              setShowPayoutModal(true);
            }}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-xl shadow-xs transition-colors"
          >
            <ArrowUpRight className="w-4 h-4" />
            Yêu cầu rút tiền
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Available Balance */}
        <div className="bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 text-white p-7 rounded-3xl shadow-lg relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 group-hover:scale-110 transition-transform duration-500 pointer-events-none" />
          <div className="flex items-center justify-between mb-6">
            <div className="p-3 bg-white/20 backdrop-blur-md rounded-2xl">
              <Wallet className="w-7 h-7 text-white" />
            </div>
            <span className="px-3 py-1 bg-emerald-400/30 backdrop-blur-md border border-white/20 rounded-full text-xs font-bold uppercase tracking-wide text-white">
              Khả Dụng Rút
            </span>
          </div>
          <p className="text-emerald-100 text-sm font-medium">Số dư ví hiện tại</p>
          <h2 className="text-4xl font-extrabold mt-1 tracking-tight">
            {financeData.balance.toLocaleString('vi-VN')} <span className="text-2xl font-bold text-emerald-200">đ</span>
          </h2>
          <p className="mt-4 text-xs text-emerald-100/90 flex items-center gap-1">
            * Cập nhật tức thì ngay sau khi hoàn thành buổi học
          </p>
        </div>

        {/* Card 2: Total Earned */}
        <div className="bg-white p-7 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
                <DollarSign className="w-7 h-7 text-blue-600" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng Doanh Thu</span>
            </div>
            <p className="text-slate-500 text-sm font-medium">Tổng thu nhập đã kiếm được</p>
            <h2 className="text-3xl font-bold text-slate-900 mt-1">
              {financeData.stats.totalEarned.toLocaleString('vi-VN')} <span className="text-xl font-semibold text-slate-600">đ</span>
            </h2>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Thu nhập ròng sau chiết khấu</span>
            <span className="font-semibold text-emerald-600">100% minh bạch</span>
          </div>
        </div>

        {/* Card 3: Total Withdrawn */}
        <div className="bg-white p-7 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100">
                <CheckCircle2 className="w-7 h-7 text-amber-600" />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đã Chi Trả</span>
            </div>
            <p className="text-slate-500 text-sm font-medium">Tổng số tiền đã rút thành công</p>
            <h2 className="text-3xl font-bold text-slate-900 mt-1">
              {financeData.stats.totalWithdrawn.toLocaleString('vi-VN')} <span className="text-xl font-semibold text-slate-600">đ</span>
            </h2>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Chuyển thẳng qua Ngân hàng VNĐ</span>
            <span className="font-semibold text-blue-600">Đã giải ngân</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Bank Configuration & Activity History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Bank Account Setup Form */}
        <div className="lg:col-span-1 bg-white p-7 rounded-3xl shadow-sm border border-slate-200 h-fit">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Tài Khoản Nhận Tiền</h3>
              <p className="text-xs text-slate-500">Ngân hàng hưởng lương & hoa hồng</p>
            </div>
          </div>

          <form onSubmit={handleSaveBank} className="space-y-4">
            <div>
              <label htmlFor="bankName" className="block text-xs font-bold uppercase text-slate-600 mb-2">Tên Ngân hàng / Ngân hàng VNĐ</label>
              <select
                id="bankName"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-none"
              >
                <option value="">-- Chọn ngân hàng --</option>
                {BANK_LIST.map((b) => (
                  <option key={b.name} value={b.name}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="accountNumber" className="block text-xs font-bold uppercase text-slate-600 mb-2">Số tài khoản Ngân Hàng</label>
              <div className="relative">
                <CreditCard className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  id="accountNumber"
                  type="text"
                  placeholder="VD: 0987654321"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="accountHolder" className="block text-xs font-bold uppercase text-slate-600 mb-2">Tên chủ tài khoản (Viết Hoa)</label>
              <div className="relative">
                <UserCheck className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  id="accountHolder"
                  type="text"
                  placeholder="VD: NGUYEN VAN A"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all outline-none uppercase"
                />
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-start gap-2.5 mt-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>Vui lòng kiểm tra chính xác thông tin tài khoản để đảm bảo Quản trị viên chi trả đúng vào số tài khoản của bạn!</span>
            </div>

            <button
              type="submit"
              disabled={savingBank}
              className="w-full mt-4 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
            >
              {savingBank ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              {savingBank ? 'Đang cập nhật...' : 'Lưu Thông Tin Tài Khoản'}
            </button>
          </form>
        </div>

        {/* Tabs & Table Section */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          {/* Tab Headers */}
          <div className="flex items-center border-b border-slate-200 bg-slate-50/50 p-2 gap-2">
            <button type="button"
              onClick={() => setActiveTab('earnings')}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-bold text-sm transition-all ${
                activeTab === 'earnings'
                  ? 'bg-white text-emerald-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <History className="w-4 h-4 text-emerald-600" />
              Lịch sử thu nhập ca dạy ({financeData.transactions.length})
            </button>
            <button type="button"
              onClick={() => setActiveTab('payouts')}
              className={`flex-1 flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl font-bold text-sm transition-all ${
                activeTab === 'payouts'
                  ? 'bg-white text-blue-700 shadow-sm border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <Clock className="w-4 h-4 text-blue-600" />
              Yêu cầu rút tiền ({financeData.payoutRequests.length})
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6 flex-1 overflow-y-auto max-h-[520px]">
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* Payout Request Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-emerald-200">
              <ArrowUpRight className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-2xl font-black text-slate-900 text-center">Yêu Cầu Rút Tiền</h3>
            <p className="text-xs text-slate-500 text-center mt-1 mb-6">
              Số tiền sẽ được chuyển khoản thẳng về số tài khoản Ngân hàng đã đăng ký của bạn.
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-5 space-y-2">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Số dư khả dụng hiện tại:</span>
                <strong className="text-slate-800 text-sm">{financeData.balance.toLocaleString('vi-VN')} đ</strong>
              </div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>Ngân hàng nhận:</span>
                <strong className="text-indigo-700">{financeData.bankInfo.bankName} - {financeData.bankInfo.bankAccountNumber}</strong>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="payoutAmount" className="block text-xs font-bold text-slate-700 uppercase mb-2">Nhập số tiền muốn rút (VNĐ)</label>
                <div className="relative">
                  <input
                    id="payoutAmount"
                    type="number"
                    step="50000"
                    min="200000"
                    max={financeData.balance}
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    placeholder="Tối thiểu 200.000đ"
                    className="w-full px-4 py-3.5 bg-white border border-slate-300 rounded-2xl font-black text-lg text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setPayoutAmount(financeData.balance.toString())}
                    className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-xs font-bold rounded-xl transition-all"
                  >
                    Rút Tất Cả
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">* Hạn mức rút tối thiểu 200.000 VNĐ / lệnh.</p>
              </div>

              <div className="flex flex-col gap-2.5 pt-2">
                <button type="button"
                  onClick={handleRequestPayout}
                  disabled={submittingPayout}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {submittingPayout ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  {submittingPayout ? 'Đang tạo yêu cầu...' : 'Xác Nhận Rút Tiền Ngay'}
                </button>
                <button type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all"
                >
                  Hủy bỏ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
