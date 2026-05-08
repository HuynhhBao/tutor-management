import React from 'react';
import { GraduationCap } from 'lucide-react';

const CTASection = ({ onRequireLogin }) => (
  <section className="bg-blue-600 text-white py-20 px-4 text-center">
    <div className="max-w-4xl mx-auto flex flex-col items-center">
      <GraduationCap className="h-16 w-16 mb-6 opacity-90" />
      <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
        Học tại nhà – Không giới hạn – Hiệu quả vô đối sau 2 tuần!
      </h2>
      <p className="text-blue-100 text-lg md:text-xl mb-10">
        Bắt đầu hành trình học tập của bạn ngay hôm nay
      </p>
      <button
        onClick={onRequireLogin}
        className="bg-white text-blue-600 hover:bg-slate-100 px-8 py-4 rounded-lg font-bold text-lg shadow-lg transition-colors"
      >
        Đăng ký học ngay – Miễn phí buổi đầu
      </button>
    </div>
  </section>
);

export default CTASection;
