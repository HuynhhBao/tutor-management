import React from 'react';
import { GraduationCap } from 'lucide-react';

const HeroSection = ({ onRequireLogin }) => (
  <div className="bg-gradient-to-b from-blue-100 via-white to-slate-100/50 pt-16 pb-32 md:pt-24 md:pb-40 px-4 sm:px-6 lg:px-8 text-center">
    <div className="max-w-4xl mx-auto">
      <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium mb-8">
        <GraduationCap className="h-4 w-4" />
        Nền tảng gia sư trực tuyến #1 Việt Nam
      </div>
      <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-6 leading-tight">
        Học Cùng Gia Sư Online – Tiết Kiệm Thời Gian,{' '}
        <span className="text-blue-600">Hiệu Quả Gấp 3 Lần!</span>
      </h1>
      <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-3xl mx-auto">
        Kết nối với hơn 10,000+ gia sư uy tín, học mọi lúc mọi nơi. Cam kết đảm bảo chất lượng 100% với quy trình tuyển chọn kỹ càng.
      </p>
      <button
        onClick={onRequireLogin}
        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-blue-200 transition-all hover:-translate-y-0.5"
      >
        Tìm gia sư ngay hôm nay
      </button>
    </div>
  </div>
);

export default HeroSection;
