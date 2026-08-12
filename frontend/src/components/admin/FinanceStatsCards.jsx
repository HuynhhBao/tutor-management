import React from 'react';
import { TrendingUp, DollarSign, CreditCard, Wallet, Percent } from 'lucide-react';

const formatVND = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
};

export default function FinanceStatsCards({ metrics, commissionRate, onOpenSettings }) {
  const cards = [
    {
      title: 'TỔNG DOANH THU HỆ THỐNG',
      value: formatVND(metrics?.grossRevenue),
      subtext: '+12.5% so với kỳ trước',
      icon: DollarSign,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      sparklineColor: '#3b82f6',
      sparklinePoints: '0,25 15,20 30,28 45,15 60,22 75,10 90,18 100,5'
    },
    {
      title: 'HOA HỒNG NỀN TẢNG HƯỞNG',
      value: formatVND(metrics?.platformCommission),
      subtext: `Đang áp dụng ${commissionRate}% hoa hồng`,
      icon: Percent,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      sparklineColor: '#10b981',
      sparklinePoints: '0,28 15,22 30,25 45,18 60,12 75,15 90,8 100,3',
      action: {
        label: 'Đổi %',
        onClick: onOpenSettings
      }
    },
    {
      title: 'TỔNG SỐ GIAO DỊCH',
      value: (metrics?.totalTransactions || 0).toLocaleString('vi-VN') + ' giao dịch',
      subtext: '+8.3% tỷ lệ hoàn tất',
      icon: CreditCard,
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
      sparklineColor: '#f59e0b',
      sparklinePoints: '0,20 15,25 30,15 45,22 60,18 75,10 90,12 100,6'
    },
    {
      title: 'SỐ DƯ VÍ KHẢ DỤNG',
      value: formatVND(metrics?.totalUserBalance),
      subtext: 'Tổng số dư học viên lưu giữ',
      icon: Wallet,
      iconBg: 'bg-purple-50 text-purple-600 border-purple-100',
      badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
      sparklineColor: '#8b5cf6',
      sparklinePoints: '0,22 15,18 30,24 45,16 60,20 75,12 90,8 100,4'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div 
            key={card.title} 
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-200 relative overflow-hidden group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
                {card.title}
              </span>
              <div className="flex items-center space-x-2">
                {card.action && (
                  <button
                    type="button"
                    onClick={card.action.onClick}
                    className="text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-semibold px-2 py-0.5 rounded border border-emerald-300 transition-colors"
                  >
                    {card.action.label}
                  </button>
                )}
                <div className={`p-2.5 rounded-xl border ${card.iconBg} shadow-xs`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="flex items-baseline justify-between mt-1">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {card.value}
                </h3>
                <div className="flex items-center space-x-1.5 mt-2">
                  <span className={`inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border ${card.badgeBg}`}>
                    <TrendingUp className="w-3 h-3 mr-1" />
                    {card.subtext}
                  </span>
                </div>
              </div>

              {/* Mini Sparkline SVG visual */}
              <div className="w-16 h-10 opacity-80 group-hover:opacity-100 transition-opacity">
                <svg className="w-full h-full" viewBox="0 0 100 30" fill="none">
                  <polyline
                    fill="none"
                    stroke={card.sparklineColor}
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={card.sparklinePoints}
                  />
                </svg>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
