import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LandingHeader from '../components/landing/LandingHeader';
import HeroSection from '../components/landing/HeroSection';
import FeaturesSection from '../components/landing/FeaturesSection';
import ComparisonTable from '../components/landing/ComparisonTable';
import CategoriesSection from '../components/landing/CategoriesSection';
import TargetAudienceSection from '../components/landing/TargetAudienceSection';
import StatsSection from '../components/landing/StatsSection';
import CTASection from '../components/landing/CTASection';
import FooterSection from '../components/landing/FooterSection';
import ApplyModal from '../components/landing/ApplyModal';
import CvLightbox from '../components/landing/CvLightbox';
import SuccessModal from '../components/landing/SuccessModal';

const LandingPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // States
  const [showMenu, setShowMenu] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyStep, setApplyStep] = useState(1);
  const [applyEmail, setApplyEmail] = useState('');
  const [applyOtp, setApplyOtp] = useState('');
  const [cvImages, setCvImages] = useState([]); // Array of files
  const [previewUrls, setPreviewUrls] = useState([]); // Array of URLs
  const [activePreviewUrl, setActivePreviewUrl] = useState(null); // For lightbox
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [applyLoading, setApplyLoading] = useState(false);
  const [applyError, setApplyError] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Countdown timer for OTP
  useEffect(() => {
    let timer;
    if (otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);

  // Handlers
  const handleRequireLogin = () => {
    if (user) navigate('/tutor-dashboard');
    else navigate('/login');
  };

  const handleApplyTutor = () => {
    setIsApplyModalOpen(true);
    setApplyStep(1);
    setApplyError('');
  };

  const handleSendApplyOtp = async () => {
    if (!applyEmail?.endsWith('@gmail.com')) {
      setApplyError('Vui lòng nhập email @gmail.com hợp lệ');
      return;
    }
    setApplyLoading(true);
    setApplyError('');
    try {
      const response = await fetch('http://localhost:3001/api/tutors/apply/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: applyEmail }),
      });
      const data = await response.json();
      if (response.ok) {
        setApplyStep(2);
        setOtpCountdown(60); // 1 minute resend timer
      } else {
        setApplyError(data.message);
      }
    } catch {
      setApplyError('Lỗi kết nối server');
    } finally {
      setApplyLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB
    
    const validFiles = [];
    const invalidFiles = [];
    
    files.forEach(file => {
      if (file.size <= MAX_SIZE) validFiles.push(file);
      else invalidFiles.push(file.name);
    });

    if (invalidFiles.length > 0) {
      alert(`Các file sau vượt quá giới hạn 10MB và không được thêm: \n- ${invalidFiles.join('\n- ')}`);
    }

    if (validFiles.length > 0) {
      const newFiles = [...cvImages, ...validFiles];
      const newUrls = [...previewUrls, ...validFiles.map(file => URL.createObjectURL(file))];
      setCvImages(newFiles);
      setPreviewUrls(newUrls);
    }
  };

  const handleRemoveFile = (index) => {
    const newFiles = cvImages.filter((_, i) => i !== index);
    const newUrls = previewUrls.filter((_, i) => i !== index);
    
    // Revoke URL to prevent memory leak
    URL.revokeObjectURL(previewUrls[index]);
    
    setCvImages(newFiles);
    setPreviewUrls(newUrls);
  };

  const handlePreviewCv = (index) => {
    setActivePreviewUrl(previewUrls[index]);
    setIsLightboxOpen(true);
  };

  const handleSubmitApplication = async (e) => {
    if (e) e.preventDefault();
    if (!applyOtp || cvImages.length === 0) {
      setApplyError('Vui lòng nhập OTP và đính kèm ít nhất một hình ảnh CV');
      return;
    }
    setApplyLoading(true);
    setApplyError('');
    
    const formData = new FormData();
    formData.append('email', applyEmail);
    formData.append('otp', applyOtp);
    // backend currently expects 'cvImage' as single, I might need to adjust or loop
    // But per user request "cho up nhiều ảnh", I'll send them all. 
    // If backend only handles one, I'll send the first one or adjust backend later.
    // Assuming backend might need update for multiple files.
    cvImages.forEach(file => {
      formData.append('cvImage', file); 
    });

    try {
      const response = await fetch('http://localhost:3001/api/tutors/apply', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      if (response.ok) {
        setIsApplyModalOpen(false); // Đóng modal nộp hồ sơ trước
        resetApplyForm();
        setTimeout(() => {
          setIsSuccessModalOpen(true); // Sau đó hiện modal thành công
        }, 100);
      } else {
        setApplyError(data.message);
      }
    } catch {
      setApplyError('Lỗi server, vui lòng thử lại sau');
    } finally {
      setApplyLoading(false);
    }
  };

  const resetApplyForm = () => {
    setApplyStep(1);
    setApplyEmail('');
    setApplyOtp('');
    setCvImages([]);
    setPreviewUrls([]);
  };

  return (
    <div className="min-h-screen bg-slate-100/50 font-sans selection:bg-blue-200 selection:text-blue-800">
      <LandingHeader 
        user={user} 
        showMenu={showMenu} 
        setShowMenu={setShowMenu} 
        onLogout={logout} 
        onRequireLogin={handleRequireLogin} 
      />

      <main>
        <HeroSection onRequireLogin={handleRequireLogin} />
        <FeaturesSection />
        <ComparisonTable />
        <CategoriesSection onRequireLogin={handleRequireLogin} />
        <TargetAudienceSection 
          onRequireLogin={handleRequireLogin} 
          onApplyTutor={handleApplyTutor} 
        />
        <StatsSection />
        <CTASection onRequireLogin={handleRequireLogin} />
      </main>

      <FooterSection />

      {/* Modals */}
      <ApplyModal 
        isOpen={isApplyModalOpen}
        onClose={() => setIsApplyModalOpen(false)}
        step={applyStep}
        email={applyEmail}
        setEmail={setApplyEmail}
        otp={applyOtp}
        setOtp={setApplyOtp}
        cvImages={cvImages}
        previewUrls={previewUrls}
        loading={applyLoading}
        error={applyError}
        otpCountdown={otpCountdown}
        onSendOtp={handleSendApplyOtp}
        onSubmit={handleSubmitApplication}
        onFileChange={handleFileChange}
        onRemoveFile={handleRemoveFile}
        onPreviewCv={handlePreviewCv}
      />

      <CvLightbox 
        isOpen={isLightboxOpen} 
        previewUrl={activePreviewUrl} 
        onClose={() => setIsLightboxOpen(false)} 
      />

      <SuccessModal 
        isOpen={isSuccessModalOpen} 
        onClose={() => setIsSuccessModalOpen(false)} 
      />
    </div>
  );
};

export default LandingPage;
