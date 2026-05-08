import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { GraduationCap, ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [activeTab, setActiveTab] = useState('user'); // 'user' or 'tutor'

  const isAdmin = location.pathname.startsWith('/admin');
  const from = location.state?.from?.pathname || (isAdmin ? '/admin' : '/');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password, isAdmin ? 'admin' : activeTab);

      if (result.success) {
        // Redirect to intended page or dashboard
        if (!isAdmin && activeTab === 'tutor') {
          navigate('/tutor-dashboard', { replace: true });
        } else if (!isAdmin && activeTab === 'user') {
          navigate('/student-dashboard', { replace: true });
        } else {
          navigate(from, { replace: true });
        }

      } else {
        setError(result.message || 'Đăng nhập thất bại');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Không thể kết nối đến server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-slate-500 hover:text-blue-600 mb-8 transition-colors absolute top-8 left-8"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Quay lại trang chủ</span>
        </button>

        <div className="flex justify-center">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-10 w-10 text-blue-600" />
            <span className="text-3xl font-bold text-slate-900">EduMatch</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          {isAdmin ? 'Đăng nhập Quản trị' : 'Đăng nhập hệ thống'}
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          {isAdmin ? 'Vui lòng sử dụng tài khoản quản trị để tiếp tục' : 'Vui lòng đăng nhập để tiếp tục sử dụng dịch vụ'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        {!isAdmin && (
          <div className="flex p-1 bg-slate-200/50 rounded-xl mb-6">
            <button
              onClick={() => setActiveTab('user')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'user'
                  ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-900/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
            >
              Học viên / Phụ huynh
            </button>
            <button
              onClick={() => setActiveTab('tutor')}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-200 ${activeTab === 'tutor'
                  ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-900/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
            >
              Gia sư
            </button>
          </div>
        )}

        <div className="bg-white py-8 px-4 shadow-sm border border-slate-200 sm:rounded-2xl sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                {activeTab === 'tutor' ? 'Tên đăng nhập (Username)' : 'Email'}
              </label>
              <div className="mt-1 relative">
                <input
                  type={activeTab === 'tutor' ? 'text' : 'email'}
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full pl-10 px-3 py-2 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder={(() => {
                    if (isAdmin) return 'Tên đăng nhập admin';
                    return activeTab === 'tutor' ? 'Nhập tên đăng nhập được cấp' : 'Nhập địa chỉ email';
                  })()}
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <Mail className="h-5 w-5 text-slate-400" />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="password-input" className="block text-sm font-medium text-slate-700">
                Mật khẩu
              </label>
              <div className="mt-1 relative">
                <input
                  id="password-input"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-10 py-2 border border-slate-300 rounded-xl shadow-sm placeholder-slate-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="••••••••"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                {password && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center z-10 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-900">
                  Ghi nhớ đăng nhập
                </label>
              </div>

              <div className="text-sm">
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="font-medium text-blue-600 hover:text-blue-500 bg-none border-none cursor-pointer p-0"
                  style={{ background: 'none', border: 'none' }}
                >
                  Quên mật khẩu?
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>
            </div>
          </form>

          {!isAdmin && activeTab === 'user' && (
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">Chưa có tài khoản?</span>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => navigate('/register')}
                  className="w-full flex justify-center py-2.5 px-4 border border-slate-300 rounded-xl shadow-sm text-sm font-medium text-slate-700 bg-white hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Đăng ký ngay
                </button>
              </div>
            </div>
          )}

          {!isAdmin && activeTab === 'tutor' && (
            <div className="mt-6 bg-blue-50 text-blue-800 p-4 rounded-xl text-sm border border-blue-100 flex gap-3 items-start">
              <div className="flex-shrink-0 mt-0.5">
                <GraduationCap className="w-5 h-5 text-blue-600" />
              </div>
              <p>Tài khoản Gia sư do Quản trị viên cấp sau khi phỏng vấn thành công. Nếu bạn chưa có tài khoản, vui lòng đăng ký ở trang chủ.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
