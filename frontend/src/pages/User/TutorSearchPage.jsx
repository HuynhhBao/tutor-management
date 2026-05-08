import React from 'react';
import { Search, Filter, MapPin, GraduationCap, Star, BookOpen } from 'lucide-react';

const TutorSearchPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Tìm kiếm Gia sư</h1>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input 
            type="text" 
            placeholder="Tìm theo tên, môn học hoặc kỹ năng..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 font-bold text-slate-900 mb-4">
              <Filter className="w-4 h-4" />
              Bộ lọc
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Môn học</label>
                <select className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-sm">
                  <option>Tất cả môn học</option>
                  <option>Toán học</option>
                  <option>Ngữ văn</option>
                  <option>Tiếng Anh</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Khu vực</label>
                <select className="w-full p-2 bg-slate-100 border border-slate-200 rounded-lg text-sm">
                  <option>Tất cả khu vực</option>
                  <option>Quận 1</option>
                  <option>Quận 7</option>
                  <option>Thủ Đức</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Results Grid */}
        <div className="lg:col-span-3">
          <div className="bg-white p-12 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Search className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Đang tìm kiếm gia sư...</h3>
            <p className="text-slate-500 mt-2">Dữ liệu gia sư sẽ sớm được cập nhật tại đây.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorSearchPage;
