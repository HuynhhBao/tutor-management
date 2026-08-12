import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'confirmed', label: 'Đã xác nhận / Đang học', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  { value: 'disputed', label: 'Có tranh chấp', color: 'text-rose-600 bg-rose-50 border-rose-200' },
  { value: 'resolved', label: 'Đã giải quyết tranh chấp', color: 'text-purple-600 bg-purple-50 border-purple-200' },
  { value: 'completed', label: 'Đã hoàn thành', color: 'text-emerald-600 bg-emerald-50 border-emerald-200' },
  { value: 'cancelled', label: 'Đã hủy', color: 'text-slate-600 bg-slate-100 border-slate-200' },
  { value: 'pending', label: 'Chờ xác nhận', color: 'text-amber-600 bg-amber-50 border-amber-200' },
];

const DisputeResolutionModal = ({ isOpen, onClose, selectedClass, onUpdateStatus }) => {
  const [status, setStatus] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [isRefund, setIsRefund] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (selectedClass) {
      setStatus(selectedClass.status || 'confirmed');
      setAdminNote(selectedClass.admin_note || '');
      setIsRefund(false);
      setError('');
    }
  }, [selectedClass]);

  if (!isOpen || !selectedClass) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!status) {
      setError('Vui lòng chọn trạng thái');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onUpdateStatus(selectedClass.id, { status, adminNote, isRefund });
      onClose();
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi cập nhật trạng thái');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-50 rounded-xl text-primary-600">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Xử lý & Cập nhật Lớp học #{selectedClass.id}</h3>
              <p className="text-xs text-slate-500">Quản lý và giải quyết tranh chấp giữa Học viên & Gia sư</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Class Summary */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-2 border border-slate-100 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Môn học:</span>
              <span className="font-semibold text-slate-800">{selectedClass.subject}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Học viên:</span>
              <span className="font-medium text-slate-700">{selectedClass.student_name} ({selectedClass.student_phone || selectedClass.student_email})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Gia sư:</span>
              <span className="font-medium text-slate-700">{selectedClass.tutor_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Thời gian học:</span>
              <span className="text-slate-700">{selectedClass.schedule_time || 'Thỏa thuận'}</span>
            </div>
            {selectedClass.message && (
              <div className="pt-2 border-t border-slate-200 text-xs text-slate-600">
                <span className="font-semibold text-slate-700">Lời nhắn:</span> {selectedClass.message}
              </div>
            )}
          </div>

          {/* Select Status */}
          <fieldset>
            <legend className="block text-xs font-semibold text-slate-700 mb-2">
              Chọn Trạng thái mới <span className="text-red-500">*</span>
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => {
                    setStatus(opt.value);
                    if (opt.value === 'cancelled' || opt.value === 'resolved') {
                      setIsRefund(true);
                    }
                  }}
                  className={`flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-all ${
                    status === opt.value
                      ? `${opt.color} ring-2 ring-primary-500 shadow-sm`
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{opt.label}</span>
                  {status === opt.value && <CheckCircle className="w-4 h-4 text-primary-600" />}
                </button>
              ))}
            </div>
          </fieldset>

          {/* Admin Note */}
          <div>
            <label htmlFor="adminNote" className="block text-xs font-semibold text-slate-700 mb-1">
              Ghi chú xử lý của Admin (Admin Note)
            </label>
            <textarea
              id="adminNote"
              rows={3}
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder="Nhập chi tiết quyết định xử lý, lý do tranh chấp hoặc kết quả thỏa thuận..."
              className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Ghi chú này sẽ được lưu vết hệ thống và gửi kèm thông báo tới Học viên & Gia sư.
            </p>
          </div>

          {/* Refund option */}
          <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl flex items-center gap-3">
            <input
              type="checkbox"
              id="isRefundCheckbox"
              checked={isRefund}
              onChange={(e) => setIsRefund(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-slate-300 cursor-pointer"
            />
            <label htmlFor="isRefundCheckbox" className="text-xs font-semibold text-emerald-900 cursor-pointer select-none">
              Hoàn lại 100.000đ phí đặt lịch vào Ví của Học viên
              <p className="text-[11px] text-emerald-700 font-normal mt-0.5">Tự động +100.000đ vào số dư ví và lưu lịch sử giao dịch deposit.</p>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {loading && <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>}
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DisputeResolutionModal;
