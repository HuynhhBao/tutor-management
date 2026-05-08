import React from 'react';
import { Mail } from 'lucide-react';

const ForgotStep1Email = ({ email, setEmail, loading, onSubmit }) => (
  <form onSubmit={onSubmit}>
    <div style={{ marginBottom: '8px' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #2563eb, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
        <Mail size={22} color="white" />
      </div>
      <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 6px' }}>Nhập email của bạn</h3>
      <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 24px' }}>Chúng tôi sẽ gửi mã OTP xác thực đến email này</p>
    </div>

    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Địa chỉ email</label>
      <div style={{ position: 'relative' }}>
        <input
          id="forgot-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="example@gmail.com"
          style={{ width: '100%', padding: '10px 12px 10px 40px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', fontFamily: 'inherit' }}
          onFocus={e => e.target.style.borderColor = '#2563eb'}
          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
        />
        <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', zIndex: 10 }}>
          <Mail size={18} />
        </div>
      </div>
    </div>

    <button
      type="submit"
      disabled={loading}
      style={{ width: '100%', padding: '12px', background: loading ? '#c4b5fd' : 'linear-gradient(135deg, #2563eb, #a855f7)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}
    >
      {loading ? 'Đang gửi...' : 'Gửi mã OTP →'}
    </button>
  </form>
);

export default ForgotStep1Email;
