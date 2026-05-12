import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, LogOut, Search, User, Menu, X, Wallet, MessageSquare, History, LayoutDashboard, CalendarPlus, CalendarCheck } from 'lucide-react';

const StudentLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogout = React.useCallback(async () => {
    await logout();
    navigate('/', { replace: true });
  }, [logout, navigate]);

  // Handle browser back button to confirm logout
  React.useEffect(() => {
    const lockHistory = () => {
      // Use a hash to force the browser to treat this as a real navigation point
      const lockedUrl = globalThis.location.pathname + '#dashboard';
      globalThis.history.pushState({ lockId: Date.now() }, null, lockedUrl);
    };

    // Small delay to ensure browser history stack is ready after refresh
    const timer = setTimeout(() => {
      // Only push if we aren't already on the hashed URL
      if (!globalThis.location.hash.includes('#dashboard')) {
        lockHistory();
      }
    }, 100);

    const handlePopState = (event) => {
      // If user tries to back out of the hash, re-lock and show modal
      if (!globalThis.location.hash.includes('#dashboard')) {
        lockHistory();
        setShowLogoutModal(true);
      }
    };

    globalThis.addEventListener('popstate', handlePopState);

    return () => {
      clearTimeout(timer);
      globalThis.removeEventListener('popstate', handlePopState);
    };
  }, [location.pathname]);


  const navItems = [
    { path: '/student-dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { path: '/student-dashboard/booking', label: 'Đặt lịch', icon: CalendarPlus },
    { path: '/student-dashboard/booking-history', label: 'Lịch của tôi', icon: CalendarCheck },
    { path: '/student-dashboard/search', label: 'Tìm gia sư', icon: Search },
    { path: '/student-dashboard/history', label: 'Lịch sử thuê', icon: History },
    { path: '/student-dashboard/wallet', label: 'Ví tiền', icon: Wallet },
    { path: '/student-dashboard/chat', label: 'Trò chuyện', icon: MessageSquare },
    { path: '/student-dashboard/profile', label: 'Hồ sơ', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Left side: Logo & Desktop Menu */}
            <div className="flex">
              <button 
                className="flex-shrink-0 flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg" 
                onClick={() => navigate('/student-dashboard')}
                aria-label="EduMatch Dashboard"
              >
                <GraduationCap className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-slate-900 hidden sm:block">EduMatch</span>
                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded uppercase tracking-wider hidden md:block">
                  Học viên
                </span>
              </button>
              
              {/* Desktop Menu */}
              <div className="hidden lg:ml-8 lg:flex lg:space-x-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`inline-flex items-center px-3 py-2 mt-3 mb-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Icon className={`mr-2 h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right side: User Profile & Logout (Desktop) */}
            <div className="hidden sm:flex sm:items-center sm:ml-6 gap-4">
              <div className="flex flex-col items-end text-sm">
                <span className="text-slate-500 text-xs">Xin chào,</span>
                <span className="font-semibold text-slate-900 leading-tight">{user?.fullName || user?.username}</span>
              </div>
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200 overflow-hidden shadow-sm">
                {user?.avatarUrl ? (
                  <img 
                    src={`http://localhost:3001${user.avatarUrl}`} 
                    alt="Avatar" 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (user?.fullName || user?.username || 'H').charAt(0)
                )}
              </div>
              <button 
                onClick={async () => {
                  await logout();
                  navigate('/');
                }}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Đăng xuất"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              >
                {isMobileMenuOpen ? (
                  <X className="block h-6 w-6" />
                ) : (
                  <Menu className="block h-6 w-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white">
            <div className="pt-2 pb-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center w-full pl-3 pr-4 py-3 text-base font-medium border-l-4 ${
                      isActive
                        ? 'bg-blue-100 border-blue-500 text-blue-700'
                        : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-500' : 'text-slate-400'}`} />
                    {item.label}
                  </button>
                );
              })}
            </div>
            <div className="pt-4 pb-4 border-t border-slate-200">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold uppercase">
                    {(user?.fullName || user?.username || 'H').charAt(0)}
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-slate-800">{user?.fullName || user?.username}</div>
                  <div className="text-sm font-medium text-slate-500">{user?.email || 'Học viên'}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-base font-medium text-red-600 hover:bg-red-50 hover:text-red-800"
                >
                  <LogOut className="mr-3 h-5 w-5 text-red-500" />
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <LogOut className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 text-center mb-2">Xác nhận đăng xuất</h3>
            <p className="text-slate-500 text-center mb-8 leading-relaxed">
              Bạn có chắc chắn muốn đăng xuất khỏi hệ thống và quay về trang chủ không?
            </p>
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleLogout}
                className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 active:scale-95"
              >
                Đăng xuất ngay
              </button>
              <button 
                onClick={() => setShowLogoutModal(false)}
                className="w-full py-4 bg-slate-100 text-slate-700 font-bold rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
              >
                Ở lại trang này
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentLayout;
