import React from 'react';
import Modal from '../common/Modal';
import { UserCircle, Loader2 } from 'lucide-react';

const GrantAccountModal = ({ isOpen, grantUsername, setGrantUsername, grantStatus, onSubmit, onClose }) => (
  <Modal isOpen={isOpen} onClose={onClose} title="Cấp Tài Khoản Gia Sư">
    <form onSubmit={onSubmit} className="space-y-4">
      {grantStatus.error && (
        <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
          {grantStatus.error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Tên tài khoản (Username)</label>
        <div className="relative">
          <input
            type="text"
            required
            value={grantUsername}
            onChange={(e) => setGrantUsername(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            placeholder="Nhập tên đăng nhập cho gia sư"
          />
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <UserCircle className="w-4 h-4 text-slate-400" />
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-2 italic">
          * Mật khẩu sẽ được sinh ngẫu nhiên. Tài khoản và mật khẩu sẽ được gửi trực tiếp đến email của gia sư.
        </p>
      </div>

      <div className="flex gap-3 pt-4">
        <button type="button" onClick={onClose}
          className="flex-1 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-100 transition-colors">
          Hủy
        </button>
        <button type="submit" disabled={grantStatus.loading}
          className="flex-1 px-4 py-2.5 bg-green-600 text-white rounded-xl text-sm font-bold hover:bg-green-700 transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2">
          {grantStatus.loading && <Loader2 className="w-4 h-4 animate-spin" />}
          Tạo & Gửi Email
        </button>
      </div>
    </form>
  </Modal>
);

export default GrantAccountModal;
