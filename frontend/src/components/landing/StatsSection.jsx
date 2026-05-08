import React from 'react';

const stats = [
  { value: '10,000+', label: 'Gia sư uy tín' },
  { value: '50,000+', label: 'Học viên tham gia' },
  { value: '4.8/5', label: 'Đánh giá trung bình' },
];

const StatsSection = () => (
  <div className="bg-white text-center py-16 border-t border-slate-100">
    <div className="max-w-5xl mx-auto px-4">
      <h2 className="text-3xl font-bold text-slate-900 mb-12">
        Hơn <span className="text-blue-600">50,000+</span> người dùng tin tưởng
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map(({ value, label }) => (
          <div key={label}>
            <div className="text-5xl font-extrabold text-blue-600 mb-3">{value}</div>
            <div className="text-slate-600 font-medium">{label}</div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

export default StatsSection;
