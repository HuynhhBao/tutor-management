import React from 'react';
import { Search } from 'lucide-react';
import NotificationBell from './NotificationBell';

export default function Header() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-10">
      <div className="flex-1 flex items-center">
        <div className="relative w-64">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="w-4 h-4 text-gray-400" />
          </span>
          <input
            type="text"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-shadow"
            placeholder="Tìm kiếm..."
          />
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <NotificationBell />
      </div>
    </header>
  );
}
