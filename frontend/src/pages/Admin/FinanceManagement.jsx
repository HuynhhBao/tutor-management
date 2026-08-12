import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../services/apiClient';
import FinanceStatsCards from '../../components/admin/FinanceStatsCards';
import FinanceCharts from '../../components/admin/FinanceCharts';
import TransactionTable from '../../components/admin/TransactionTable';
import CommissionSettingsModal from '../../components/admin/CommissionSettingsModal';
import TutorPayoutManagement from '../../components/admin/TutorPayoutManagement';
import TutorEarningsTable from '../../components/admin/TutorEarningsTable';
import { DollarSign, Settings, RefreshCw, BarChart3, QrCode, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';

export default function FinanceManagement() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'payouts' | 'tutors'
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
  const [pendingPayoutCount, setPendingPayoutCount] = useState(0);

  // Poll pending payout requests count for badge
  const fetchPendingCount = useCallback(async () => {
    try {
      const res = await apiClient('/admin/finance/payout-requests?status=pending&page=1&limit=1');
      const json = await res.json();
      if (res.ok && json.status === 'ok') {
        setPendingPayoutCount(json.data.pagination.totalItems || 0);
      }
    } catch (e) {
      console.error('Error fetching pending payout count:', e);
    }
  }, []);

  useEffect(() => {
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 15000);
    return () => clearInterval(interval);
  }, [fetchPendingCount]);

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
                Quản Lý Tài Chính & Quyết Toán
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Theo dõi dòng tiền, doanh thu hoa hồng và xử lý giải ngân cho gia sư qua VietQR
              </p>
            </div>
          </div>
        </div>

        {/* Top Header Actions */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => {
              fetchStats(period);
              fetchTransactions(filters);
              fetchPendingCount();
              toast.success('Đã làm mới dữ liệu tài chính');
            }}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl shadow-xs transition-all"
            title="Làm mới tất cả"
          >
            <RefreshCw className={`w-4 h-4 ${(loadingStats || loadingTx) ? 'animate-spin text-indigo-600' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl shadow-xs transition-all border border-emerald-600"
          >
            <Settings className="w-4 h-4" />
            <span>Cấu Hình Hoa Hồng ({commissionRate}%)</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-px">
        <button type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 py-3 px-6 text-sm font-extrabold border-b-2 transition-all ${
            activeTab === 'overview'
              ? 'border-indigo-600 text-indigo-600 bg-indigo-50/40 rounded-t-2xl'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50 rounded-t-2xl'
          }`}
        >
          <BarChart3 className="w-4.5 h-4.5" />
          Thống Kê & Giao Dịch
        </button>

        <button type="button"
          onClick={() => setActiveTab('payouts')}
          className={`flex items-center gap-2 py-3 px-6 text-sm font-extrabold border-b-2 transition-all relative ${
            activeTab === 'payouts'
              ? 'border-emerald-600 text-emerald-600 bg-emerald-50/40 rounded-t-2xl'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50 rounded-t-2xl'
          }`}
        >
          <QrCode className="w-4.5 h-4.5" />
          <span>Duyệt Rút Tiền (VietQR)</span>
          {pendingPayoutCount > 0 && (
            <span className="px-2 py-0.5 bg-rose-500 text-white font-extrabold text-xs rounded-full shadow-xs animate-bounce">
              {pendingPayoutCount}
            </span>
          )}
        </button>

        <button type="button"
          onClick={() => setActiveTab('tutors')}
          className={`flex items-center gap-2 py-3 px-6 text-sm font-extrabold border-b-2 transition-all ${
            activeTab === 'tutors'
              ? 'border-blue-600 text-blue-600 bg-blue-50/40 rounded-t-2xl'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50/50 rounded-t-2xl'
          }`}
        >
          <Wallet className="w-4.5 h-4.5" />
          Ví Gia Sư & Ngân Hàng
        </button>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <FinanceStatsCards
            metrics={statsData.metrics}
            commissionRate={commissionRate}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />

          <FinanceCharts
            chartData={statsData.chartData}
            breakdown={statsData.breakdown}
            period={period}
            onPeriodChange={handlePeriodChange}
          />

          <TransactionTable
            transactions={transactionsData.transactions}
            pagination={transactionsData.pagination}
            filters={filters}
            onFilterChange={handleFilterChange}
            onPageChange={handlePageChange}
            onRefresh={() => fetchTransactions(filters)}
            loading={loadingTx}
          />
        </div>
      )}

      {/* Tab 2: Payout Requests with VietQR */}
      {activeTab === 'payouts' && (
        <TutorPayoutManagement onUpdate={() => { fetchStats(period); fetchPendingCount(); }} />
      )}

      {/* Tab 3: Tutors Wallet Balance Table */}
      {activeTab === 'tutors' && (
        <TutorEarningsTable />
      )}

      {/* Commission Settings Modal */}
      <CommissionSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentRate={commissionRate}
        onSave={handleSaveCommission}
      />
    </div>
  );
}
