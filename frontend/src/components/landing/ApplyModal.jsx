import { X, ShieldCheck, Upload, Trash2, Eye, Loader2, CheckCircle } from 'lucide-react';
import PropTypes from 'prop-types';

const ApplyModal = ({ 
  isOpen, 
  onClose, 
  step, 
  email, 
  setEmail, 
  otp, 
  setOtp, 
  cvImages, 
  previewUrls, 
  loading, 
  error, 
  otpCountdown,
  onSendOtp, 
  onSubmit, 
  onFileChange, 
  onRemoveFile, 
  onPreviewCv 
}) => {
  if (!isOpen) return null;

  const renderButtonText = () => {
    if (loading && step === 1) return <Loader2 className="w-4 h-4 animate-spin" />;
    if (otpCountdown > 0) {
      const m = Math.floor(otpCountdown / 60);
      const s = (otpCountdown % 60).toString().padStart(2, '0');
      return <span>Gửi lại ({m}:{s})</span>;
    }
    return <span>{step === 2 ? 'Gửi lại' : 'Gửi mã'}</span>;
  };

  const isSubmitDisabled = loading || step === 1 || otp.length !== 6 || cvImages.length === 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" 
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-100/50">
          <h3 className="text-xl font-bold text-slate-900">Ứng tuyển Gia sư</h3>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors shadow-sm">
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl flex items-start gap-3">
              <span className="shrink-0 mt-0.5">⚠️</span>
              <p>{error}</p>
            </div>
          )}
          
          <div className="space-y-6">
            {/* Row: Email + Send OTP Button */}
            <div className="space-y-2">
              <label htmlFor="apply-email" className="text-sm font-bold text-slate-700">Email liên hệ</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    id="apply-email"
                    type="email"
                    placeholder="example@gmail.com"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={step === 2 && loading}
                  />
                </div>
                <button
                  type="button"
                  onClick={onSendOtp}
                  disabled={loading || !email.endsWith('@gmail.com') || otpCountdown > 0}
                  className="px-4 py-3 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-xl font-bold text-xs transition-colors whitespace-nowrap disabled:opacity-50"
                >
                  {renderButtonText()}
                </button>
              </div>
              <p className="text-[11px] text-slate-500 italic">* Chúng tôi sẽ gửi lịch phỏng vấn qua email này</p>
            </div>

            {/* OTP Section - Appears below email row */}
            {step === 2 && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <label htmlFor="apply-otp" className="text-sm font-bold text-slate-700">Mã xác nhận (OTP)</label>
                <div className="relative">
                  <input
                    id="apply-otp"
                    type="text"
                    placeholder="6 chữ số"
                    className="w-full pl-10 pr-4 py-3 bg-blue-50 border border-blue-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold tracking-widest text-blue-700"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    maxLength={6}
                  />
                  <span className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none z-10">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                  </span>
                </div>
              </div>
            )}

            {/* Upload Section */}
            <div className="space-y-3">
              <label htmlFor="cv-upload" className="text-sm font-bold text-slate-700">Hình ảnh CV / Bằng cấp ({cvImages.length})</label>
              
              <label 
                htmlFor="cv-upload" 
                aria-label="Tải lên hình ảnh CV hoặc bằng cấp"
                className="flex flex-col items-center justify-center w-full py-6 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-100 hover:border-blue-300 transition-all group bg-slate-100/50"
              >
                <div className="flex flex-col items-center justify-center text-center px-4">
                  <div className="p-2 bg-white rounded-lg shadow-sm mb-2 group-hover:scale-110 transition-transform">
                    <Upload className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-xs font-medium text-slate-600">
                    <span className="text-blue-600">Thêm ảnh</span> hoặc kéo thả vào đây
                  </p>
                </div>
                <input id="cv-upload" type="file" className="hidden" accept="image/*" multiple onChange={onFileChange} />
              </label>

              {/* File List */}
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {cvImages.map((file, index) => (
                  <div key={`${file.name}-${index}`} className="flex items-center justify-between bg-blue-50 border border-blue-100 p-2 rounded-xl">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="bg-blue-600 rounded-full p-0.5 shrink-0">
                        <CheckCircle className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-[11px] font-medium text-blue-700 truncate max-w-[160px]">
                        {file.name}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-1 shrink-0">
                      <button type="button" onClick={() => onPreviewCv(index)} className="p-1.5 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button type="button" onClick={() => onRemoveFile(index)} className="p-1.5 text-red-500 hover:bg-red-100 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Action Button */}
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className={`w-full py-4 rounded-2xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 mt-2 ${
                isSubmitDisabled
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-60 shadow-none'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200 hover:-translate-y-0.5'
              }`}
            >
              {loading && step === 2 && <Loader2 className="h-5 w-5 animate-spin" />}
              Gửi hồ sơ ứng tuyển
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

ApplyModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  step: PropTypes.number.isRequired,
  email: PropTypes.string.isRequired,
  setEmail: PropTypes.func.isRequired,
  otp: PropTypes.string.isRequired,
  setOtp: PropTypes.func.isRequired,
  cvImages: PropTypes.array.isRequired,
  previewUrls: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  error: PropTypes.string,
  otpCountdown: PropTypes.number,
  onSendOtp: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onFileChange: PropTypes.func.isRequired,
  onRemoveFile: PropTypes.func.isRequired,
  onPreviewCv: PropTypes.func.isRequired
};

export default ApplyModal;
