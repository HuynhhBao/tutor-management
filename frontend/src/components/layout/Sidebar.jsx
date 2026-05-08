import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserSquare, 
  CalendarDays, 
  Wallet,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const menuItems = [
  { path: '/admin', name: 'Tổng quan', icon: LayoutDashboard },
  { path: '/admin/tutors', name: 'Quản lý Gia sư', icon: Users, badge: 'pendingApplications' },
  { path: '/admin/students', name: 'Quản lý Học viên', icon: UserSquare },
  { path: '/admin/classes', name: 'Sắp xếp Lớp học', icon: CalendarDays },
  { path: '/admin/finance', name: 'Tài chính', icon: Wallet },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalTutors: 0, pendingApplications: 0 });

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
    const interval = setInterval(fetchStats, 60000); // 1 minute
    
    // Listen for cross-component updates
    window.addEventListener('tutorStatsChanged', fetchStats);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('tutorStatsChanged', fetchStats);
    };
  }, []);

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm">
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-primary-600 tracking-tight">TutorAdmin</h1>
      </div>
      
      <nav className="flex-1 py-4 px-3 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
              <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/admin'}
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
              <span className="flex-1">{item.name}</span>
              {item.badge && stats[item.badge] > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                  {stats[item.badge]}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold uppercase">
              {user?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-gray-700 truncate">{user?.fullName || 'Người dùng'}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email || 'Chưa đăng nhập'}</p>
            </div>
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
      </div>
    </aside>
  );
}
