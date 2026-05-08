import React from 'react';
import { CheckCircle } from 'lucide-react';

const ForgotStep4Success = ({ onNavigateLogin }) => (
  <div style={{ textAlign: 'center', padding: '16px 0' }}>
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
      <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, #10b981, #34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 0 12px rgba(16,185,129,0.1)' }}>
        <CheckCircle size={36} color="white" />
      </div>
    </div>
    <h3 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', margin: '0 0 8px' }}>Thành công!</h3>
    <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 28px' }}>
      Mật khẩu của bạn đã được đặt lại.<br />Hãy đăng nhập với mật khẩu mới.
    </p>
    <button
      onClick={onNavigateLogin}
      style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #2563eb, #a855f7)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: 'pointer', fontFamily: 'inherit' }}
    >
      Đăng nhập ngay →
    </button>
  </div>
);

export default ForgotStep4Success;
