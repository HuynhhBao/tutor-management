import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../services/apiClient';
import toast from 'react-hot-toast';
import { 
  CheckCircle2, XCircle, Clock, AlertCircle, QrCode, ArrowUpRight, 
  Building2, CreditCard, User, Loader2, Search, Filter, MessageSquare, Check, ShieldAlert
} from 'lucide-react';
import { getAvatarUrl } from '../../utils/avatar';

const BANK_CODE_MAP = {
  'vietcombank': 'VCB',
  'mbbank': 'MB',
  'mbbank (quân đội)': 'MB',
  'techcombank': 'TCB',
  'vpbank': 'VPB',
  'acb': 'ACB',
  'acb (á châu)': 'ACB',
  'tpbank': 'TPB',
  'bidv': 'BIDV',
  'vietinbank': 'ICB',
  'sacombank': 'STB',
  'hdbank': 'HDB',
  'agribank': 'VBA',
  'ocb': 'OCB',
  'vib': 'VIB'
};

function getVietQrCode(bankName) {
  if (!bankName) return 'MB';
  const clean = bankName.toLowerCase().trim();
  for (const [key, code] of Object.entries(BANK_CODE_MAP)) {
    if (clean.includes(key)) return code;
  }
  // Try matching abbreviations
  const upper = bankName.toUpperCase();
  if (['VCB', 'MB', 'TCB', 'VPB', 'ACB', 'TPB', 'BIDV', 'VIETIN', 'ICB', 'STB', 'HDB', 'VBA', 'OCB', 'VIB'].includes(upper)) {
    return upper === 'VIETIN' ? 'ICB' : upper;
  }
  return 'MB'; // fallback
}

