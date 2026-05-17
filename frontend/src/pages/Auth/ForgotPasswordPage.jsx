import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowLeft } from 'lucide-react';
import StepIndicator from '../../components/auth/StepIndicator';
import ForgotStep1Email from '../../components/auth/ForgotStep1Email';
import ForgotStep2Otp from '../../components/auth/ForgotStep2Otp';
import ForgotStep3Password from '../../components/auth/ForgotStep3Password';
import ForgotStep4Success from '../../components/auth/ForgotStep4Success';

const TOTAL_SECONDS = 1 * 60; // 1 phút countdown hiển thị
const SESSION_KEY = 'forgotPasswordSession';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();

  // --- Session restore ---
  const restoreSession = () => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  };

  const saveSession = (updates) => {
    try {
      const current = restoreSession() || {};
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...current, ...updates }));
    } catch {}
  };

  const clearSession = () => {
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
  };

  // --- Init state from session ---
  const saved = restoreSession();
  const now = Date.now();

  const getRestoredTimeLeft = (session) => {
    if (!session?.otpSentAt) return TOTAL_SECONDS;
    const remaining = TOTAL_SECONDS - Math.floor((now - session.otpSentAt) / 1000);
    return Math.max(0, remaining);
  };

  const initialStep = saved?.step && saved.step <= 3 ? saved.step : 1;
  const initialEmail = saved?.email || '';
  const initialTimeLeft = saved?.step === 2 ? getRestoredTimeLeft(saved) : TOTAL_SECONDS;
  const shouldStartTimer = saved?.step === 2 && initialTimeLeft > 0;

  // --- State ---
  const [step, setStep] = useState(initialStep);
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(initialTimeLeft);
  const [timerActive, setTimerActive] = useState(shouldStartTimer);

  const otpRefs = useRef([]);
  const timerRef = useRef(null);

  // --- Countdown timer ---
  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) { clearInterval(timerRef.current); setTimerActive(false); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive]);

  // Auto-focus OTP nếu restore về step 2
  useEffect(() => {
    if (initialStep === 2 && initialTimeLeft > 0) {
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    }
  }, []);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };



  // --- Handlers ---
  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.status === 'ok') {
        saveSession({ step: 2, email, otpSentAt: Date.now() });
        setStep(2);
        setTimeLeft(TOTAL_SECONDS);
        setTimerActive(true);
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        setError(data.message);
      }
    } catch { setError('Không thể kết nối đến server'); }
    finally { setLoading(false); }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replaceAll(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) { setOtp(pasted.split('')); otpRefs.current[5]?.focus(); }
    e.preventDefault();
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    const otpCode = otp.join('');
    if (otpCode.length < 6) { setError('Vui lòng nhập đủ 6 chữ số OTP'); return; }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode }),
      });
      const data = await res.json();
      if (data.status === 'ok') {
        clearInterval(timerRef.current);
        setTimerActive(false);
        saveSession({ step: 3 });
        setStep(3);
      } else { setError(data.message); }
    } catch { setError('Không thể kết nối đến server'); }
    finally { setLoading(false); }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) { setError('Mật khẩu xác nhận không khớp'); return; }
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!passwordRegex.test(newPassword)) { setError('Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa và ký tự đặc biệt'); return; }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: newPassword }),
      });
      const data = await res.json();
      if (data.status === 'ok') { clearSession(); setStep(4); }
      else { setError(data.message); }
    } catch { setError('Không thể kết nối đến server'); }
    finally { setLoading(false); }
  };

  const handleResendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.status === 'ok') {
        saveSession({ step: 2, email, otpSentAt: Date.now() });
        setTimeLeft(TOTAL_SECONDS);
        setTimerActive(true);
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else { setError(data.message); }
    } catch { setError('Không thể kết nối đến server'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #dbeafe 0%, #f8fafc 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '24px', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>
      {/* Nút quay lại */}
      <button
        onClick={() => navigate('/login')}
        style={{ position: 'fixed', top: '24px', left: '24px', display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', transition: 'color 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.color = '#2563eb'}
        onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
      >
        <ArrowLeft size={16} />
        Quay lại đăng nhập
      </button>

      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
            <GraduationCap size={36} color="#2563eb" />
            <span style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b' }}>EduMatch</span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px' }}>Quên mật khẩu</h2>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Khôi phục quyền truy cập tài khoản của bạn</p>
        </div>

        <StepIndicator step={step} />

        {/* Card */}
        <div style={{ background: 'white', borderRadius: '20px', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid rgba(37,99,235,0.08)' }}>
          {/* Error */}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: '#dc2626', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚠️</span> {error}
            </div>
          )}

          {step === 1 && <ForgotStep1Email email={email} setEmail={setEmail} loading={loading} onSubmit={handleSendOtp} />}
          {step === 2 && (
            <ForgotStep2Otp
              email={email} otp={otp} otpRefs={otpRefs} loading={loading}
              timeLeft={timeLeft} formatTime={formatTime}
              onOtpChange={handleOtpChange} onOtpKeyDown={handleOtpKeyDown} onOtpPaste={handleOtpPaste}
              onSubmit={handleVerifyOtp} onResend={handleResendOtp}
            />
          )}
          {step === 3 && (
            <ForgotStep3Password
              newPassword={newPassword} confirmPassword={confirmPassword} loading={loading}
              showPassword={showPassword} showConfirmPassword={showConfirmPassword}
              setNewPassword={setNewPassword} setConfirmPassword={setConfirmPassword}
              setShowPassword={setShowPassword} setShowConfirmPassword={setShowConfirmPassword}
              onSubmit={handleResetPassword}
            />
          )}
          {step === 4 && <ForgotStep4Success onNavigateLogin={() => navigate('/login')} />}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
