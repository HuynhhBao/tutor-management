import React from 'react';
import { Clock, Users, Award, Heart } from 'lucide-react';

const features = [
  { icon: Clock, title: 'Khóa học mọi giờ, mọi nơi', desc: 'Học linh hoạt theo lịch của bạn' },
  { icon: Users, title: 'Tiêu chuẩn 1-1', desc: 'Sự tập trung hoàn toàn vào bạn' },
  { icon: Award, title: 'Công nghệ hiện đại', desc: 'Phòng học online tương tác cao' },
  { icon: Heart, title: 'An toàn và tiết kiệm', desc: 'Học tại nhà, tiết kiệm chi phí' },
];

const FeaturesSection = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 -mt-20 md:-mt-24 relative z-10">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {features.map(({ icon: Icon, title, desc }) => (
        <div key={title} className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center hover:shadow-md transition-shadow">
          <div className="h-16 w-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Icon className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="font-bold text-lg text-slate-900 mb-2">{title}</h3>
          <p className="text-slate-500 text-sm">{desc}</p>
        </div>
      ))}
    </div>
  </div>
);

export default FeaturesSection;
