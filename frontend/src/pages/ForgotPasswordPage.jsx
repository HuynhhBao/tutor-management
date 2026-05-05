import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { GraduationCap, ArrowLeft, Mail, Lock, ShieldCheck, Eye, EyeOff, RefreshCw, CheckCircle } from 'lucide-react';
import PasswordStrengthIndicator from '../components/PasswordStrengthIndicator';

const TOTAL_SECONDS = 1 * 60; // 1 minute
const SESSION_KEY = 'forgotPasswordSession';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();

  // Restore session from sessionStorage on mount
  const restoreSession = () => {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (!saved) return null;
      return JSON.parse(saved);
    } catch {
      return null;
    }
  };

  const saved = restoreSession();
  const now = Date.now();

  // Calculate remaining time from saved session
  const getRestoredTimeLeft = (session) => {
    if (!session || !session.otpSentAt) return TOTAL_SECONDS;
    const elapsed = Math.floor((now - session.otpSentAt) / 1000);
    const remaining = TOTAL_SECONDS - elapsed;
    return remaining > 0 ? remaining : 0;
  };

  // Initialize state from session if valid
  const initialStep = saved && saved.step && saved.step <= 3 ? saved.step : 1;
  const initialEmail = saved?.email || '';
  const initialTimeLeft = saved?.step === 2 ? getRestoredTimeLeft(saved) : TOTAL_SECONDS;
  const shouldStartTimer = saved?.step === 2 && initialTimeLeft > 0;

  // Step: 1 = email, 2 = otp, 3 = new password, 4 = success
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

  // Save session to sessionStorage whenever step/email/otpSentAt changes
  const saveSession = (updates) => {
    try {
      const current = restoreSession() || {};
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...current, ...updates }));
    } catch {}
  };

  const clearSession = () => {
    try { sessionStorage.removeItem(SESSION_KEY); } catch {}
  };

  // Countdown timer
  useEffect(() => {
    if (timerActive && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            setTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [timerActive]);

  // Auto-focus OTP if restored to step 2
  useEffect(() => {
    if (initialStep === 2) {
      if (initialTimeLeft === 0) {
        // Even if resend timer is 0, the code might still be valid for 5 mins
        // We just let the user know they can resend if needed
      } else {
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      }
    }
  }, []);


  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const progressPercent = ((TOTAL_SECONDS - timeLeft) / TOTAL_SECONDS) * 100;

  // Step 1: Send OTP
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
        const otpSentAt = Date.now();
        saveSession({ step: 2, email, otpSentAt });
        setStep(2);
        setTimeLeft(TOTAL_SECONDS);
        setTimerActive(true);
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        setError(data.message);
      }
    } catch {
      setError('Không thể kết nối đến server');
    } finally {
      setLoading(false);
    }
  };

  // OTP input handling
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      otpRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setError('');
    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setError('Vui lòng nhập đủ 6 chữ số OTP');
      return;
    }
    /* Frontend no longer blocks after 1 min since backend allows 5 mins */
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
      } else {
        setError(data.message);
      }
    } catch {
      setError('Không thể kết nối đến server');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    const passwordRegex = /^(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError('Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa và ký tự đặc biệt');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3001/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: newPassword }),
      });
      const data = await res.json();
      if (data.status === 'ok') {
        clearSession();
        setStep(4);
      } else {
        setError(data.message);
      }
    } catch {
      setError('Không thể kết nối đến server');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
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
        const otpSentAt = Date.now();
        saveSession({ step: 2, email, otpSentAt });
        setTimeLeft(TOTAL_SECONDS);
        setTimerActive(true);
        setOtp(['', '', '', '', '', '']);
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        setError(data.message);
      }
    } catch {
      setError('Không thể kết nối đến server');
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = ['Nhập email', 'Xác thực OTP', 'Mật khẩu mới'];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f4ff 0%, #f8f0ff 100%)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '24px', fontFamily: "'Inter', 'Segoe UI', sans-serif" }}>

      {/* Back button */}
      <button
        onClick={() => navigate('/login')}
        style={{ position: 'fixed', top: '24px', left: '24px', display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', transition: 'color 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.color = '#7c3aed'}
        onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
      >
        <ArrowLeft size={16} />
        Quay lại đăng nhập
      </button>

      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
            <GraduationCap size={36} color="#7c3aed" />
            <span style={{ fontSize: '28px', fontWeight: '800', color: '#1e293b' }}>EduMatch</span>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: '#1e293b', margin: '0 0 4px' }}>Quên mật khẩu</h2>
          <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Khôi phục quyền truy cập tài khoản của bạn</p>
        </div>

        {/* Step indicator (only for steps 1-3) */}
        {step <= 3 && (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '28px' }}>
            {stepLabels.map((label, idx) => {
              const stepNum = idx + 1;
              const isCompleted = step > stepNum;
              const isActive = step === stepNum;
              return (
                <React.Fragment key={stepNum}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%',
                      background: isCompleted ? '#7c3aed' : isActive ? '#7c3aed' : '#e2e8f0',
                      color: isCompleted || isActive ? 'white' : '#94a3b8',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '13px', fontWeight: '700',
                      boxShadow: isActive ? '0 0 0 4px rgba(124,58,237,0.15)' : 'none',
                      transition: 'all 0.3s',
                    }}>
                      {isCompleted ? '✓' : stepNum}
                    </div>
                    <span style={{ fontSize: '11px', color: isActive ? '#7c3aed' : isCompleted ? '#7c3aed' : '#94a3b8', marginTop: '4px', fontWeight: isActive ? '600' : '400' }}>
                      {label}
                    </span>
                  </div>
                  {idx < stepLabels.length - 1 && (
                    <div style={{ flex: 2, height: '2px', background: step > stepNum ? '#7c3aed' : '#e2e8f0', transition: 'background 0.3s', marginBottom: '16px' }} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Card */}
        <div style={{ background: 'white', borderRadius: '20px', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid rgba(124,58,237,0.08)' }}>

          {/* Error message */}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '12px 16px', marginBottom: '20px', color: '#dc2626', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚠️</span> {error}
            </div>
          )}

          {/* === STEP 1: Enter Email === */}
          {step === 1 && (
            <form onSubmit={handleSendOtp}>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <Mail size={22} color="white" />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 6px' }}>Nhập email của bạn</h3>
                <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 24px' }}>Chúng tôi sẽ gửi mã OTP xác thực đến email này</p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Địa chỉ email</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                    <Mail size={18} />
                  </div>
                  <input
                    id="forgot-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    style={{ width: '100%', padding: '10px 12px 10px 40px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', fontFamily: 'inherit' }}
                    onFocus={e => e.target.style.borderColor = '#7c3aed'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '12px', background: loading ? '#c4b5fd' : 'linear-gradient(135deg, #7c3aed, #a855f7)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}
              >
                {loading ? 'Đang gửi...' : 'Gửi mã OTP →'}
              </button>
            </form>
          )}

          {/* === STEP 2: Enter OTP === */}
          {step === 2 && (
            <form onSubmit={handleVerifyOtp}>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <ShieldCheck size={22} color="white" />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 6px' }}>Nhập mã OTP</h3>
                <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 4px' }}>Mã 6 chữ số có hiệu lực trong 5 phút</p>
                <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 6px' }}>Mã đã được gửi đến</p>
                <p style={{ fontSize: '14px', fontWeight: '600', color: '#7c3aed', margin: '0 0 24px' }}>{email}</p>
              </div>

              {/* OTP boxes */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }} onPaste={handleOtpPaste}>
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`otp-${idx}`}
                    ref={el => otpRefs.current[idx] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(idx, e.target.value)}
                    onKeyDown={e => handleOtpKeyDown(idx, e)}
                    style={{
                      width: '48px', height: '56px', textAlign: 'center', fontSize: '22px', fontWeight: '700',
                      border: `2px solid ${digit ? '#7c3aed' : '#e2e8f0'}`,
                      borderRadius: '12px', outline: 'none', background: digit ? '#faf5ff' : 'white',
                      color: '#1e293b', transition: 'all 0.2s', fontFamily: 'inherit',
                    }}
                    onFocus={e => e.target.style.borderColor = '#7c3aed'}
                    onBlur={e => e.target.style.borderColor = digit ? '#7c3aed' : '#e2e8f0'}
                  />
                ))}
              </div>

              {/* Countdown timer */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Gửi lại mã sau</span>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: timeLeft <= 60 ? '#ef4444' : '#7c3aed', fontVariantNumeric: 'tabular-nums' }}>
                    {formatTime(timeLeft)}
                  </span>
                </div>
                <div style={{ height: '6px', background: '#f1f5f9', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${progressPercent}%`,
                    background: timeLeft <= 60 ? '#ef4444' : 'linear-gradient(90deg, #7c3aed, #a855f7)',
                    borderRadius: '99px',
                    transition: 'width 1s linear, background 0.3s',
                  }} />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '12px', background: loading ? '#c4b5fd' : 'linear-gradient(135deg, #7c3aed, #a855f7)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', marginBottom: '12px', fontFamily: 'inherit' }}
              >
                {loading ? 'Đang xác thực...' : 'Xác nhận OTP'}
              </button>

              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading || timeLeft > 0}
                style={{ width: '100%', padding: '10px', background: 'none', color: (loading || timeLeft > 0) ? '#c4b5fd' : '#7c3aed', border: `1.5px solid ${(loading || timeLeft > 0) ? '#e2e8f0' : '#7c3aed'}`, borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: (loading || timeLeft > 0) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontFamily: 'inherit' }}
              >
                <RefreshCw size={15} />
                {timeLeft > 0 ? `Gửi lại sau ${formatTime(timeLeft)}` : 'Gửi lại mã OTP'}
              </button>
            </form>
          )}

          {/* === STEP 3: New Password === */}
          {step === 3 && (
            <form onSubmit={handleResetPassword}>
              <div style={{ marginBottom: '8px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
                  <Lock size={22} color="white" />
                </div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 6px' }}>Tạo mật khẩu mới</h3>
                <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 24px' }}>Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa và ký tự đặc biệt</p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Mật khẩu mới</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                    <Lock size={18} />
                  </div>
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới"
                    style={{ width: '100%', padding: '10px 44px 10px 40px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    onFocus={e => e.target.style.borderColor = '#7c3aed'}
                    onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex' }}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <PasswordStrengthIndicator password={newPassword} />
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Xác nhận mật khẩu</label>
                <div style={{ position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }}>
                    <Lock size={18} />
                  </div>
                  <input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Nhập lại mật khẩu mới"
                    style={{ width: '100%', padding: '10px 44px 10px 40px', border: `1.5px solid ${confirmPassword && confirmPassword !== newPassword ? '#ef4444' : '#e2e8f0'}`, borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    onFocus={e => e.target.style.borderColor = '#7c3aed'}
                    onBlur={e => e.target.style.borderColor = confirmPassword && confirmPassword !== newPassword ? '#ef4444' : '#e2e8f0'}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex' }}>
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== newPassword && (
                  <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>Mật khẩu không khớp</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '12px', background: loading ? '#c4b5fd' : 'linear-gradient(135deg, #7c3aed, #a855f7)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}
              >
                {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
              </button>
            </form>
          )}

          {/* === STEP 4: Success === */}
          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 12px rgba(16,185,129,0.1)' }}>
                  <CheckCircle size={36} color="white" />
                </div>
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px' }}>Thành công!</h3>
              <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 28px' }}>Mật khẩu của bạn đã được đặt lại.<br />Hãy đăng nhập với mật khẩu mới.</p>
              <button
                onClick={() => navigate('/login')}
                style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}
              >
                Đăng nhập ngay →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
