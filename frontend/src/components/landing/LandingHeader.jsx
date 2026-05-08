import React from 'react';
import { GraduationCap, User, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import UserAccountMenu from '../UserAccountMenu';

const LandingHeader = ({ user, showMenu, setShowMenu, onLogout, onRequireLogin }) => {
  const navigate = useNavigate();

  return (
    <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <GraduationCap className="h-8 w-8 text-blue-600" />
          <span className="text-xl font-bold text-slate-900">EduMatch</span>
        </div>

        {/* Nav actions */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4 relative">
              <div
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg text-blue-700 font-medium text-sm cursor-pointer hover:bg-blue-100 transition-colors group"
                onClick={() => setShowMenu(!showMenu)}
              >
                <User className="h-4 w-4" />
                <span>Chào, {user.fullName}</span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showMenu ? 'rotate-180' : ''}`} />
              </div>
              {showMenu && (
                <UserAccountMenu user={user} onLogout={onLogout} onClose={() => setShowMenu(false)} position="top" />
              )}
            </div>
          ) : (
            <>
              <button onClick={onRequireLogin} className="text-slate-600 hover:text-blue-600 font-medium transition-colors text-sm">
                Đăng nhập
              </button>
              <button onClick={() => navigate('/register')} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm">
                Đăng ký
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default LandingHeader;
