import React from 'react';
import { Link } from 'react-router-dom';
import { User, ShieldCheck, LogOut, Settings } from 'lucide-react';

export default function UserAccountMenu({ user, onLogout, onClose, position = 'bottom' }) {
  const positionClasses = position === 'bottom' 
    ? 'bottom-full mb-2 left-0' 
    : 'top-full mt-2 right-0';
  const animationClass = position === 'bottom' 
    ? 'slide-in-from-bottom-4' 
    : 'slide-in-from-top-4';

  const roleLabel = user?.role === 'admin' ? 'Quản trị viên' : user?.role === 'tutor' ? 'Gia sư' : 'Tài khoản cá nhân';

  return (
    <div className={`absolute ${positionClasses} w-60 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 animate-in fade-in ${animationClass} duration-300`}>
      <div className="px-4 py-3 border-b border-gray-50 mb-1">
        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{roleLabel}</p>
        <p className="text-sm font-medium text-gray-800 mt-0.5 truncate">{user?.fullName}</p>
      </div>
      
      <Link 
        to="/profile" 
        onClick={onClose}
        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
      >
        <User className="w-4 h-4 mr-3" />
        Thông tin cá nhân
      </Link>
      
      <Link 
        to="/profile?tab=password" 
        onClick={onClose}
        className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
      >
        <ShieldCheck className="w-4 h-4 mr-3" />
        Đổi mật khẩu
      </Link>

      <div className="h-px bg-gray-100 my-1"></div>
      
      <button 
        onClick={() => {
          onLogout();
          onClose();
        }}
        className="w-full flex items-center px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
      >
        <LogOut className="w-4 h-4 mr-3" />
        Đăng xuất
      </button>
    </div>
  );
}
