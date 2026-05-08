import React from 'react';
import { Users, GraduationCap, CheckCircle2 } from 'lucide-react';

const TargetAudienceSection = ({ onRequireLogin, onApplyTutor }) => (
  <div className="bg-slate-100 py-20 px-4">
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">Phù hợp với học viên nào?</h2>
        <p className="text-slate-500">Dù bạn là học sinh, sinh viên hay người đi làm, chúng tôi đều có giải pháp phù hợp</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Card Học Viên */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col items-center text-center hover:shadow-md transition-shadow">
          <div className="h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
            <Users className="h-10 w-10 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-6">Dành cho Học Viên</h3>
          <ul className="text-left space-y-4 mb-8 text-slate-600 w-full px-4">
            {['Lựa chọn gia sư phù hợp với nhu cầu', 'Học 1-1 với giáo viên chuyên môn cao', 'Theo dõi tiến độ học tập chi tiết'].map(item => (
              <li key={item} className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <button onClick={onRequireLogin} className="mt-auto w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold shadow-sm transition-all hover:-translate-y-0.5">
            Tìm gia sư ngay
          </button>
        </div>

        {/* Card Gia Sư */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col items-center text-center hover:shadow-md transition-shadow">
          <div className="h-20 w-20 bg-blue-50 rounded-full flex items-center justify-center mb-6">
            <GraduationCap className="h-10 w-10 text-blue-600" />
          </div>
          <h3 className="text-2xl font-bold text-slate-900 mb-6">Dành cho Gia Sư</h3>
          <ul className="text-left space-y-4 mb-8 text-slate-600 w-full px-4">
            {['Tăng thu nhập với lịch dạy linh hoạt', 'Kết nối với hàng nghìn học viên tiềm năng', 'Công cụ quản lý lớp học hiện đại'].map(item => (
              <li key={item} className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <button onClick={onApplyTutor} className="mt-auto w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-bold shadow-sm transition-all hover:-translate-y-0.5">
            Đăng ký làm gia sư
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default TargetAudienceSection;
