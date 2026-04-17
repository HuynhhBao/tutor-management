import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  UserSquare, 
  CalendarDays, 
  Wallet 
} from 'lucide-react';

const menuItems = [
  { path: '/', name: 'Tổng quan', icon: LayoutDashboard },
  { path: '/tutors', name: 'Quản lý Gia sư', icon: Users },
  { path: '/students', name: 'Quản lý Học viên', icon: UserSquare },
  { path: '/classes', name: 'Sắp xếp Lớp học', icon: CalendarDays },
  { path: '/finance', name: 'Tài chính', icon: Wallet },
];

export default function Sidebar() {
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
              className={({ isActive }) =>
                `flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                }`
              }
            >
              <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
              {item.name}
            </NavLink>
          );
        })}
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
            A
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-700">Admin User</p>
            <p className="text-xs text-gray-500">admin@tutor.com</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
