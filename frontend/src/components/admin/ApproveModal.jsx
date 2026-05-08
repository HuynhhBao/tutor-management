import React from 'react';
import Modal from '../common/Modal';
import { CalendarDays, MapPin, Loader2 } from 'lucide-react';

const ApproveModal = ({ isOpen, interviewData, setInterviewData, approveStatus, onSubmit, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Duyệt Hồ Sơ & Lên Lịch Phỏng Vấn">
    <form onSubmit={onSubmit} className="space-y-4">
      {approveStatus.error && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
          {approveStatus.error}
        </div>
      )}

      {/* Thời gian phỏng vấn */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Thời gian phỏng vấn</label>
        <div className="relative">
          <input
            type="datetime-local"
            required
            value={interviewData.time}
            onChange={(e) => setInterviewData({ ...interviewData, time: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
          />
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <CalendarDays className="w-4 h-4 text-slate-400" />
          </span>
        </div>
      </div>

      {/* Địa điểm phỏng vấn */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Địa điểm phỏng vấn</label>
        <div className="relative">
          <input
            type="text"
            required
            value={interviewData.address}
            onChange={(e) => setInterviewData({ ...interviewData, address: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            placeholder="VD: Phòng 204, Tòa nhà A, Số 1 Đường B"
          />
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <MapPin className="w-4 h-4 text-slate-400" />
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-2 italic">
          * Email mời phỏng vấn sẽ tự động được gửi tới ứng viên sau khi bạn nhấn Duyệt.
        </p>
      </div>

      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onClose}
          className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors">
          Hủy
        </button>
        <button type="submit" disabled={approveStatus.loading}
          className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2">
          {approveStatus.loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Duyệt & Gửi Email
        </button>
      </div>
    </form>
  </Modal>
);

export default ApproveModal;
