import React from 'react';

const FooterSection = () => (
  <footer className="bg-[#1a1f2c] text-slate-400 py-16 px-4">
    <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
      <div>
        <h3 className="text-white font-bold text-xl mb-6">EduMatch</h3>
        <p className="text-slate-400 leading-relaxed">Nền tảng kết nối gia sư và học viên hàng đầu Việt Nam</p>
      </div>
      <div>
        <h3 className="text-white font-bold text-lg mb-6">Liên hệ</h3>
        <ul className="space-y-4">
          {['Về chúng tôi', 'Liên hệ', 'Tuyển dụng', 'Blog'].map(item => (
            <li key={item}><a href="#" className="hover:text-white transition-colors">{item}</a></li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-white font-bold text-lg mb-6">Hỗ trợ</h3>
        <ul className="space-y-4">
          {['Câu hỏi thường gặp', 'Chính sách bảo mật', 'Điều khoản sử dụng', 'Hướng dẫn sử dụng'].map(item => (
            <li key={item}><a href="#" className="hover:text-white transition-colors">{item}</a></li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="text-white font-bold text-lg mb-6">Theo dõi chúng tôi</h3>
        <ul className="space-y-4">
          {['Facebook', 'Instagram', 'YouTube', 'LinkedIn'].map(item => (
            <li key={item}><a href="#" className="hover:text-white transition-colors">{item}</a></li>
          ))}
        </ul>
      </div>
    </div>
  </footer>
);

export default FooterSection;
