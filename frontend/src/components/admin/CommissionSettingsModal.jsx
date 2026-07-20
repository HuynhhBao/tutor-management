import React, { useState } from 'react';
import { X, Percent, Save, Calculator, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const formatVND = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
};

export default function CommissionSettingsModal({ isOpen, onClose, currentRate, onSave }) {
  const [rate, setRate] = useState(currentRate || 15);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const mockBooking = 1000000;
  const numRate = parseFloat(rate) || 0;
  const systemCommission = (mockBooking * numRate) / 100;
  const tutorPayout = mockBooking - systemCommission;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (numRate < 0 || numRate > 100) {
      toast.error('Tỷ lệ hoa hồng phải từ 0% đến 100%');
      return;
    }

    try {
      setSaving(true);
      await onSave(numRate);
      toast.success('Cập nhật tỷ lệ hoa hồng hệ thống thành công!');
      onClose();
    } catch (err) {
      toast.error(err.message || 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <Percent className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Cấu Hình Hoa Hồng Hệ Thống
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Phần trăm hoa hồng EduMatch giữ lại (%)
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-lg font-extrabold text-slate-900 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors pr-10"
                required
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                %
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2 flex items-center">
              <AlertCircle className="w-3.5 h-3.5 mr-1 text-emerald-600 flex-shrink-0" />
              Mức hoa hồng này được áp dụng tự động cho tất cả các giao dịch thanh toán lớp học.
            </p>
          </div>

          {/* Real-time Calculation Simulation Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-slate-700 border-b border-slate-200/80 pb-2">
              <Calculator className="w-4 h-4 text-emerald-600" />
              <span>Mô phỏng tính toán (Lớp 1,000,000 VNĐ)</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-600">
                <span>Hoa hồng Nền tảng ({numRate}%):</span>
                <span className="font-mono font-extrabold text-emerald-600">
                  {formatVND(systemCommission)}
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-600">
                <span>Thực nhận của Gia sư ({100 - numRate}%):</span>
                <span className="font-mono font-extrabold text-amber-600">
                  {formatVND(tutorPayout)}
                </span>
              </div>
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center space-x-2 px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm disabled:opacity-50 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
