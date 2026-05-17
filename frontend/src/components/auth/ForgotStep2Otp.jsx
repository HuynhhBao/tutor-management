import React from 'react';
import { ShieldCheck, RefreshCw } from 'lucide-react';

const ForgotStep2Otp = ({
  email, otp, otpRefs, loading,
  timeLeft, formatTime,
  onOtpChange, onOtpKeyDown, onOtpPaste,
  onSubmit, onResend,
}) => (
  <form onSubmit={onSubmit}>
    <div style={{ marginBottom: '8px' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #2563eb, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
        <ShieldCheck size={22} color="white" />
      </div>
      <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 6px' }}>Nhập mã OTP</h3>
      <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 4px' }}>Mã 6 chữ số có hiệu lực trong 5 phút</p>
      <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 6px' }}>Mã đã được gửi đến</p>
      <p style={{ fontSize: '14px', fontWeight: '600', color: '#2563eb', margin: '0 0 24px' }}>{email}</p>
    </div>

    {/* 6 ô OTP */}
    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }} onPaste={onOtpPaste}>
      {otp.map((digit, idx) => (
        <input
          key={idx}
          id={`otp-${idx}`}
          ref={el => otpRefs.current[idx] = el}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => onOtpChange(idx, e.target.value)}
          onKeyDown={e => onOtpKeyDown(idx, e)}
          style={{
            width: '48px', height: '56px', textAlign: 'center', fontSize: '22px', fontWeight: '700',
            border: `2px solid ${digit ? '#2563eb' : '#e2e8f0'}`,
            borderRadius: '12px', outline: 'none', background: digit ? '#faf5ff' : 'white',
            color: '#1e293b', transition: 'all 0.2s', fontFamily: 'inherit',
          }}
          onFocus={e => e.target.style.borderColor = '#2563eb'}
          onBlur={e => e.target.style.borderColor = digit ? '#2563eb' : '#e2e8f0'}
        />
      ))}
    </div>
    <button
      type="submit"
      disabled={loading}
      style={{ width: '100%', padding: '12px', background: loading ? '#c4b5fd' : 'linear-gradient(135deg, #2563eb, #a855f7)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', marginBottom: '12px', fontFamily: 'inherit' }}
    >
      {loading ? 'Đang xác thực...' : 'Xác nhận OTP'}
    </button>

    <button
      type="button"
      onClick={onResend}
      disabled={loading || timeLeft > 0}
      style={{ width: '100%', padding: '10px', background: 'none', color: (loading || timeLeft > 0) ? '#c4b5fd' : '#2563eb', border: `1.5px solid ${(loading || timeLeft > 0) ? '#e2e8f0' : '#2563eb'}`, borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: (loading || timeLeft > 0) ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontFamily: 'inherit' }}
    >
      <RefreshCw size={15} />
      {timeLeft > 0 ? `Gửi lại sau ${formatTime(timeLeft)}` : 'Gửi lại mã OTP'}
    </button>
  </form>
);

export default ForgotStep2Otp;
