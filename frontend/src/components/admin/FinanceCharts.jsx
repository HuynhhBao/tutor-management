import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Layers, Activity } from 'lucide-react';

const formatVND = (value) => {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M đ';
  }
  if (value >= 1000) {
    return (value / 1000).toFixed(0) + 'k đ';
  }
  return value + ' đ';
};

const CustomAreaTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="bg-white border border-slate-200 p-3.5 rounded-xl shadow-xl text-xs space-y-2">
        <p className="text-slate-500 font-semibold border-b border-slate-100 pb-1">
          Thời gian: <span className="text-slate-900">{label}</span>
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between space-x-4">
            <span className="flex items-center text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 mr-2" />{' '}
              Tổng doanh thu:
            </span>
            <span className="font-bold text-indigo-700">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(payload[0]?.value || 0)}
            </span>
          </div>
          <div className="flex items-center justify-between space-x-4">
            <span className="flex items-center text-slate-600">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2" />{' '}
              Hoa hồng hệ thống:
            </span>
            <span className="font-bold text-emerald-700">
              {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(payload[1]?.value || 0)}
            </span>
          </div>
          {payload[0]?.payload?.count !== undefined && (
            <div className="flex items-center justify-between space-x-4 pt-1 border-t border-slate-100 text-slate-500">
              <span>Số giao dịch:</span>
              <span className="font-semibold text-slate-800">{payload[0]?.payload?.count} GD</span>
            </div>
          )}
        </div>
      </div>
    );
  }
  return null;
};

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload?.length) {
    const data = payload[0];
    return (
      <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-xl text-xs space-y-1">
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.payload.color }} />
          <span className="font-bold text-slate-900">{data.name}</span>
        </div>
        <p className="text-slate-600">
          Tổng tiền: <span className="font-bold text-emerald-600">
            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(data.payload.totalAmount)}
          </span>
        </p>
        <p className="text-slate-500">
          Số lượng: <span className="font-semibold text-slate-900">{data.value} giao dịch</span>
        </p>
      </div>
    );
  }
  return null;
};

export default function FinanceCharts({ chartData = [], breakdown = [], period = '30d', onPeriodChange }) {
  const totalBreakdownCount = breakdown.reduce((acc, cur) => acc + (cur.count || 0), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Area Spline Chart (2 cols wide) */}
      <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm relative overflow-hidden flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 mb-4 gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Biểu Đồ Xu Hướng Doanh Thu & Hoa Hồng
              </h3>
              <p className="text-xs text-slate-500">
                So sánh Tổng doanh thu nạp tiền/thanh toán với Hoa hồng nền tảng thực nhận
              </p>
            </div>
          </div>

          {/* Time Filter Switcher Buttons */}
          <div className="inline-flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-medium self-start sm:self-auto">
            <button
              type="button"
              onClick={() => onPeriodChange('7d')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                period === '7d'
                  ? 'bg-white text-indigo-700 font-bold shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              7 ngày
            </button>
            <button
              type="button"
              onClick={() => onPeriodChange('30d')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                period === '30d'
                  ? 'bg-white text-indigo-700 font-bold shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              30 ngày
            </button>
            <button
              type="button"
              onClick={() => onPeriodChange('12m')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                period === '12m'
                  ? 'bg-white text-indigo-700 font-bold shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              12 tháng
            </button>
          </div>
        </div>

        {/* Recharts Area Chart Container */}
        <div className="h-72 w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis 
                dataKey="label" 
                stroke="#64748b" 
                tickLine={false} 
                axisLine={false}
                tick={{ fontSize: 11 }}
              />
              <YAxis 
                stroke="#64748b" 
                tickLine={false} 
                axisLine={false}
                tickFormatter={formatVND}
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={<CustomAreaTooltip />} />
              <Area
                type="monotone"
                dataKey="grossRevenue"
                name="Tổng doanh thu"
                stroke="#4f46e5"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorGross)"
              />
              <Area
                type="monotone"
                dataKey="commission"
                name="Hoa hồng hệ thống"
                stroke="#10b981"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorCommission)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Footer Legend indicator */}
        <div className="flex items-center justify-center space-x-6 pt-3 mt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-indigo-600 shadow-xs" />
            <span className="text-slate-700 font-semibold">Tổng Doanh Thu</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-xs" />
            <span className="text-slate-700 font-semibold">Hoa Hồng Nền Tảng (Net)</span>
          </div>
        </div>
      </div>

      {/* Donut Chart (1 col wide) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between relative">
        <div className="flex items-center space-x-3 pb-4 border-b border-slate-100">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl border border-purple-100">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Phân Bổ Loại Giao Dịch
            </h3>
            <p className="text-xs text-slate-500">Tỷ lệ cơ cấu dòng tiền phát sinh</p>
          </div>
        </div>

        {/* Recharts Pie Donut */}
        <div className="h-64 w-full relative flex items-center justify-center my-2">
          {breakdown && breakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={breakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {breakdown.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-slate-400 text-xs">Chưa có dữ liệu phân bổ</div>
          )}

          {/* Center text in Donut */}
          <div className="absolute flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-black text-slate-900">{totalBreakdownCount}</span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Giao dịch</span>
          </div>
        </div>

        {/* Custom Legend items list */}
        <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
          {breakdown.map((item) => {
            const percent = totalBreakdownCount > 0 ? Math.round((item.count / totalBreakdownCount) * 100) : 0;
            return (
              <div key={item.name} className="flex items-center justify-between text-slate-700">
                <div className="flex items-center space-x-2 truncate">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate font-medium">{item.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900">{item.count}</span>
                  <span className="text-slate-400 text-[11px] w-9 text-right font-medium">({percent}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
