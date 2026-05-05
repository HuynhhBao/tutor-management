import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, CheckCircle2, Search, BookOpen, Clock, Users, Award, Heart, Monitor, BookMarked, Code, LogOut, User, ChevronDown, Upload, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import UserAccountMenu from '../components/UserAccountMenu';
import { useState } from 'react';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyEmail, setApplyEmail] = useState('');
  const [applyCvFile, setApplyCvFile] = useState(null);
  const [applyStatus, setApplyStatus] = useState({ loading: false, error: '', success: false });

  // OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [cvPreviewUrl, setCvPreviewUrl] = useState(null);

  const resetApplyModal = () => {
    setApplyEmail('');
    setApplyCvFile(null);
    setCvPreviewUrl(null);
    setOtpSent(false);
    setOtpVerified(false);
    setOtpValue('');
    setOtpError('');
    setApplyStatus({ loading: false, error: '', success: false });
  };

  const handleSendOtp = async () => {
    if (!applyEmail.endsWith('@gmail.com')) {
      setOtpError('Chỉ chấp nhận email @gmail.com');
      return;
    }
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await fetch('http://localhost:3001/api/tutors/apply/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: applyEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
      } else {
        setOtpError(data.message || 'Không thể gửi mã');
      }
    } catch {
      setOtpError('Không thể kết nối đến server');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = () => {
    if (otpValue.length === 6) {
      setOtpVerified(true);
      setOtpError('');
    } else {
      setOtpError('Vui lòng nhập đủ 6 số');
    }
  };

  const handleCvChange = (file) => {
    if (!file) return;
    setApplyCvFile(file);
    const url = URL.createObjectURL(file);
    setCvPreviewUrl(url);
  };

  const handleRemoveCv = () => {
    setApplyCvFile(null);
    if (cvPreviewUrl) URL.revokeObjectURL(cvPreviewUrl);
    setCvPreviewUrl(null);
    document.getElementById('cv-upload').value = '';
  };

  const handleApplySubmit = async (e) => {
    e.preventDefault();
    if (!applyEmail || !applyCvFile) {
      setApplyStatus({ ...applyStatus, error: 'Vui lòng điền đủ email và chọn file CV' });
      return;
    }
    if (!otpVerified) {
      setApplyStatus({ ...applyStatus, error: 'Vui lòng xác minh email trước khi nộp hồ sơ' });
      return;
    }

    setApplyStatus({ loading: true, error: '', success: false });
    
    const formData = new FormData();
    formData.append('email', applyEmail);
    formData.append('cvImage', applyCvFile);
    formData.append('otp', otpValue);

    try {
      const response = await fetch('http://localhost:3001/api/tutors/apply', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (response.ok) {
        setApplyStatus({ loading: false, error: '', success: true });
        resetApplyModal();
        setTimeout(() => setIsApplyModalOpen(false), 2500);
      } else {
        setApplyStatus({ loading: false, error: data.message || 'Có lỗi xảy ra', success: false });
      }
    } catch (err) {
      setApplyStatus({ loading: false, error: 'Không thể kết nối đến server', success: false });
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const handleRequireLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <GraduationCap className="h-8 w-8 text-purple-600" />
            <span className="text-xl font-bold text-slate-900">EduMatch</span>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4 relative">
                <div 
                  className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 rounded-lg text-purple-700 font-medium text-sm cursor-pointer hover:bg-purple-100 transition-colors group"
                  onClick={() => setShowMenu(!showMenu)}
                >
                  <User className="h-4 w-4" />
                  <span>Chào, {user.fullName}</span>
                  <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showMenu ? 'rotate-180' : ''}`} />
                </div>
                
                {showMenu && (
                  <UserAccountMenu 
                    user={user} 
                    onLogout={handleLogout} 
                    onClose={() => setShowMenu(false)} 
                    position="top"
                  />
                )}
              </div>
            ) : (
              <>
                <button 
                  onClick={handleRequireLogin}
                  className="text-slate-600 hover:text-purple-600 font-medium transition-colors text-sm"
                >
                  Đăng nhập
                </button>
                <button 
                  onClick={() => navigate('/register')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                >
                  Đăng ký
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {/* 1. Hero Section */}
        <div className="bg-[#faf5ff] pt-16 pb-32 md:pt-24 md:pb-40 px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-1.5 rounded-full text-sm font-medium mb-8">
              <GraduationCap className="h-4 w-4" />
              Nền tảng gia sư trực tuyến #1 Việt Nam
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 mb-6 leading-tight">
              Học Cùng Gia Sư Online – Tiết Kiệm Thời Gian, <span className="text-purple-600">Hiệu Quả Gấp 3 Lần!</span>
            </h1>
            <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-3xl mx-auto">
              Kết nối với hơn 10,000+ gia sư uy tín, học mọi lúc mọi nơi. Cam kết đảm bảo chất lượng 100% với quy trình tuyển chọn kỹ càng.
            </p>
            <button 
              onClick={handleRequireLogin}
              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-purple-200 transition-all hover:-translate-y-0.5"
            >
              Tìm gia sư ngay hôm nay
            </button>
          </div>
        </div>

        {/* 2. Features (4 Cards) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16 -mt-20 md:-mt-24 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center hover:shadow-md transition-shadow">
              <div className="h-16 w-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Khóa học mọi giờ, mọi nơi</h3>
              <p className="text-slate-500 text-sm">Học linh hoạt theo lịch của bạn</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center hover:shadow-md transition-shadow">
              <div className="h-16 w-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Tiêu chuẩn 1-1</h3>
              <p className="text-slate-500 text-sm">Sự tập trung hoàn toàn vào bạn</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center hover:shadow-md transition-shadow">
              <div className="h-16 w-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">Công nghệ hiện đại</h3>
              <p className="text-slate-500 text-sm">Phòng học online tương tác cao</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center hover:shadow-md transition-shadow">
              <div className="h-16 w-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 mb-2">An toàn và tiết kiệm</h3>
              <p className="text-slate-500 text-sm">Học tại nhà, tiết kiệm chi phí</p>
            </div>
          </div>
        </div>

        {/* 3. Comparison Table */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-10">So sánh ưu thế vượt trội</h2>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-purple-600 text-white text-center">
                  <th className="py-4 px-6 font-semibold text-left w-1/3 border-r border-purple-500">Tiêu chí</th>
                  <th className="py-4 px-6 font-semibold w-1/3 border-r border-purple-500">Gia sư online</th>
                  <th className="py-4 px-6 font-semibold w-1/3">Trung tâm truyền thống</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-5 px-6 font-medium text-slate-700">Chi phí</td>
                  <td className="py-5 px-6 text-center bg-purple-50/30">
                    <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">Từ 100k/buổi</span>
                  </td>
                  <td className="py-5 px-6 text-center text-slate-500">Từ 300k/buổi</td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="py-5 px-6 font-medium text-slate-700">Thời gian di chuyển</td>
                  <td className="py-5 px-6 text-center bg-purple-50/30 flex flex-col items-center">
                    <CheckCircle2 className="h-6 w-6 text-green-500 mb-1" />
                    <span className="text-sm font-medium">0 phút</span>
                  </td>
                  <td className="py-5 px-6 text-center text-slate-500">30-60 phút</td>
                </tr>
                <tr>
                  <td className="py-5 px-6 font-medium text-slate-700">Tỷ lệ gia sư : học sinh</td>
                  <td className="py-5 px-6 text-center bg-purple-50/30 flex flex-col items-center">
                    <CheckCircle2 className="h-6 w-6 text-green-500 mb-1" />
                    <span className="text-sm font-medium">1:1</span>
                  </td>
                  <td className="py-5 px-6 text-center text-slate-500">1:5 - 1:20</td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="py-5 px-6 font-medium text-slate-700">Theo dõi kết quả</td>
                  <td className="py-5 px-6 text-center bg-purple-50/30 flex flex-col items-center">
                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                  </td>
                  <td className="py-5 px-6 text-center text-slate-500">Hạn chế</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Categories & Banner */}
        <div className="py-16 px-4 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Tìm gia sư cho mọi môn học</h2>
          <p className="text-slate-500 mb-10">Chọn từ hàng ngàn gia sư giỏi cho mọi cấp độ, từ cơ bản đến nâng cao</p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-10 max-w-4xl mx-auto">
            <button onClick={handleRequireLogin} className="flex items-center gap-2 bg-white border border-slate-200 hover:border-purple-300 shadow-sm px-5 py-3 rounded-xl font-medium text-slate-700 transition-colors">
              <GraduationCap className="h-5 w-5 text-slate-500" /> Toán học cơ bản - Nâng cao
            </button>
            <button onClick={handleRequireLogin} className="flex items-center gap-2 bg-white border border-slate-200 hover:border-purple-300 shadow-sm px-5 py-3 rounded-xl font-medium text-slate-700 transition-colors">
              <BookMarked className="h-5 w-5 text-purple-600" /> Tiếng Anh - Giao tiếp
            </button>
            <button onClick={handleRequireLogin} className="flex items-center gap-2 bg-white border border-slate-200 hover:border-purple-300 shadow-sm px-5 py-3 rounded-xl font-medium text-slate-700 transition-colors">
              <Code className="h-5 w-5 text-blue-500" /> Lập trình - AI 🔥 Trendy
            </button>
          </div>
          
          <button onClick={handleRequireLogin} className="text-purple-600 border border-purple-600 hover:bg-purple-50 px-6 py-2.5 rounded-lg font-medium transition-colors">
            Xem danh sách gia sư
          </button>
        </div>

        <div className="bg-purple-600 py-16 px-4 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Trải nghiệm học tập thông minh</h2>
          <p className="text-purple-100 text-lg max-w-2xl mx-auto">Nền tảng học tập hiện đại với công nghệ AI, giúp việc học trở nên dễ dàng và hiệu quả hơn.</p>
        </div>

        {/* 5. Target Audience Cards */}
        <div className="bg-slate-50 py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Phù hợp với học viên nào?</h2>
              <p className="text-slate-500">Dù bạn là học sinh, sinh viên hay người đi làm, chúng tôi đều có giải pháp phù hợp</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              {/* Card Học Viên */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <div className="h-20 w-20 bg-purple-50 rounded-full flex items-center justify-center mb-6">
                  <Users className="h-10 w-10 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-6">Dành cho Học Viên</h3>
                <ul className="text-left space-y-4 mb-8 text-slate-600 w-full px-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
                    <span>Lựa chọn gia sư phù hợp với nhu cầu</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
                    <span>Học 1-1 với giáo viên chuyên môn cao</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
                    <span>Theo dõi tiến độ học tập chi tiết</span>
                  </li>
                </ul>
                <button 
                  onClick={handleRequireLogin}
                  className="mt-auto w-full bg-purple-600 hover:bg-purple-700 text-white py-3.5 rounded-xl font-bold shadow-sm transition-all hover:-translate-y-0.5"
                >
                  Tìm gia sư ngay
                </button>
              </div>

              {/* Card Gia Sư */}
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                <div className="h-20 w-20 bg-purple-50 rounded-full flex items-center justify-center mb-6">
                  <GraduationCap className="h-10 w-10 text-purple-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-6">Dành cho Gia Sư</h3>
                <ul className="text-left space-y-4 mb-8 text-slate-600 w-full px-4">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
                    <span>Tăng thu nhập với lịch dạy linh hoạt</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
                    <span>Kết nối với hàng nghìn học viên tiềm năng</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
                    <span>Công cụ quản lý lớp học hiện đại</span>
                  </li>
                </ul>
                <button 
                  onClick={() => setIsApplyModalOpen(true)}
                  className="mt-auto w-full bg-purple-600 hover:bg-purple-700 text-white py-3.5 rounded-xl font-bold shadow-sm transition-all hover:-translate-y-0.5"
                >
                  Đăng ký làm gia sư
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 6. Stats Section */}
        <div className="bg-white text-center py-16 border-t border-slate-100">
          <div className="max-w-5xl mx-auto px-4">
            <h2 className="text-3xl font-bold text-slate-900 mb-12">Hơn <span className="text-purple-600">50,000+</span> người dùng tin tưởng</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="text-5xl font-extrabold text-purple-600 mb-3">10,000+</div>
                <div className="text-slate-600 font-medium">Gia sư uy tín</div>
              </div>
              <div>
                <div className="text-5xl font-extrabold text-purple-600 mb-3">50,000+</div>
                <div className="text-slate-600 font-medium">Học viên tham gia</div>
              </div>
              <div>
                <div className="text-5xl font-extrabold text-purple-600 mb-3">4.8/5</div>
                <div className="text-slate-600 font-medium">Đánh giá trung bình</div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Bottom CTA Section */}
      <section className="bg-purple-600 text-white py-20 px-4 text-center">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <GraduationCap className="h-16 w-16 mb-6 opacity-90" />
          <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            Học tại nhà – Không giới hạn – Hiệu quả vô đối sau 2 tuần!
          </h2>
          <p className="text-purple-100 text-lg md:text-xl mb-10">
            Bắt đầu hành trình học tập của bạn ngay hôm nay
          </p>
          <button 
            onClick={handleRequireLogin}
            className="bg-white text-purple-600 hover:bg-slate-50 px-8 py-4 rounded-lg font-bold text-lg shadow-lg transition-colors"
          >
            Đăng ký học ngay – Miễn phí buổi đầu
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1a1f2c] text-slate-400 py-16 px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <h3 className="text-white font-bold text-xl mb-6">EduMatch</h3>
            <p className="text-slate-400 leading-relaxed">
              Nền tảng kết nối gia sư và học viên hàng đầu Việt Nam
            </p>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-6">Liên hệ</h3>
            <ul className="space-y-4">
              <li><a href="#" className="hover:text-white transition-colors">Về chúng tôi</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Liên hệ</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Tuyển dụng</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-6">Hỗ trợ</h3>
            <ul className="space-y-4">
              <li><a href="#" className="hover:text-white transition-colors">Câu hỏi thường gặp</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Chính sách bảo mật</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Điều khoản sử dụng</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Hướng dẫn sử dụng</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold text-lg mb-6">Theo dõi chúng tôi</h3>
            <ul className="space-y-4">
              <li><a href="#" className="hover:text-white transition-colors">Facebook</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
              <li><a href="#" className="hover:text-white transition-colors">YouTube</a></li>
              <li><a href="#" className="hover:text-white transition-colors">LinkedIn</a></li>
            </ul>
          </div>
        </div>
      </footer>
      {/* Apply Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-purple-600" />
                Ứng tuyển làm gia sư
              </h3>
              <button 
                onClick={() => { setIsApplyModalOpen(false); resetApplyModal(); }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="p-6">
              {applyStatus.success ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">Nộp hồ sơ thành công!</h4>
                  <p className="text-slate-600 text-sm">Chúng tôi đã nhận được hồ sơ của bạn. Hãy kiểm tra email thường xuyên để nhận lịch phỏng vấn nhé.</p>
                </div>
              ) : (
                <form onSubmit={handleApplySubmit} className="space-y-5">
                  {applyStatus.error && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                      {applyStatus.error}
                    </div>
                  )}
                  
                  {/* Email + OTP section */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Email liên hệ <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        required
                        value={applyEmail}
                        disabled={otpSent}
                        onChange={(e) => { setApplyEmail(e.target.value); setOtpError(''); }}
                        className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all disabled:bg-slate-50 disabled:text-slate-500"
                        placeholder="example@gmail.com"
                      />
                      {!otpSent ? (
                        <button
                          type="button"
                          disabled={!applyEmail || otpLoading}
                          onClick={handleSendOtp}
                          className="px-3 py-2 bg-purple-600 text-white text-sm font-semibold rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {otpLoading ? '...' : 'Gửi mã'}
                        </button>
                      ) : !otpVerified ? (
                        <button
                          type="button"
                          onClick={() => { setOtpSent(false); setOtpValue(''); setOtpError(''); }}
                          className="px-3 py-2 border border-slate-300 text-slate-600 text-sm font-semibold rounded-xl hover:bg-slate-50 transition-colors whitespace-nowrap"
                        >
                          Đổi email
                        </button>
                      ) : null}
                    </div>
                    <p className="text-xs text-slate-500 mt-1.5">* Chỉ chấp nhận email @gmail.com</p>
                    {otpError && <p className="text-xs text-red-500 mt-1">{otpError}</p>}
                  </div>

                  {/* OTP input */}
                  {otpSent && !otpVerified && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1.5">
                        Nhập mã xác nhận 6 số <span className="text-red-500">*</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          maxLength={6}
                          value={otpValue}
                          onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, ''))}
                          className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-center tracking-widest font-mono text-lg"
                          placeholder="_ _ _ _ _ _"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          className="px-3 py-2 bg-green-600 text-white text-sm font-semibold rounded-xl hover:bg-green-700 transition-colors whitespace-nowrap"
                        >
                          Xác nhận
                        </button>
                      </div>
                      <p className="text-xs text-slate-500 mt-1.5">Kiểm tra hộp thư (kể cả Spam) để lấy mã. Mã có hiệu lực 5 phút.</p>
                    </div>
                  )}

                  {otpVerified && (
                    <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      Email đã được xác minh!
                    </div>
                  )}

                  {/* CV Upload */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      Hình ảnh CV / Thẻ sinh viên / Bằng cấp <span className="text-red-500">*</span>
                    </label>

                    {!applyCvFile ? (
                      <div
                        className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-xl hover:bg-slate-50 transition-colors relative cursor-pointer"
                        onClick={() => document.getElementById('cv-upload').click()}
                      >
                        <div className="space-y-2 text-center">
                          <Upload className="mx-auto h-8 w-8 text-slate-400" />
                          <div className="flex text-sm text-slate-600 justify-center">
                            <span className="font-medium text-purple-600 hover:text-purple-500">Tải ảnh lên</span>
                            <p className="pl-1">hoặc kéo thả vào đây</p>
                          </div>
                          <p className="text-xs text-slate-500">PNG, JPG lên tới 5MB</p>
                        </div>
                        <input
                          id="cv-upload"
                          name="cv-upload"
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={(e) => handleCvChange(e.target.files[0])}
                        />
                      </div>
                    ) : (
                      <div className="relative rounded-xl overflow-hidden border border-slate-200 group">
                        <img
                          src={cvPreviewUrl}
                          alt="CV Preview"
                          className="w-full max-h-48 object-contain bg-slate-50 cursor-pointer"
                          onClick={() => window.open(cvPreviewUrl, '_blank')}
                          title="Click để xem ảnh to hơn"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => window.open(cvPreviewUrl, '_blank')}
                            className="bg-white text-slate-800 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-slate-100 transition"
                          >
                            🔍 Xem ảnh
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveCv}
                            className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-red-600 transition"
                          >
                            🗑 Xóa ảnh
                          </button>
                        </div>
                        <p className="text-xs text-slate-500 text-center py-2 bg-white border-t border-slate-100">{applyCvFile.name}</p>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={applyStatus.loading || !otpVerified || !applyCvFile}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl font-bold shadow-sm transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {applyStatus.loading ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Đang xử lý...
                      </>
                    ) : (
                      'Gửi hồ sơ ứng tuyển'
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
