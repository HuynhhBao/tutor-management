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
  Sparkles,
  X,
  Calendar,
  GraduationCap,
  BookOpen
} from 'lucide-react';
import apiClient from '../../services/apiClient';
import { getAvatarUrl } from '../../utils/avatar';

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState(0);
  const [activeTutors, setActiveTutors] = useState(0);
  const [totalHours, setTotalHours] = useState(0);
  const [showBanner, setShowBanner] = useState(true);
  const [recentMessages, setRecentMessages] = useState([]);
  const [recommendedTutors, setRecommendedTutors] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch balance
        const resWallet = await apiClient('/wallet');
        if (resWallet.ok) {
          const dataWallet = await resWallet.json();
          setBalance(dataWallet.data?.balance || 0);
        }

        // Fetch bookings
        const resBookings = await apiClient('/student/bookings');
        if (resBookings.ok) {
          const dataBookings = await resBookings.json();
          const bookings = dataBookings.data || [];
          // Gia sư đang thuê: Các lịch đã được xác nhận và đang chờ dạy/đang dạy
          const confirmedBookings = bookings.filter((b) => b.status === 'confirmed');
          setActiveTutors(confirmedBookings.length);

          // Giờ học đã thực hiện: Chỉ tính các lịch đã dạy xong (trạng thái completed)
          const completedBookings = dataBookings.data.filter((b) => b.status === 'completed');
          setTotalHours(completedBookings.length * 2);
        }

        // Fetch conversations
        try {
          const resChat = await apiClient('/chat/conversations');
          if (resChat.ok) {
            const dataChat = await resChat.json();
            setRecentMessages(dataChat.data?.slice(0, 3) || []);
          }
        } catch (err) {
          console.error('Lỗi khi lấy danh sách tin nhắn:', err);
        }

        // Fetch recommended tutors
        try {
          const resTutors = await apiClient('/tutors/recommendations');
          if (resTutors.ok) {
            const dataTutors = await resTutors.json();
            setRecommendedTutors(dataTutors.data || []);
          }
        } catch (err) {
          console.error('Lỗi khi lấy danh sách gia sư gợi ý:', err);
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
      title: 'Trợ Lý AI Tìm Gia Sư', 
      desc: 'Gợi ý gia sư thông minh bằng AI Gemini Vector Embedding.',
      icon: Sparkles,
      path: '/student-dashboard/search',
      color: 'bg-indigo-600'
    },
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
            type="button"
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
                type="button"
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
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
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
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.title}
                type="button"
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

      {/* Recent Activity and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Tin nhắn mới nhất
          </h3>
          
          {recentMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
              <p>Không có tin nhắn mới</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentMessages.map((msg, idx) => {
                const partnerId = msg.id || msg.partner_id;
                const partnerName = msg.full_name || msg.partner_name || 'Người dùng';
                return (
                  <button 
                    key={partnerId || idx} 
                    type="button"
                    onClick={() => navigate(`/student-dashboard/chat/${partnerId}`)} 
                    className="w-full text-left flex items-center gap-4 p-3 hover:bg-slate-50 rounded-xl cursor-pointer border border-transparent hover:border-slate-100 transition-all"
                  >
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex flex-shrink-0 items-center justify-center text-blue-600 font-bold overflow-hidden border border-blue-200">
                      <img 
                        src={getAvatarUrl(msg.avatar_url, partnerName, msg.partner_type || 'user')} 
                        alt={partnerName} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h4 className="font-bold text-slate-900 truncate">{partnerName}</h4>
                      <p className="text-sm text-slate-500 truncate">{msg.last_message}</p>
                    </div>
                    <div className="text-xs text-slate-400 whitespace-nowrap">
                      {msg.last_message_time ? new Date(msg.last_message_time).toLocaleDateString('vi-VN') : ''}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500" />
              Gợi ý gia sư cho bạn
            </h3>
            <button type="button" onClick={() => navigate('/student-dashboard/search')} className="text-sm font-bold text-blue-600 hover:underline">
              Xem tất cả
            </button>
          </div>

          {recommendedTutors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Search className="w-12 h-12 mb-4 opacity-20" />
              <p>Khám phá gia sư để nhận gợi ý</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recommendedTutors.map((tutor, idx) => {
                const subjects = tutor.subjects
                  ? tutor.subjects.split(',').map(s => s.trim()).filter(Boolean)
                  : [];
                const displayRating = tutor.rating && Number(tutor.rating) > 0 
                  ? Number(tutor.rating).toFixed(2) 
                  : '0.00';

                return (
                  <div
                    role="button"
                    tabIndex={0}
                    key={tutor.id || tutor.user_id || tutor.email || idx} 
                    onClick={() => navigate('/student-dashboard/search')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate('/student-dashboard/search');
                      }
                    }}
                    className="w-full text-left flex flex-col gap-4 p-5 border border-slate-200/80 rounded-2xl bg-white hover:border-blue-300 hover:shadow-lg transition-all duration-200 cursor-pointer group shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {/* Avatar + Tên + Rating + Nút Xem hồ sơ */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="w-14 h-14 rounded-full flex flex-shrink-0 items-center justify-center overflow-hidden border border-slate-200 shadow-xs bg-indigo-50">
                          <img 
                            src={getAvatarUrl(tutor.avatar_url, tutor.full_name, 'tutor')} 
                            alt={tutor.full_name || 'Gia sư'} 
                            className="w-full h-full object-cover" 
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors truncate">
                            {tutor.full_name}
                          </h4>
                          <div className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-0.5 bg-amber-50 text-amber-700 font-extrabold text-xs border border-amber-200/80 rounded-lg shadow-2xs">
                            <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                            {displayRating}
                          </div>
                        </div>
                      </div>
                      <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); navigate('/student-dashboard/search'); }} 
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm active:scale-95 whitespace-nowrap flex-shrink-0"
                      >
                        Xem hồ sơ
                      </button>
                    </div>

                    {/* Thông tin Tuổi - Giới tính - Bằng cấp */}
                    <div className="grid grid-cols-2 gap-2 text-sm pt-2 text-slate-600 font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span>{tutor.age ? `${tutor.age} tuổi` : '—'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span>{tutor.gender || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2 col-span-2 mt-1">
                        <GraduationCap className="w-4 h-4 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{tutor.qualification || 'Chuyên viên giảng dạy'}</span>
                      </div>
                    </div>

                    {/* Môn dạy & Khối lớp */}
                    <div className="flex flex-col gap-2 pt-1 border-t border-slate-100">
                      {subjects.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap pt-1">
                          <BookOpen className="w-4 h-4 text-slate-400 flex-shrink-0" />
                          {subjects.map(sub => (
                            <span
                              key={sub}
                              className="px-3 py-1 bg-blue-50/90 text-blue-600 text-xs font-bold rounded-xl border border-blue-100 shadow-2xs"
                            >
                              {sub}
                            </span>
                          ))}
                        </div>
                      )}
                      {tutor.grade_levels && (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs text-amber-800 font-bold bg-amber-50 border border-amber-200/80 px-3 py-1 rounded-xl shadow-2xs flex items-center gap-1">
                            Nhận dạy: {tutor.grade_levels}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
