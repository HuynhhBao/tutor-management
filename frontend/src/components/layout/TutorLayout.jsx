import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, LogOut, BookOpen, User, Menu, X, MessageSquare, Wallet } from 'lucide-react';
import NotificationBell from './NotificationBell';
import { getAvatarUrl } from '../../utils/avatar';

const TutorLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // Poll số tin nhắn chưa đọc và booking pending
  React.useEffect(() => {
    const fetchUnreadChat = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/chat/unread-count', { credentials: 'include' });
        if (res.ok) {
          const json = await res.json();
          if (json.status === 'ok') {
            const count = json.data?.total_unread !== undefined ? json.data.total_unread : json.total_unread;
            setUnreadChatCount(count || 0);
          }
        }
      } catch (err) {
        console.error('Error fetching unread chat count:', err);
      }
    };
    fetchUnreadChat();
    const interval = setInterval(fetchUnreadChat, 5000);
    window.addEventListener('unread_message_update', fetchUnreadChat);
    return () => {
      clearInterval(interval);
      window.removeEventListener('unread_message_update', fetchUnreadChat);
    };
  }, []);


  const handleLogout = React.useCallback(async () => {
    await logout();
    navigate('/', { replace: true });
  }, [logout, navigate]);

  // Handle browser back button to confirm logout ONLY on root dashboard
  React.useEffect(() => {
    const isRootDashboard = location.pathname === '/tutor-dashboard' || location.pathname === '/tutor-dashboard/';
    if (!isRootDashboard) return;

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
    { path: '/tutor-dashboard', label: 'Tổng quan', icon: GraduationCap },
    { path: '/tutor-dashboard/chat', label: 'Trò chuyện', icon: MessageSquare },
    { path: '/tutor-dashboard/my-classes', label: 'Lớp của tôi', icon: BookOpen },
    { path: '/tutor-dashboard/finance', label: 'Ví & Thu nhập', icon: Wallet },
    { path: '/tutor-dashboard/profile', label: 'Hồ sơ', icon: User },
  ];

  const avatarSrc = getAvatarUrl(user?.avatarUrl, user?.fullName || user?.username || 'Gia sư', 'tutor');


  return (
    <div className="min-h-screen bg-slate-100 font-sans flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center gap-4 py-2 min-h-[4rem]">
            {/* Left side: Logo & Desktop Menu */}
            <div className="flex items-center flex-1 overflow-x-auto">
              <button type="button" 
                className="flex-shrink-0 flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg py-1 mr-6" 
                onClick={() => navigate('/tutor-dashboard')}
                aria-label="EduMatch Tutor Dashboard"
              >
                <GraduationCap className="h-8 w-8 text-blue-600" />
                <span className="ml-2 text-xl font-bold text-slate-900 hidden sm:block">EduMatch</span>
              </button>
              
              {/* Desktop Menu */}
              <div className="hidden md:flex items-center space-x-2 flex-wrap gap-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <button type="button"
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                        isActive 
                          ? 'bg-blue-100 text-blue-700 shadow-sm' 
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Icon className={`mr-2 h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className="flex items-center gap-1.5">
                        <span>{item.label}</span>
                        {item.path === '/tutor-dashboard/chat' && unreadChatCount > 0 && (
                          <span className="px-1.5 py-0.5 bg-rose-500 text-white font-extrabold text-[10px] rounded-full min-w-[18px] text-center shadow-xs animate-bounce">
                            {unreadChatCount > 99 ? '99+' : unreadChatCount}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right side: Notification + User Profile & Logout (Desktop) */}
            <div className="hidden md:flex items-center gap-4 flex-shrink-0">
              <NotificationBell />
              <div className="flex items-center gap-3">
                <div className="text-right hidden lg:block">
                  <span className="text-[11px] text-slate-500 block leading-tight uppercase font-bold tracking-wider">Gia sư</span>
                  <span className="text-sm font-bold text-slate-900">{user?.fullName || user?.username}</span>
                </div>
                <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold border border-indigo-200 overflow-hidden shadow-sm">
                  <img 
                    src={avatarSrc} 
                    alt="Avatar" 
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              <button type="button"
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-red-600 bg-white hover:bg-red-50 hover:border-red-200 transition-colors whitespace-nowrap"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Đăng xuất
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center md:hidden flex-shrink-0">
              <button type="button"
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
          <div className="sm:hidden border-t border-slate-200 bg-white">
            <div className="pt-2 pb-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <button type="button"
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
                    <span className="flex items-center gap-2">
                      <span>{item.label}</span>
                      {item.path === '/tutor-dashboard/chat' && unreadChatCount > 0 && (
                        <span className="px-2 py-0.5 bg-rose-500 text-white font-extrabold text-xs rounded-full shadow-xs animate-pulse">
                          {unreadChatCount > 99 ? '99+' : unreadChatCount}
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="pt-4 pb-4 border-t border-slate-200">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold border border-indigo-200 overflow-hidden shadow-sm">
                    <img 
                      src={avatarSrc} 
                      alt="Avatar" 
                      className="h-full w-full object-cover"
                    />
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-slate-800">{user?.fullName || user?.username}</div>
                  <div className="text-sm font-medium text-slate-500">{user?.email || 'Gia sư'}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <button type="button"
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
              <button type="button" 
                onClick={handleLogout}
                className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 active:scale-95"
              >
                Đăng xuất ngay
              </button>
              <button type="button" 
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

export default TutorLayout;
