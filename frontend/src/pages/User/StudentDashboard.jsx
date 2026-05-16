import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  Search, 
  History, 
  Wallet, 
  MessageSquare, 
  User, 
  Star, 
  Clock, 
  TrendingUp, 
  ArrowRight,
  ShieldCheck,
  X
} from 'lucide-react';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [activeTutors, setActiveTutors] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch balance
        const resWallet = await fetch('http://localhost:3001/api/wallet', { credentials: 'include' });
        const dataWallet = await resWallet.json();
        if (dataWallet.status === 'ok') {
          setBalance(dataWallet.data.balance || 0);
        }

        // Fetch bookings
        const resBookings = await fetch('http://localhost:3001/api/student/bookings', { credentials: 'include' });
        const dataBookings = await resBookings.json();
        if (dataBookings.status === 'ok' && Array.isArray(dataBookings.data)) {
          // Gia sư đang thuê: Các lịch đã được xác nhận và đang chờ dạy/đang dạy
          const confirmedBookings = dataBookings.data.filter((b) => b.status === 'confirmed');
          setActiveTutors(confirmedBookings.length);

          // Giờ học đã thực hiện: Chỉ tính các lịch đã dạy xong (trạng thái completed)
          const completedBookings = dataBookings.data.filter((b) => b.status === 'completed');
          setTotalHours(completedBookings.length * 2);
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      }
    };
    fetchData();
  }, []);

  const stats = [
    { label: 'Số dư hiện tại', value: `${parseFloat(balance).toLocaleString('vi-VN')} đ`, icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Gia sư đang thuê', value: `${activeTutors}`, icon: Star, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Giờ học đã thực hiện', value: `${totalHours}h`, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  const quickActions = [
    { 
      title: 'Hồ sơ cá nhân', 
      desc: 'Cập nhật thông tin cá nhân và quản lý tài khoản.',
      icon: User,
      path: '/student-dashboard/profile',
      color: 'bg-amber-600'
    },
    { 
      title: 'Tìm kiếm Gia sư', 
      desc: 'Tìm kiếm và kết nối với gia sư phù hợp với nhu cầu của bạn.',
      icon: Search,
      path: '/student-dashboard/search',
      color: 'bg-blue-600'
    },
    { 
      title: 'Lịch sử thuê', 
      desc: 'Xem danh sách các gia sư bạn đã từng hoặc đang thuê.',
      icon: History,
      path: '/student-dashboard/history',
      color: 'bg-blue-600'
    },
    { 
      title: 'Ví tiền & Nạp tiền', 
      desc: 'Quản lý số dư và thực hiện nạp tiền vào tài khoản.',
      icon: Wallet,
      path: '/student-dashboard/wallet',
      color: 'bg-emerald-600'
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Header Banner */}
      {showBanner && (
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm overflow-hidden relative animate-in fade-in zoom-in-95 duration-300">
          <button 
            onClick={() => setShowBanner(false)}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors z-20"
            title="Đóng thông báo"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="relative z-10 pr-8">
            <h1 className="text-3xl font-bold text-slate-900">
              Chào mừng trở lại, {user?.fullName || user?.username}! 👋
            </h1>
            <p className="mt-2 text-slate-600 max-w-2xl">
              Hôm nay bạn muốn học gì? Khám phá hàng ngàn gia sư chất lượng và bắt đầu hành trình chinh phục tri thức của bạn.
            </p>
            <div className="mt-6 flex flex-wrap gap-4">
              <button 
                onClick={() => navigate('/student-dashboard/search')}
                className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-lg shadow-blue-200"
              >
                Bắt đầu tìm gia sư
                <ArrowRight className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2 text-sm text-slate-500 px-4 py-2 bg-slate-100 rounded-xl border border-slate-100">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Giao dịch an toàn & minh bạch
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100 rounded-full -mr-20 -mt-20 z-0 opacity-50" />
          <div className="absolute bottom-0 right-32 w-24 h-24 bg-blue-50 rounded-full z-0 opacity-50" />
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className={`p-4 rounded-xl ${stat.bg}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Thao tác nhanh
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, idx) => {
            const Icon = action.icon;
            return (
              <button
                key={idx}
                onClick={() => navigate(action.path)}
                className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all text-left flex flex-col"
              >
                <div className={`w-12 h-12 rounded-xl ${action.color} text-white flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{action.title}</h3>
                <p className="text-sm text-slate-500 flex-1 leading-relaxed">
                  {action.desc}
                </p>
                <div className="mt-4 flex items-center text-blue-600 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  Xem ngay
                  <ArrowRight className="w-4 h-4 ml-1" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Placeholder for Recent Activity or Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Tin nhắn mới nhất
          </h3>
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
            <p>Không có tin nhắn mới</p>
          </div>
        </div>
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Gợi ý gia sư cho bạn
          </h3>
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Search className="w-12 h-12 mb-4 opacity-20" />
            <p>Khám phá gia sư để nhận gợi ý</p>
            <button 
              onClick={() => navigate('/student-dashboard/search')}
              className="mt-4 text-blue-600 font-bold hover:underline"
            >
              Tìm kiếm ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