export default function TutorPayoutManagement({ onUpdate }) {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // VietQR Modal
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionType, setActionType] = useState('approve'); // 'approve' or 'reject'
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient(`/admin/finance/payout-requests?status=${statusFilter}&page=${page}&limit=10`);
      const json = await res.json();
      if (res.ok && json.status === 'ok') {
        setRequests(json.data.requests || []);
        setTotalPages(json.data.pagination.totalPages || 1);
      } else {
        toast.error(json.message || 'Không thể tải danh sách yêu cầu');
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, page]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleOpenModal = (reqItem, action) => {
    setSelectedRequest(reqItem);
    setActionType(action);
    setAdminNote(action === 'approve' ? 'Đã giải ngân qua VietQR' : 'Thông tin tài khoản chưa chính xác hoặc thiếu sót');
  };

  const handleSubmitProcess = async () => {
    if (!selectedRequest) return;
    setProcessing(true);
    try {
      const res = await apiClient(`/admin/finance/payout-requests/${selectedRequest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionType, adminNote })
      });
      const json = await res.json();
      if (res.ok && json.status === 'ok') {
        toast.success(actionType === 'approve' ? '🎉 Đã xác nhận hoàn tất thanh toán cho gia sư!' : 'Đã từ chối yêu cầu.');
        setSelectedRequest(null);
        fetchRequests();
        if (onUpdate) onUpdate();
      } else {
        toast.error(json.message || 'Xử lý thất bại');
      }
    } catch {
      toast.error('Lỗi khi thực Hiện request');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2">
          {[
            { id: 'all', label: 'Tất Cả' },
            { id: 'pending', label: 'Chờ Giải Ngân (Pending)' },
            { id: 'approved', label: 'Đã Chi (Approved)' },
            { id: 'rejected', label: 'Bị Từ Chối (Rejected)' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setStatusFilter(tab.id); setPage(1); }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all ${
                statusFilter === tab.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Payout Requests Cards / Table */}
      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-700 text-base">Không có yêu cầu rút tiền nào</p>
          <p className="text-xs text-slate-400 mt-1">Các yêu cầu xin rút tiền của gia sư theo trạng thái này sẽ hiển thị tại đây.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {requests.map((item) => {
            const snap = item.bank_snapshot || {};
            const avatarSrc = getAvatarUrl(item.tutor_avatar, item.tutor_name, 'tutor');
            const bankCode = getVietQrCode(snap.bankName);

            return (
              <div
                key={item.id}
                className={`p-6 rounded-3xl bg-white border shadow-xs transition-all hover:shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 ${
                  item.status === 'pending' ? 'border-amber-200 bg-gradient-to-r from-amber-50/20 to-white' : 'border-slate-200'
                }`}
              >
                {/* Tutor info & Bank details */}
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <img src={avatarSrc} alt="Avatar" className="w-14 h-14 rounded-2xl object-cover border border-slate-200 shadow-xs flex-shrink-0" />
                  <div className="space-y-2 flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <h3 className="font-extrabold text-slate-900 text-lg truncate">{item.tutor_name}</h3>
                      <span className="text-xs font-medium text-slate-400">({item.tutor_email})</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-200 w-fit">
                      <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span>Ngân hàng: <strong className="text-slate-900 font-extrabold">{snap.bankName || 'N/A'}</strong></span>
                      <span className="text-slate-300">|</span>
                      <CreditCard className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>STK: <strong className="text-slate-900 font-extrabold tracking-wider">{snap.bankAccountNumber || 'N/A'}</strong></span>
                      <span className="text-slate-300">|</span>
                      <span>Chủ TK: <strong className="text-indigo-700 uppercase font-extrabold">{snap.bankAccountHolder || 'N/A'}</strong></span>
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-4">
                      <span>Số dư hiện tại của gia sư: <strong className="text-slate-700">{item.tutor_current_balance.toLocaleString('vi-VN')} đ</strong></span>
                      <span>• Tạo lúc: {new Date(item.created_at).toLocaleString('vi-VN')}</span>
                    </div>

                    {item.admin_note && item.status !== 'pending' && (
                      <p className="text-xs text-slate-600 font-medium bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200/60 w-fit">
                        💬 <strong>Ghi chú xử lý:</strong> {item.admin_note}
                      </p>
                    )}
                  </div>
                </div>

                {/* Amount & Actions */}
                <div className="flex flex-col md:items-end justify-between gap-4 border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 shrink-0">
                  <div className="text-left md:text-right">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">Số tiền yêu cầu rút</span>
                    <span className="text-2xl font-black text-emerald-600 tracking-tight">
                      {item.amount.toLocaleString('vi-VN')} <span className="text-base text-emerald-700">VNĐ</span>
                    </span>
                  </div>

                  {item.status === 'pending' ? (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleOpenModal(item, 'reject')}
                        className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-extrabold rounded-xl transition-all border border-rose-200 flex items-center gap-1.5 active:scale-95"
                      >
                        <XCircle className="w-4 h-4" />
                        Từ Chối
                      </button>
                      <button
                        onClick={() => handleOpenModal(item, 'approve')}
                        className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-500/25 transition-all flex items-center gap-2 active:scale-95"
                      >
                        <QrCode className="w-4 h-4" />
                        Duyệt Chi & Quét VietQR
                      </button>
                    </div>
                  ) : item.status === 'approved' ? (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 font-extrabold text-xs border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Đã Giải Ngân Thành Công
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-50 text-rose-700 font-extrabold text-xs border border-rose-200">
                      <XCircle className="w-4 h-4 text-rose-600" /> Bị Từ Chối
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 disabled:opacity-40"
          >
            Trước
          </button>
          <span className="text-xs font-bold text-slate-600 px-2">
            Trang {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 disabled:opacity-40"
          >
            Sau
          </button>
        </div>
      )}

      {/* VIETQR & PROCESS MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            {actionType === 'approve' ? (
              <div className="space-y-6 text-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                  <QrCode className="w-8 h-8 text-emerald-600 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-900">Quét Mã VietQR Giải Ngân Nhanh</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Sử dụng ứng dụng Ngân hàng trên điện thoại của bạn để quét mã bên dưới (số tiền và nội dung đã được điền tự động).
                  </p>
                </div>

                {/* VietQR Generated Box */}
                {(() => {
                  const snap = selectedRequest.bank_snapshot || {};
                  const code = getVietQrCode(snap.bankName);
                  const addInfo = `EDUMATCH PAYOUT ${selectedRequest.id} TU TO ${selectedRequest.tutor_name}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9 ]/g, '').substring(0, 45);
                  const qrUrl = `https://api.vietqr.io/image/${code}-${snap.bankAccountNumber}-compact2.jpg?amount=${selectedRequest.amount}&addInfo=${encodeURIComponent(addInfo)}&accountName=${encodeURIComponent(snap.bankAccountHolder || '')}`;

                  return (
                    <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200/80 flex flex-col items-center">
                      <div className="bg-white p-3 rounded-2xl shadow-md border border-slate-100 mb-4">
                        <img 
                          src={qrUrl} 
                          alt="VietQR Chuyển khoản" 
                          className="w-56 h-auto rounded-xl object-contain mx-auto"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextElementSibling.style.display = 'block';
                          }}
                        />
                        <div className="hidden py-10 px-4 text-center text-rose-500 text-xs font-bold">
                          ⚠️ Không thể tạo ảnh QR. Vui lòng chuyển khoản bằng tay theo thông tin bên dưới!
                        </div>
                      </div>
                      <div className="w-full text-left space-y-1 bg-white p-4 rounded-2xl border border-slate-200 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Người thụ hưởng:</span>
                          <span className="font-extrabold text-indigo-700 uppercase">{snap.bankAccountHolder}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Ngân hàng / STK:</span>
                          <span className="font-extrabold text-slate-900">{snap.bankName} - {snap.bankAccountNumber}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Số tiền chuyển:</span>
                          <span className="font-extrabold text-emerald-600 text-sm">{selectedRequest.amount.toLocaleString('vi-VN')} VNĐ</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-medium">Nội dung CK:</span>
                          <span className="font-bold text-slate-700">{addInfo}</span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div>
                  <label className="block text-left text-xs font-bold uppercase text-slate-700 mb-1.5">Ghi chú xác nhận (gửi tới Gia sư)</label>
                  <input
                    type="text"
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    placeholder="VD: Đã giải ngân qua chuyển khoản Vietcombank"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                  />
                </div>

                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={handleSubmitProcess}
                    disabled={processing}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 text-sm"
                  >
                    {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                    {processing ? 'Đang cập nhật hệ thống...' : 'Tôi Đã Chuyển Khoản -> Xác Nhận Hoàn Tất Lệnh'}
                  </button>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-all"
                  >
                    Đóng lại (Chưa thao tác)
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 text-center">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto border border-rose-200">
                  <XCircle className="w-8 h-8 text-rose-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-extrabold text-slate-900">Từ Chối Yêu Cầu Rút Tiền</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Số dư <strong>{selectedRequest.amount.toLocaleString('vi-VN')} đ</strong> sẽ không bị trừ khỏi ví của gia sư {selectedRequest.tutor_name}.
                  </p>
                </div>

                <div className="text-left">
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-2">Lý do từ chối <span className="text-rose-500">*</span></label>
                  <textarea
                    rows={3}
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    required
                    placeholder="VD: Sai thông tin số tài khoản Ngân hàng, hoặc sai tên chủ tài khoản..."
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-900 focus:ring-2 focus:ring-rose-500 outline-none font-medium"
                  />
                </div>

                <div className="flex flex-col gap-2.5">
                  <button
                    onClick={handleSubmitProcess}
                    disabled={processing || !adminNote.trim()}
                    className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-2xl shadow-lg shadow-rose-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 text-sm"
                  >
                    {processing ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                    {processing ? 'Đang xử lý...' : 'Xác Nhận Từ Chối & Gửi Thông Báo'}
                  </button>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    className="w-full py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-all"
                  >
                    Hủy bỏ
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
