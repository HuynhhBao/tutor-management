import React from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';
import PasswordStrengthIndicator from '../PasswordStrengthIndicator';

const ForgotStep3Password = ({
  newPassword, confirmPassword, loading,
  showPassword, showConfirmPassword,
  setNewPassword, setConfirmPassword,
  setShowPassword, setShowConfirmPassword,
  onSubmit,
}) => (
  <form onSubmit={onSubmit}>
    <div style={{ marginBottom: '8px' }}>
      <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg, #2563eb, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
        <Lock size={22} color="white" />
      </div>
      <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1e293b', margin: '0 0 6px' }}>Tạo mật khẩu mới</h3>
      <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 24px' }}>Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa và ký tự đặc biệt</p>
    </div>

    {/* Mật khẩu mới */}
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Mật khẩu mới</label>
      <div style={{ position: 'relative' }}>
        <input
          id="new-password"
          type={showPassword ? 'text' : 'password'}
          required
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          placeholder="Nhập mật khẩu mới"
          style={{ width: '100%', padding: '10px 44px 10px 40px', border: '1.5px solid #e2e8f0', borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
          onFocus={e => e.target.style.borderColor = '#2563eb'}
          onBlur={e => e.target.style.borderColor = '#e2e8f0'}
        />
        <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', zIndex: 10 }}>
          <Lock size={18} />
        </div>
        {newPassword && (
          <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex', zIndex: 10 }}>
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      <PasswordStrengthIndicator password={newPassword} />
    </div>

    {/* Xác nhận mật khẩu */}
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Xác nhận mật khẩu</label>
      <div style={{ position: 'relative' }}>
        <input
          id="confirm-password"
          type={showConfirmPassword ? 'text' : 'password'}
          required
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          placeholder="Nhập lại mật khẩu mới"
          style={{ width: '100%', padding: '10px 44px 10px 40px', border: `1.5px solid ${confirmPassword && confirmPassword !== newPassword ? '#ef4444' : '#e2e8f0'}`, borderRadius: '10px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
          onFocus={e => e.target.style.borderColor = '#2563eb'}
          onBlur={e => e.target.style.borderColor = confirmPassword && confirmPassword !== newPassword ? '#ef4444' : '#e2e8f0'}
        />
        <div style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', zIndex: 10 }}>
          <Lock size={18} />
        </div>
        {confirmPassword && (
          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 0, display: 'flex', zIndex: 10 }}>
            {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {confirmPassword && confirmPassword !== newPassword && (
        <p style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px' }}>Mật khẩu không khớp</p>
      )}
    </div>

    <button
      type="submit"
      disabled={loading}
      style={{ width: '100%', padding: '12px', background: loading ? '#c4b5fd' : 'linear-gradient(135deg, #2563eb, #a855f7)', color: 'white', border: 'none', borderRadius: '10px', fontSize: '15px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', fontFamily: 'inherit' }}
    >
      {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
    </button>
  </form>
);

export default ForgotStep3Password;
