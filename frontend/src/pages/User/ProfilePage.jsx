import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { User, Lock, Mail, CheckCircle2, AlertCircle, Save, Loader2, Phone, Eye, EyeOff, Camera, X } from 'lucide-react';
import Cropper from 'react-easy-crop';
import PropTypes from 'prop-types';
import { useAuth } from '../../context/AuthContext';
import PasswordStrengthIndicator from '../../components/PasswordStrengthIndicator';
import { getCroppedImg } from '../../utils/cropImage';

// --- Sub-components ---

const AvatarSection = ({ user, onAvatarChange, loading }) => {
  const fileInputRef = useRef(null);
  
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.fullName || 'User')}&background=6366f1&color=fff&size=128`;
  const avatarSrc = user?.avatarUrl ? `http://localhost:3001${user.avatarUrl}` : defaultAvatar;

  return (
    <div className="flex flex-col items-center mb-8">
      <div className="relative group">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100">
          <img 
            src={avatarSrc} 
            alt="Avatar" 
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="absolute bottom-0 right-0 p-2.5 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-all hover:scale-110 active:scale-95"
          disabled={loading}
        >
          <Camera className="w-5 h-5" />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = () => onAvatarChange(reader.result);
              reader.readAsDataURL(file);
            }
          }}
        />
      </div>
      <p className="mt-4 text-sm font-medium text-gray-500">Nhấp vào icon để thay đổi ảnh đại diện</p>
    </div>
  );
};

