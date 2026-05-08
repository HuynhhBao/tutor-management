import React from 'react';

const stepLabels = ['Nhập email', 'Xác thực OTP', 'Mật khẩu mới'];

const StepIndicator = ({ step }) => {
  if (step > 3) return null;

  return (
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
                background: isCompleted || isActive ? '#2563eb' : '#e2e8f0',
                color: isCompleted || isActive ? 'white' : '#94a3b8',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '13px', fontWeight: '700',
                boxShadow: isActive ? '0 0 0 4px rgba(124,58,237,0.15)' : 'none',
                transition: 'all 0.3s',
              }}>
                {isCompleted ? '✓' : stepNum}
              </div>
              <span style={{
                fontSize: '11px',
                color: isActive || isCompleted ? '#2563eb' : '#94a3b8',
                marginTop: '4px',
                fontWeight: isActive ? '600' : '400',
              }}>
                {label}
              </span>
            </div>
            {idx < stepLabels.length - 1 && (
              <div style={{
                flex: 2, height: '2px',
                background: step > stepNum ? '#2563eb' : '#e2e8f0',
                transition: 'background 0.3s',
                marginBottom: '16px',
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default StepIndicator;
