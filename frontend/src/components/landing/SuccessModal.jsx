import React from 'react';
import { CheckCircle, X } from 'lucide-react';

const SuccessModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-8 text-center">
          <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          
          <h3 className="text-2xl font-bold text-slate-900 mb-2">Thành công!</h3>
          <p className="text-slate-500 mb-8">
            Hồ sơ ứng tuyển của bạn đã được gửi đi. Đội ngũ EduMatch sẽ xem xét và phản hồi qua email trong thời gian sớm nhất.
          </p>

          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5"
          >
            Đóng thông báo
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