AvatarSection.propTypes = {
  user: PropTypes.shape({
    fullName: PropTypes.string,
    avatarUrl: PropTypes.string
  }),
  onAvatarChange: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

const ProfileInfoForm = ({ user, fullName, setFullName, phoneNumber, setPhoneNumber, loading, onSubmit, onAvatarChange }) => (
  <div className="space-y-8">
    <AvatarSection user={user} onAvatarChange={onAvatarChange} loading={loading} />
    
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="md:col-span-2">
           <label htmlFor="email-display" className="block text-sm font-medium text-gray-700 mb-2">Email (Không thể thay đổi)</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email-display"
              type="email"
              disabled
              value={user?.email || ''}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 bg-slate-100 text-gray-500 rounded-xl text-sm"
            />
          </div>
        </div>
        <div>
          <label htmlFor="full-name-input" className="block text-sm font-medium text-gray-700 mb-2">Họ và tên</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="full-name-input"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="Nhập họ tên đầy đủ"
            />
          </div>
        </div>
        <div>
          <label htmlFor="phone-number-input" className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="phone-number-input"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              placeholder="Nhập số điện thoại"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex items-center px-8 py-3 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-all hover:shadow-lg active:scale-95 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
          Lưu thay đổi
        </button>
      </div>
    </form>
  </div>
);

ProfileInfoForm.propTypes = {
  user: PropTypes.shape({
    email: PropTypes.string
  }),
  fullName: PropTypes.string,
  setFullName: PropTypes.func.isRequired,
  phoneNumber: PropTypes.string,
  setPhoneNumber: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
  onAvatarChange: PropTypes.func.isRequired
};

const ChangePasswordForm = ({ 
  currentPassword, setCurrentPassword, 
  newPassword, setNewPassword, 
  confirmPassword, setConfirmPassword,
  showCurrentPassword, setShowCurrentPassword,
  showNewPassword, setShowNewPassword,
  showConfirmPassword, setShowConfirmPassword,
  loading, onSubmit 
}) => (
  <form onSubmit={onSubmit} className="space-y-6 max-w-md mx-auto">
    <div>
      <label htmlFor="current-password-input" className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu hiện tại</label>
      <div className="relative">
        <input
          id="current-password-input"
          type={showCurrentPassword ? 'text' : 'password'}
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all pr-12"
        />
        <button
          type="button"
          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </div>
    <div>
      <label htmlFor="new-password-input" className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu mới</label>
      <div className="relative">
        <input
          id="new-password-input"
          type={showNewPassword ? 'text' : 'password'}
          required
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all pr-12"
          placeholder="Nhập mật khẩu mới"
        />
        <button
          type="button"
          onClick={() => setShowNewPassword(!showNewPassword)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        Mật khẩu phải có ít nhất 8 ký tự, bao gồm ít nhất 1 chữ hoa và 1 ký tự đặc biệt.
      </p>
      <PasswordStrengthIndicator password={newPassword} />
    </div>
    <div>
      <label htmlFor="confirm-password-input" className="block text-sm font-medium text-gray-700 mb-2">Xác nhận mật khẩu mới</label>
      <div className="relative">
        <input
          id="confirm-password-input"
          type={showConfirmPassword ? 'text' : 'password'}
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="block w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all pr-12"
        />
        <button
          type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>
    </div>

    <div className="flex justify-end pt-4">
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center px-6 py-3 bg-primary-600 text-white rounded-xl text-sm font-bold hover:bg-primary-700 transition-all hover:shadow-lg active:scale-95 disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Lock className="w-5 h-5 mr-2" />}
        Cập nhật mật khẩu
      </button>
    </div>
  </form>
);

ChangePasswordForm.propTypes = {
  currentPassword: PropTypes.string,
  setCurrentPassword: PropTypes.func.isRequired,
  newPassword: PropTypes.string,
  setNewPassword: PropTypes.func.isRequired,
  confirmPassword: PropTypes.string,
  setConfirmPassword: PropTypes.func.isRequired,
  showCurrentPassword: PropTypes.bool,
  setShowCurrentPassword: PropTypes.func.isRequired,
  showNewPassword: PropTypes.bool,
  setShowNewPassword: PropTypes.func.isRequired,
  showConfirmPassword: PropTypes.bool,
  setShowConfirmPassword: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired
};

// --- Main Component ---

export default function ProfilePage() {
  const { user, setUserFromLogin } = useAuth();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') === 'password' ? 'password' : 'info';

  const [activeTab, setActiveTab] = useState(initialTab);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Crop states
  const [imageToCrop, setImageToCrop] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhoneNumber(user.phoneNumber || '');
    }
  }, [user]);

  const onCropComplete = useCallback((_croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('http://localhost:3001/api/auth/update-profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, phoneNumber }),
        credentials: 'include',
      });

      const data = await response.json();
      if (response.ok) {
        setMessage({ type: 'success', text: 'Cập nhật hồ sơ thành công!' });
        setUserFromLogin({ ...user, fullName, phoneNumber });
      } else {
        setMessage({ type: 'error', text: data.message || 'Có lỗi xảy ra' });
      }
    } catch (err) {
      console.error('Update profile error:', err);
      setMessage({ type: 'error', text: 'Không thể kết nối đến máy chủ' });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // 1. Get the cropped image blob
      const croppedImageBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      
      // 2. Prepare FormData
      const formData = new FormData();
      formData.append('avatar', croppedImageBlob, 'avatar.jpg');

      // 3. Upload to server
      const response = await fetch('http://localhost:3001/api/auth/update-avatar', {
        method: 'PUT',
        body: formData,
        credentials: 'include',
      });

      const data = await response.json();
      if (response.ok) {
        setMessage({ type: 'success', text: 'Cập nhật ảnh đại diện thành công!' });
        setUserFromLogin({ ...user, avatarUrl: data.avatarUrl });
        setImageToCrop(null); // Close cropper
      } else {
        setMessage({ type: 'error', text: data.message || 'Lỗi khi tải ảnh lên' });
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
      setMessage({ type: 'error', text: 'Không thể tải ảnh lên' });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Mật khẩu xác nhận không khớp' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('http://localhost:3001/api/auth/change-password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
        credentials: 'include',
      });

      const data = await response.json();
      if (response.ok) {
        setMessage({ type: 'success', text: 'Đổi mật khẩu thành công!' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setMessage({ type: 'error', text: data.message || 'Có lỗi xảy ra' });
      }
    } catch (err) {
      console.error('Change password error:', err);
      setMessage({ type: 'error', text: 'Không thể kết nối đến máy chủ' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Cài đặt tài khoản</h1>
        <p className="text-gray-500 mt-1">Cập nhật thông tin cá nhân, ảnh đại diện và bảo mật</p>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-gray-100 border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 py-5 px-6 text-sm font-bold transition-all flex items-center justify-center ${activeTab === 'info'
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/30'
                : 'text-gray-400 hover:text-gray-700 hover:bg-slate-100'
              }`}
          >
            <User className="w-5 h-5 mr-2" />
            Thông tin cá nhân
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex-1 py-5 px-6 text-sm font-bold transition-all flex items-center justify-center ${activeTab === 'password'
                ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50/30'
                : 'text-gray-400 hover:text-gray-700 hover:bg-slate-100'
              }`}
          >
            <Lock className="w-5 h-5 mr-2" />
            Bảo mật & Mật khẩu
          </button>
        </div>

        <div className="p-8 md:p-12">
          {message.text && (
            <div className={`mb-8 p-5 rounded-2xl flex items-center animate-in zoom-in-95 duration-200 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
              }`}>
              {message.type === 'success' ? <CheckCircle2 className="w-6 h-6 mr-3" /> : <AlertCircle className="w-6 h-6 mr-3" />}
              <span className="text-sm font-bold">{message.text}</span>
            </div>
          )}

          {activeTab === 'info' ? (
            <ProfileInfoForm 
              user={user} 
              fullName={fullName} setFullName={setFullName} 
              phoneNumber={phoneNumber} setPhoneNumber={setPhoneNumber} 
              loading={loading} 
              onSubmit={handleUpdateProfile}
              onAvatarChange={setImageToCrop}
            />
          ) : (
            <ChangePasswordForm 
              currentPassword={currentPassword} setCurrentPassword={setCurrentPassword}
              newPassword={newPassword} setNewPassword={setNewPassword}
              confirmPassword={confirmPassword} setConfirmPassword={setConfirmPassword}
              showCurrentPassword={showCurrentPassword} setShowCurrentPassword={setShowCurrentPassword}
              showNewPassword={showNewPassword} setShowNewPassword={setShowNewPassword}
              showConfirmPassword={showConfirmPassword} setShowConfirmPassword={setShowConfirmPassword}
              loading={loading}
              onSubmit={handleChangePassword}
            />
          )}
        </div>
      </div>

      {/* Image Crop Modal */}
      {imageToCrop && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl overflow-hidden max-w-xl w-full shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Chỉnh sửa ảnh đại diện</h3>
              <button onClick={() => setImageToCrop(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="relative flex-1 bg-gray-100 min-h-[400px]">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label htmlFor="zoom-slider" className="block text-sm font-medium text-gray-700 mb-2">Phóng to / Thu nhỏ</label>
                <input
                  id="zoom-slider"
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number.parseFloat(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setImageToCrop(null)}
                  className="flex-1 py-3 px-6 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition-all active:scale-95"
                >
                  Hủy
                </button>
                <button
                  onClick={handleAvatarUpload}
                  disabled={loading}
                  className="flex-1 py-3 px-6 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 active:scale-95 disabled:opacity-50 flex items-center justify-center"
                >
                  {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : 'Áp dụng ảnh'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
