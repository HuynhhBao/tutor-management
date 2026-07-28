import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../../services/apiClient';
import toast from 'react-hot-toast';
import { Search, Loader2, Wallet, Building2, CreditCard, User, ArrowUpDown, ExternalLink } from 'lucide-react';
import { getAvatarUrl } from '../../utils/avatar';

export default function TutorEarningsTable() {
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTutors = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient(`/admin/finance/tutor-earnings?search=${search}&page=${page}&limit=10`);
      const json = await res.json();
      if (res.ok && json.status === 'ok') {
        setTutors(json.data.tutors || []);
        setTotalPages(json.data.pagination.totalPages || 1);
      } else {
        toast.error(json.message || 'Không thể tải dữ liệu ví gia sư');
      }
    } catch (err) {
      toast.error('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTutors();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchTutors]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Search & Header bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tên gia sư, email hoặc STK..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all"
          />
        </div>
        <div className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
          <Wallet className="w-4 h-4 text-emerald-600" />
          Danh sách sắp xếp ưu tiên theo Gia sư có Số dư Ví cao nhất
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-20 flex justify-center items-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : tutors.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
          <Wallet className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-700">Không tìm thấy gia sư nào</p>
          <p className="text-xs text-slate-400 mt-1">Thử thay đổi từ khóa tìm kiếm của bạn</p>
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200 text-sm font-medium text-gray-500">
                  <th className="py-3.5 px-6 font-medium">Gia sư</th>
                  <th className="py-3.5 px-6 font-medium">Số dư ví khả dụng</th>
                  <th className="py-3.5 px-6 font-medium">Tài khoản Ngân hàng VNĐ</th>
                  <th className="py-3.5 px-6 text-right font-medium">Ngày tham gia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {tutors.map((t) => {
                  const avatarSrc = getAvatarUrl(t.avatar_url, t.full_name, 'tutor');
                  return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3.5">
                          <img src={avatarSrc} alt="Avatar" className="w-11 h-11 rounded-2xl object-cover border border-slate-200 shadow-xs" />
                          <div>
                            <p className="font-bold text-slate-900">{t.full_name}</p>
                            <p className="text-xs text-slate-400">{t.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-extrabold ${
                          t.balance >= 200000 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : t.balance > 0 ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {t.balance.toLocaleString('vi-VN')} đ
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {t.bank_account_number && t.bank_name ? (
                          <div className="space-y-0.5">
                            <p className="font-bold text-slate-800 text-xs">
                              {t.bank_name} - <span className="text-indigo-600 font-extrabold tracking-wide">{t.bank_account_number}</span>
                            </p>
                            <p className="text-[11px] text-slate-400 font-bold uppercase">{t.bank_account_holder}</p>
                          </div>
                        ) : (
                          <span className="text-xs font-medium text-slate-400 italic">Chưa liên kết TK Ngân hàng</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right text-xs text-slate-500 font-medium">
                        {new Date(t.created_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-2">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 disabled:opacity-40"
          >
            Trước
          </button>
          <span className="text-xs font-bold text-slate-600 px-2">
            Trang {page} / {totalPages}
          </span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 disabled:opacity-40"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
}
