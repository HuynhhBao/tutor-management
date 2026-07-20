import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../services/apiClient';
import FinanceStatsCards from '../../components/admin/FinanceStatsCards';
import FinanceCharts from '../../components/admin/FinanceCharts';
import TransactionTable from '../../components/admin/TransactionTable';
import CommissionSettingsModal from '../../components/admin/CommissionSettingsModal';
import { DollarSign, Settings, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FinanceManagement() {
  const [period, setPeriod] = useState('30d');
  const [statsData, setStatsData] = useState({
    metrics: { grossRevenue: 0, platformCommission: 0, totalTransactions: 0, totalUserBalance: 0 },
    chartData: [],
    breakdown: []
  });
  const [commissionRate, setCommissionRate] = useState(15);
  const [transactionsData, setTransactionsData] = useState({
    transactions: [],
    pagination: { page: 1, limit: 10, totalItems: 0, totalPages: 1 }
  });
  const [filters, setFilters] = useState({ search: '', type: 'all', page: 1 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTx, setLoadingTx] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // 1. Fetch Finance Stats & Charts Data
  const fetchStats = useCallback(async (selectedPeriod) => {
    try {
      setLoadingStats(true);
      const res = await apiClient(`/admin/finance/stats?period=${selectedPeriod}`);
      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        setStatsData(data.data);
        if (data.data.commissionRate) {
          setCommissionRate(data.data.commissionRate);
        }
      } else {
        toast.error(data.message || 'Không thể tải dữ liệu thống kê tài chính');
      }
    } catch (err) {
      console.error('Error fetching finance stats:', err);
      toast.error('Lỗi kết nối máy chủ tài chính');
    } finally {
      setLoadingStats(false);
    }
  }, []);

  // 2. Fetch Transactions List
  const fetchTransactions = useCallback(async (currentFilters) => {
    try {
      setLoadingTx(true);
      const queryParams = new URLSearchParams({
        page: currentFilters.page || 1,
        limit: 10,
        type: currentFilters.type || 'all',
        search: currentFilters.search || ''
      }).toString();

      const res = await apiClient(`/admin/finance/transactions?${queryParams}`);
      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        setTransactionsData(data.data);
      } else {
        toast.error(data.message || 'Không thể tải danh sách giao dịch');
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoadingTx(false);
    }
  }, []);

  // Initial Load & Period change
  useEffect(() => {
    fetchStats(period);
  }, [period, fetchStats]);

  useEffect(() => {
    fetchTransactions(filters);
  }, [filters, fetchTransactions]);

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const handleSaveCommission = async (newRate) => {
    const res = await apiClient('/admin/finance/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ commissionRate: newRate })
    });
    const data = await res.json();
    if (res.ok && data.status === 'ok') {
      setCommissionRate(newRate);
      fetchStats(period);
    } else {
      throw new Error(data.message || 'Lỗi khi cập nhật cấu hình');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-600 rounded-2xl shadow-sm text-white">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Quản Lý Tài Chính
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Theo dõi dòng tiền, doanh thu hoa hồng và lịch sử giao dịch toàn hệ thống EduMatch
              </p>
            </div>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              fetchStats(period);
              fetchTransactions(filters);
              toast.success('Đã làm mới dữ liệu tài chính');
            }}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl shadow-xs transition-all"
            title="Làm mới tất cả"
          >
            <RefreshCw className={`w-4 h-4 ${(loadingStats || loadingTx) ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all border border-emerald-600"
          >
            <Settings className="w-4 h-4" />
            <span>Cấu Hình Hoa Hồng ({commissionRate}%)</span>
          </button>
        </div>
      </div>

      {/* 1. Stat Cards Row */}
      <FinanceStatsCards
        metrics={statsData.metrics}
        commissionRate={commissionRate}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* 2. Charts Section (Area & Donut Charts) */}
      <FinanceCharts
        chartData={statsData.chartData}
        breakdown={statsData.breakdown}
        period={period}
        onPeriodChange={handlePeriodChange}
      />

      {/* 3. Transaction History Data Table */}
      <TransactionTable
        transactions={transactionsData.transactions}
        pagination={transactionsData.pagination}
        filters={filters}
        onFilterChange={handleFilterChange}
        onPageChange={handlePageChange}
        onRefresh={() => fetchTransactions(filters)}
        loading={loadingTx}
      />

      {/* 4. Commission Settings Modal */}
      <CommissionSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentRate={commissionRate}
        onSave={handleSaveCommission}
      />
    </div>
  );
}
