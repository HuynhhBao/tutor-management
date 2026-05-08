import React from 'react';
import { GraduationCap, BookMarked, Code } from 'lucide-react';

const CategoriesSection = ({ onRequireLogin }) => (
  <div className="py-16 px-4 text-center">
    <h2 className="text-3xl font-bold text-slate-900 mb-4">Tìm gia sư cho mọi môn học</h2>
    <p className="text-slate-500 mb-10">Chọn từ hàng ngàn gia sư giỏi cho mọi cấp độ, từ cơ bản đến nâng cao</p>

    <div className="flex flex-wrap justify-center gap-4 mb-10 max-w-4xl mx-auto">
      <button onClick={onRequireLogin} className="flex items-center gap-2 bg-white border border-slate-200 hover:border-blue-300 shadow-sm px-5 py-3 rounded-xl font-medium text-slate-700 transition-colors">
        <GraduationCap className="h-5 w-5 text-slate-500" /> Toán học cơ bản - Nâng cao
      </button>
      <button onClick={onRequireLogin} className="flex items-center gap-2 bg-white border border-slate-200 hover:border-blue-300 shadow-sm px-5 py-3 rounded-xl font-medium text-slate-700 transition-colors">
        <BookMarked className="h-5 w-5 text-blue-600" /> Tiếng Anh - Giao tiếp
      </button>
      <button onClick={onRequireLogin} className="flex items-center gap-2 bg-white border border-slate-200 hover:border-blue-300 shadow-sm px-5 py-3 rounded-xl font-medium text-slate-700 transition-colors">
        <Code className="h-5 w-5 text-blue-500" /> Lập trình - AI 🔥 Trendy
      </button>
    </div>

    <button onClick={onRequireLogin} className="text-blue-600 border border-blue-600 hover:bg-blue-50 px-6 py-2.5 rounded-lg font-medium transition-colors">
      Xem danh sách gia sư
    </button>
  </div>
);

export default CategoriesSection;
