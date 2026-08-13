import React from 'react';
import PropTypes from 'prop-types';

const PasswordStrengthIndicator = ({ password }) => {
  const calculateStrength = (pwd) => {
    let score = 0;
    if (!pwd) return score;

    if (pwd.length >= 8) score += 1;
    if (/[a-z]/.test(pwd)) score += 1;
    if (/[A-Z]/.test(pwd)) score += 1;
    if (/\d/.test(pwd)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score += 1;

    return score;
  };

  const strength = calculateStrength(password);

  const getStrengthConfig = (score) => {
    if (!password) return { label: '', color: 'bg-slate-200', width: '0%', textColor: 'text-slate-500' };
    
    switch (score) {
      case 0:
      case 1:
      default:
        return { label: 'Rất yếu', color: 'bg-red-500', width: '20%', textColor: 'text-red-500' };
      case 2:
        return { label: 'Yếu', color: 'bg-orange-500', width: '40%', textColor: 'text-orange-500' };
      case 3:
        return { label: 'Trung bình', color: 'bg-yellow-500', width: '60%', textColor: 'text-yellow-600' };
      case 4:
        return { label: 'Mạnh', color: 'bg-green-500', width: '80%', textColor: 'text-green-600' };
      case 5:
        return { label: 'Rất mạnh', color: 'bg-emerald-600', width: '100%', textColor: 'text-emerald-600' };
    }
  };

  const config = getStrengthConfig(strength);

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-300">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-bold ${config.textColor}`}>
          {config.label}
        </span>
      </div>
      
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-500 ease-out ${config.color}`}
          style={{ width: config.width }}
        />
      </div>
    </div>
  );
};

PasswordStrengthIndicator.propTypes = {
  password: PropTypes.string
};

export default PasswordStrengthIndicator;

