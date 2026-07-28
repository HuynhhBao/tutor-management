import React from 'react';
import { useAlert } from '../../context/AlertContext';
import { 
  Search, 
  Download, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';

const formatVND = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
};

const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  return d.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function TransactionTable({
  transactions = [],
  pagination = {},
  filters = {},
  onFilterChange,
  onPageChange,
  onRefresh,
  loading = false
}) {
  const { showAlert } = useAlert();
  // Export CSV function
  const exportToCSV = () => {
    if (!transactions || transactions.length === 0) {
      showAlert('Không có dữ liệu để xuất file CSV!');
      return;
    }

    const headers = ['Mã GD', 'Người thực hiện', 'Vai trò', 'Email', 'Loại giao dịch', 'Số tiền (VND)', 'Mô tả', 'Thời gian'];
    const rows = transactions.map(tx => [
      `"#${tx.id}"`,
      `"${tx.user_name || ''}"`,
      `"${tx.user_type === 'tutor' ? 'Gia sư' : 'Học viên'}"`,
      `"${tx.user_email || ''}"`,
      `"${tx.type}"`,
      tx.amount,
      `"${(tx.description || '').replace(/"/g, '""')}"`,
      `"${formatDate(tx.created_at)}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Bao_Cao_Tai_Chinh_EduMatch_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case 'deposit':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <ArrowDownLeft className="w-3.5 h-3.5 mr-1" /> Nạp tiền
          </span>
        );
      case 'booking_payment':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Thanh toán lớp
          </span>
        );
      case 'tutor_payout':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <ArrowUpRight className="w-3.5 h-3.5 mr-1" /> Chuyển cho Gia sư
          </span>
        );
      case 'refund':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Hoàn tiền
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-5">
      {/* Header & Filter Controls Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center">
            Lịch Sử Giao Dịch
            {loading && <RefreshCw className="w-4 h-4 ml-2 animate-spin text-indigo-600" />}
          </h3>
          <p className="text-xs text-slate-500">
            Tra cứu và đối soát chi tiết dòng tiền trong toàn hệ thống
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Box */}
          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm tên, email, mô tả..."
              value={filters.search || ''}
              onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Type Filter Select */}
          <div className="relative">
            <select
              value={filters.type || 'all'}
              onChange={(e) => onFilterChange({ type: e.target.value, page: 1 })}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors cursor-pointer"
            >
              <option value="all">Tất cả loại GD</option>
              <option value="deposit">Nạp tiền</option>
              <option value="booking_payment">Thanh toán thuê Gia sư</option>
              <option value="tutor_payout">Chuyển tiền cho Gia sư</option>
              <option value="refund">Hoàn tiền</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={onRefresh}
            className="p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl transition-colors"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* CSV Export Button */}
          <button
            type="button"
            onClick={exportToCSV}
            className="flex items-center space-x-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl shadow-xs transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Xuất CSV</span>
          </button>
        </div>
      </div>

      {/* Transactions Data Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-gray-500 text-sm font-medium border-b border-gray-200">
              <th className="py-3.5 px-4 font-medium">Mã GD</th>
              <th className="py-3.5 px-4 font-medium">Người thực hiện</th>
              <th className="py-3.5 px-4 font-medium">Loại giao dịch</th>
              <th className="py-3.5 px-4 font-medium text-right">Số tiền</th>
              <th className="py-3.5 px-4 font-medium">Nội dung / Mô tả</th>
              <th className="py-3.5 px-4 font-medium">Thời gian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {transactions && transactions.length > 0 ? (
              transactions.map((tx) => {
                const isPositive = tx.type === 'deposit' || tx.type === 'booking_payment';
                const avatar = tx.user_avatar;
                const isTutor = tx.user_type === 'tutor';

                return (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                      #{tx.id}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center overflow-hidden flex-shrink-0 text-slate-600 font-bold text-xs uppercase">
                          {avatar ? (
                            <img src={avatar} alt="" className="w-full h-full object-cover" />
                          ) : (
                            tx.user_name?.charAt(0) || 'U'
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <div className="flex items-center space-x-1.5">
                            <p className="font-semibold text-slate-900 truncate max-w-[140px]">
                              {tx.user_name}
                            </p>
                            <span className={`px-1.5 py-0.2 text-[10px] font-semibold rounded ${
                              isTutor 
                                ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                                : 'bg-blue-50 text-blue-700 border border-blue-200'
                            }`}>
                              {isTutor ? 'Gia sư' : 'Học viên'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate max-w-[140px]">
                            {tx.user_email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {getTypeBadge(tx.type)}
                    </td>
                    <td className={`py-3.5 px-4 text-right font-extrabold font-mono text-sm ${
                      isPositive ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {isPositive ? '+' : '-'}{formatVND(tx.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-xs truncate font-medium" title={tx.description}>
                      {tx.description || 'Không có ghi chú'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px] whitespace-nowrap font-medium">
                      {formatDate(tx.created_at)}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="py-8 text-center text-slate-500 text-xs">
                  Chưa tìm thấy giao dịch nào phù hợp
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
          <span>
            Hiển thị trang <strong className="text-slate-900">{pagination.page}</strong> / {pagination.totalPages} ({pagination.totalItems} kết quả)
          </span>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange(pagination.page + 1)}
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
