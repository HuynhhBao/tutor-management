import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { GraduationCap, LogOut, BookOpen, Search, User, Menu, X } from 'lucide-react';

const TutorLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/tutor-dashboard', label: 'Tổng quan', icon: GraduationCap },
    { path: '/tutor-dashboard/my-classes', label: 'Lớp của tôi', icon: BookOpen },
    { path: '/tutor-dashboard/available', label: 'Tìm lớp mới', icon: Search },
    { path: '/tutor-dashboard/profile', label: 'Hồ sơ', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
      {/* Top Navigation Bar */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Left side: Logo & Desktop Menu */}
            <div className="flex">
              <div className="flex-shrink-0 flex items-center cursor-pointer" onClick={() => navigate('/tutor-dashboard')}>
                <GraduationCap className="h-8 w-8 text-purple-600" />
                <span className="ml-2 text-xl font-bold text-slate-900 hidden sm:block">EduMatch</span>
              </div>
              
              {/* Desktop Menu */}
              <div className="hidden sm:ml-8 sm:flex sm:space-x-4">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className={`inline-flex items-center px-3 py-2 mt-3 mb-3 rounded-lg text-sm font-medium transition-colors ${
                        isActive 
                          ? 'bg-purple-50 text-purple-700' 
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                    >
                      <Icon className={`mr-2 h-4 w-4 ${isActive ? 'text-purple-600' : 'text-slate-400'}`} />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right side: User Profile & Logout (Desktop) */}
            <div className="hidden sm:flex sm:items-center sm:ml-6 gap-4">
              <div className="text-sm">
                <span className="text-slate-500">Xin chào,</span>{' '}
                <span className="font-semibold text-slate-900">{user?.fullName || user?.username}</span>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center px-3 py-2 border border-slate-200 rounded-lg text-sm font-medium text-red-600 bg-white hover:bg-red-50 hover:border-red-200 transition-colors"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Đăng xuất
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
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
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center w-full pl-3 pr-4 py-3 text-base font-medium border-l-4 ${
                      isActive
                        ? 'bg-purple-50 border-purple-500 text-purple-700'
                        : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-purple-500' : 'text-slate-400'}`} />
                    {item.label}
                  </button>
                );
              })}
            </div>
            <div className="pt-4 pb-4 border-t border-slate-200">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold uppercase">
                    {(user?.fullName || user?.username || 'G').charAt(0)}
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-slate-800">{user?.fullName || user?.username}</div>
                  <div className="text-sm font-medium text-slate-500">{user?.email || 'Gia sư'}</div>
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
    </div>
  );
};

export default TutorLayout;
