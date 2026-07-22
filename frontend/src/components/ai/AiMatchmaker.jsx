import React, { useState } from 'react';
import { Sparkles, Search, GraduationCap, Calendar, User, BookOpen, ChevronRight, RefreshCw, CheckCircle2 } from 'lucide-react';
import { API_BASE_URL } from '../../utils/constants';
import BookingModal from '../common/BookingModal';

const AiMatchmaker = ({ onBookingSuccess }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');
  const [bookingTutor, setBookingTutor] = useState(null);

  const quickPrompts = [
    { label: '🧮 Gia sư Toán lớp 10 giỏi', text: 'Cần tìm gia sư dạy môn Toán lớp 10 có kinh nghiệm luyện thi học sinh giỏi, kiên nhẫn' },
    { label: '🇬🇧 Gia sư Tiếng Anh IELTS 7.0+', text: 'Tìm gia sư Nữ dạy Tiếng Anh giao tiếp và ôn thi IELTS target 7.0+' },
    { label: '🧪 Gia sư Hóa học lớp 12', text: 'Cần gia sư Hóa học lớp 12 ôn thi THPT Quốc Gia cấp tốc' },
    { label: '💻 Gia sư Lập trình căn bản', text: 'Tìm gia sư dạy Lập trình CNTT cơ bản cho người mới bắt đầu' }
  ];

  const handleSearch = async (textToSearch) => {
    const query = textToSearch || prompt;
    if (!query.trim() || loading) return;

    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const res = await fetch(`${API_BASE_URL}/ai/matchmaker`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ prompt: query }),
      });

      const json = await res.json();
      if (json.status === 'ok') {
        let tutorList = [];
        if (Array.isArray(json.data)) {
          tutorList = json.data;
        } else if (Array.isArray(json)) {
          tutorList = json;
        } else if (json['0']) {
          tutorList = Object.keys(json)
            .filter(k => !isNaN(k))
            .map(k => json[k]);
        }
        setRecommendations(tutorList);
      } else {
        setError(json.message || 'Không thể lấy dữ liệu gợi ý từ AI.');
      }
    } catch (err) {
      console.error('Lỗi khi gọi AI Matchmaker:', err);
      setError('Lỗi kết nối máy chủ AI. Vui lòng kiểm tra lại backend!');
    } finally {
      setLoading(false);
    }
  };

  const avatarColors = [
    'bg-blue-600', 'bg-indigo-600', 'bg-emerald-600', 'bg-violet-600', 'bg-amber-600'
  ];

  const getInitials = (name = '') =>
    name.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase();

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden mb-6">
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-white/15 backdrop-blur-md rounded-full text-amber-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            AI Search Engine
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            AI Matchmaker — Gợi Ý Gia Sư Thông Minh
          </h2>
          <p className="text-blue-100 text-sm mt-1 max-w-2xl leading-relaxed">
            Mô tả nhu cầu học tập (độ tuổi, môn học, trình độ, giới tính...), AI sẽ tự động phân tích và ghép nối với những gia sư phù hợp nhất.
          </p>
        </div>
      </div>

      {/* Input Form */}
      <div className="space-y-4">
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Ví dụ: Tìm gia sư 25 tuổi dạy Toán, hoặc Tìm gia sư Nữ dạy Tiếng Anh IELTS..."
            rows={3}
            className="w-full pl-4 pr-36 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm sm:text-base transition-all resize-none shadow-sm"
          />
          <button
            onClick={() => handleSearch(prompt)}
            disabled={!prompt.trim() || loading}
            className="absolute right-3 bottom-3.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-sm shadow-md shadow-blue-200 flex items-center gap-2 transition-all active:scale-95"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Phân tích...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Tìm với AI</span>
              </>
            )}
          </button>
        </div>

        {/* Quick Prompt Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-semibold text-slate-500 mr-1">Gợi ý tìm nhanh:</span>
          {quickPrompts.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                setPrompt(item.text);
                handleSearch(item.text);
              }}
              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-xl text-xs text-blue-700 font-medium transition-all shadow-sm"
            >
              {item.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-600 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Loading State */}
      {loading && (
        <div className="mt-6 p-8 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-center animate-pulse">
          <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6 text-blue-600 animate-bounce" />
          </div>
          <p className="font-bold text-slate-800 text-base">Gemini AI đang phân tích dữ liệu...</p>
          <p className="text-xs text-slate-500 mt-1">Đang đánh giá tiêu chí môn học, độ tuổi và kỹ năng gia sư</p>
        </div>
      )}

      {/* AI Suggested Results */}
      {!loading && searched && (
        <div className="mt-8 pt-6 border-t border-slate-200 animate-in fade-in duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Kết Quả AI Phù Hợp Nhất ({recommendations.length})
            </h3>
            <span className="text-xs text-slate-500">Sắp xếp theo độ phù hợp AI</span>
          </div>

          {recommendations.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
              <p className="text-slate-600 text-sm">Không tìm thấy gia sư phù hợp với yêu cầu này. Vui lòng thử từ khóa khác!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendations.map((tutor, idx) => {
                const subjects = tutor.subjects
                  ? tutor.subjects.split(',').map(s => s.trim()).filter(Boolean)
                  : [];
                const colorClass = avatarColors[idx % avatarColors.length];
                const score = tutor.matchScore || 85;

                // Color score badge dynamically
                let badgeClass = 'bg-blue-50 text-blue-700 border-blue-200';
                if (score >= 90) badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                else if (score < 75) badgeClass = 'bg-amber-50 text-amber-700 border-amber-200';

                return (
                  <div
                    key={tutor.id || idx}
                    className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Top Header Row */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-12 h-12 ${colorClass} rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-sm`}>
                            {getInitials(tutor.full_name)}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
                              {tutor.full_name}
                            </h4>
                            <p className="text-xs text-slate-500">{tutor.qualification || 'Gia sư EduMatch'}</p>
                          </div>
                        </div>

                        {/* Match Score Badge */}
                        <div className={`px-3 py-1 border font-extrabold text-xs rounded-full whitespace-nowrap flex items-center gap-1 shadow-sm ${badgeClass}`}>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{score}% Phù hợp</span>
                        </div>
                      </div>

                      {/* AI Reason Box */}
                      {tutor.matchReason && (
                        <div className="mb-3 p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-700 leading-relaxed flex items-start gap-2.5">
                          <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-indigo-700 block text-[11px] uppercase tracking-wider mb-0.5">Đánh giá AI:</strong>
                            <span>{tutor.matchReason}</span>
                          </div>
                        </div>
                      )}

                      {/* Meta Info */}
                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 mb-3">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{tutor.age ? `${tutor.age} tuổi` : 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{tutor.gender || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Subjects */}
                      {subjects.length > 0 && (
                        <div className="flex items-center gap-1.5 flex-wrap mb-4">
                          <BookOpen className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          {subjects.map((sub, sIdx) => (
                            <span
                              key={sIdx}
                              className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full border border-blue-100"
                            >
                              {sub}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <button
                      onClick={() => setBookingTutor(tutor)}
                      className="w-full py-2.5 bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white font-bold text-xs rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5"
                    >
                      <span>Đặt lịch học ngay</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Booking Modal */}
      {bookingTutor && (
        <BookingModal
          tutor={bookingTutor}
          onClose={() => setBookingTutor(null)}
          onSuccess={() => {
            onBookingSuccess?.();
          }}
        />
      )}
    </div>
  );
};

export default AiMatchmaker;
