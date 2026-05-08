import React from 'react';
import { CheckCircle2 } from 'lucide-react';

const ComparisonTable = () => (
  <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
    <h2 className="text-3xl font-bold text-center text-slate-900 mb-10">So sánh ưu thế vượt trội</h2>
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-blue-600 text-white text-center">
            <th className="py-4 px-6 font-semibold text-left w-1/3 border-r border-blue-500">Tiêu chí</th>
            <th className="py-4 px-6 font-semibold w-1/3 border-r border-blue-500">Gia sư online</th>
            <th className="py-4 px-6 font-semibold w-1/3">Trung tâm truyền thống</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          <tr>
            <td className="py-5 px-6 font-medium text-slate-700">Chi phí</td>
            <td className="py-5 px-6 text-center bg-blue-50/30">
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">Từ 100k/buổi</span>
            </td>
            <td className="py-5 px-6 text-center text-slate-500">Từ 300k/buổi</td>
          </tr>
          <tr className="bg-slate-100/50">
            <td className="py-5 px-6 font-medium text-slate-700">Thời gian di chuyển</td>
            <td className="py-5 px-6 text-center bg-blue-100/30 flex flex-col items-center">
              <CheckCircle2 className="h-6 w-6 text-green-500 mb-1" />
              <span className="text-sm font-medium">0 phút</span>
            </td>
            <td className="py-5 px-6 text-center text-slate-500">30-60 phút</td>
          </tr>
          <tr>
            <td className="py-5 px-6 font-medium text-slate-700">Tỷ lệ gia sư : học sinh</td>
            <td className="py-5 px-6 text-center bg-blue-100/30 flex flex-col items-center">
              <CheckCircle2 className="h-6 w-6 text-green-500 mb-1" />
              <span className="text-sm font-medium">1:1</span>
            </td>
            <td className="py-5 px-6 text-center text-slate-500">1:5 - 1:20</td>
          </tr>
          <tr className="bg-slate-100/50">
            <td className="py-5 px-6 font-medium text-slate-700">Theo dõi kết quả</td>
            <td className="py-5 px-6 text-center bg-blue-100/30 flex flex-col items-center">
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </td>
            <td className="py-5 px-6 text-center text-slate-500">Hạn chế</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

export default ComparisonTable;
