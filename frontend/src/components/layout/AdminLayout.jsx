import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  UserSquare, 
  CalendarDays, 
  Wallet,
  LogOut,
  Bell,
  Menu,
  X,
  ShieldCheck,
  CalendarCheck
} from 'lucide-react';

const AdminLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({ totalTutors: 0, pendingApplications: 0 });

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('http://localhost:3001/api/tutors/stats');
        const data = await res.json();
        if (data.status === 'ok') {
          setStats(data.data);
        }
      } catch (err) {
        console.error('Error fetching sidebar stats:', err);
      }
    };
    fetchStats();
    
    // Listen for cross-component updates
    globalThis.addEventListener('tutorStatsChanged', fetchStats);
    return () => globalThis.removeEventListener('tutorStatsChanged', fetchStats);
  }, []);

  const primaryNavItems = [
    { path: '/admin', label: 'Tổng quan', icon: LayoutDashboard },
    { path: '/admin/tutors', label: 'Quản lý Gia sư', icon: Users, badge: 'pendingApplications' },
    { path: '/admin/students', label: 'Quản lý Học viên', icon: UserSquare },
    { path: '/admin/bookings', label: 'Quản lý Đặt lịch', icon: CalendarCheck },
    { path: '/admin/classes', label: 'Sắp xếp Lớp học', icon: CalendarDays },
  ];

  const secondaryNavItems = [
    { path: '/admin/finance', label: 'Tài chính', icon: Wallet },
  ];

  const allNavItems = [...primaryNavItems, ...secondaryNavItems];

  return (
    <div className="min-h-screen bg-slate-100 font-sans flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Branding, Menu & Actions */}
          <div className="flex justify-between gap-4">
            {/* Logo Row (Left) */}
            <div className="flex items-center flex-shrink-0 h-16">
              <button 
                className="flex items-center focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg pr-4" 
                onClick={() => navigate('/admin')}
                aria-label="EduMatch Admin Dashboard"
              >
                <ShieldCheck className="h-8 w-8 text-primary-600" />
                <span className="ml-2 text-xl font-bold text-slate-900 hidden lg:block">TutorAdmin</span>
              </button>
            </div>

            {/* Middle Column: Primary (Row 1) and Secondary (Row 2) Menus */}
            <div className="hidden md:flex flex-col flex-1">
              {/* Top Row: Primary Menu */}
              <div className="flex items-center h-16 space-x-1">
                {primaryNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/admin'}
                      className={({ isActive }) => 
                        `inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                          isActive 
                            ? 'bg-primary-50 text-primary-700 shadow-sm' 
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`
                      }
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.label}
                      {item.badge && stats[item.badge] > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                          {stats[item.badge]}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>

              {/* Bottom Row: Secondary Menu (Aligned with Primary) */}
              <div className="flex items-center space-x-1 pb-2">
                {secondaryNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) => 
                        `inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          isActive 
                            ? 'bg-primary-50 text-primary-700 shadow-sm' 
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`
                      }
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </NavLink>
                  );
                })}
              </div>
            </div>

            {/* Right side Row: Notifications & Profile & Logout */}
            <div className="flex items-center gap-4 flex-shrink-0 h-16">
              {/* Actions (Desktop only) */}
              <div className="hidden sm:flex items-center gap-4">
                <button className="relative p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors">
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                </button>
                
                <div className="h-8 w-px bg-slate-200 mx-1"></div>

                <div className="flex items-center gap-3">
                  <div className="text-right hidden lg:block">
                    <p className="text-sm font-semibold text-slate-900 leading-tight">{user?.fullName || 'Admin'}</p>
                    <p className="text-xs text-slate-500 capitalize">{user?.role || 'Quản trị viên'}</p>
                  </div>
                  <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold border border-primary-200 overflow-hidden shadow-sm">
                    {user?.avatarUrl ? (
                      <img 
                        src={`http://localhost:3001${user.avatarUrl}`} 
                        alt="Avatar" 
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      (user?.fullName || 'A').charAt(0)
                    )}
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-red-600 bg-white hover:bg-red-50 hover:border-red-200 transition-colors whitespace-nowrap"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Đăng xuất
                </button>
              </div>

              {/* Mobile menu button */}
              <div className="flex items-center sm:hidden">
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none"
                >
                  {isMobileMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="sm:hidden border-t border-slate-200 bg-white">
            <div className="pt-2 pb-3 space-y-1">
              {allNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === '/admin'}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center w-full pl-3 pr-4 py-3 text-base font-medium border-l-4 ${
                        isActive
                          ? 'bg-primary-50 border-primary-600 text-primary-700'
                          : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 hover:border-slate-300'
                      }`
                    }
                  >
                    <Icon className={`mr-3 h-5 w-5`} />
                    {item.label}
                    {item.badge && stats[item.badge] > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {stats[item.badge]}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
            <div className="pt-4 pb-4 border-t border-slate-200">
              <div className="flex items-center px-4">
                <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold border border-primary-200 overflow-hidden shadow-sm">
                  {user?.avatarUrl ? (
                    <img 
                      src={`http://localhost:3001${user.avatarUrl}`} 
                      alt="Avatar" 
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (user?.fullName || 'A').charAt(0)
                  )}
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-slate-800">{user?.fullName}</div>
                  <div className="text-sm font-medium text-slate-500 uppercase">{user?.role}</div>
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-base font-medium text-red-600 hover:bg-red-50"
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
    </div>
  );
};

export default AdminLayout;
