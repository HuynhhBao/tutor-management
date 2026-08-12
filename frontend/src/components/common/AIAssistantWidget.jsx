import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, X, Sparkles, Trash2, CheckCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';

const API_BASE = 'http://localhost:3001/api';

// Hàm định dạng thời gian thông minh
const formatSmartTime = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();

  const isToday = date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) return timeStr;
  if (isYesterday) return `Hôm qua lúc ${timeStr}`;

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  if (year === now.getFullYear()) return `${day}/${month} - ${timeStr}`;
  return `${day}/${month}/${year} - ${timeStr}`;
};

const formatDateDivider = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();

  const isToday = date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isToday) return `Hôm nay, ${date.getDate()} Tháng ${date.getMonth() + 1}`;
  if (isYesterday) return `Hôm qua, ${date.getDate()} Tháng ${date.getMonth() + 1}`;
  return `${date.getDate()} Tháng ${date.getMonth() + 1}, ${date.getFullYear()}`;
};

const isSameDay = (d1, d2) => {
  if (!d1 || !d2) return false;
  const date1 = new Date(d1);
  const date2 = new Date(d2);
  return date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear();
};

const AIAssistantWidget = () => {
  const { user } = useAuth();
  const { showConfirm, showAlert } = useAlert();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Tính toán điều kiện student trước, dùng bên trong hook
  const isStudent = Boolean(user?.role === 'user');

  // 1. Tự động cuộn xuống cuối danh sách tin nhắn
  useEffect(() => {
    if (isStudent && isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isStudent]);

  // 2. Tải lịch sử chat từ Backend khi mở chatbox lần đầu
  useEffect(() => {
    if (!isStudent || !isOpen || messages.length > 0) return;

    const fetchHistory = async () => {
      try {
        const res = await fetch(`${API_BASE}/ai-chat/history`, { credentials: 'include' });
        const data = await res.json();
        if (data.status === 'ok') {
          setMessages(data.data);
        }
      } catch (err) {
        console.error('Lỗi khi lấy lịch sử chat AI:', err);
      }
    };

    fetchHistory();
  }, [isOpen, isStudent]);

  // Chỉ hiển thị widget nếu người dùng hiện tại là Student — early return SAU tất cả hooks
  if (!isStudent) return null;

  // 3. Gửi tin nhắn
  const handleSendMessage = async (textToSend) => {
    const messageText = textToSend || input;
    if (!messageText.trim() || loading) return;

    setInput('');
    setLoading(true);

    // Thêm tin nhắn của User vào UI tạm thời để có cảm giác phản hồi tức thì
    const tempUserMsg = { id: Date.now(), sender: 'user', message: messageText, created_at: new Date() };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await fetch(`${API_BASE}/ai-chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: messageText }),
      });

      const data = await res.json();
      if (data.status === 'ok') {
        // Cập nhật lại với dữ liệu chính thức từ DB để đồng bộ ID và Time
        setMessages(prev => {
          // Bỏ tin nhắn tạm thời và thêm tin nhắn thực tế
          const filtered = prev.filter(m => m.id !== tempUserMsg.id);
          return [...filtered, data.data.userMessage, data.data.aiMessage];
        });
      } else {
        // Nếu có lỗi, hiển thị thông báo lỗi thân thiện trên UI
        setMessages(prev => [
          ...prev,
          {
            id: Date.now() + 1,
            sender: 'ai',
            message: 'Xin lỗi bạn, hệ thống đang gặp lỗi kết nối với máy chủ AI. Vui lòng thử lại sau!',
            created_at: new Date()
          }
        ]);
      }
    } catch (err) {
      console.error('Lỗi gửi tin nhắn AI:', err);
      setMessages(prev => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          message: 'Lỗi kết nối mạng. Hãy đảm bảo máy chủ backend đang chạy!',
          created_at: new Date()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // 4. Xóa lịch sử chat
  const handleClearHistory = () => {
    showConfirm('Bạn có chắc chắn muốn xóa toàn bộ lịch sử trò chuyện với AI?', async () => {
      try {
        const res = await fetch(`${API_BASE}/ai-chat/history`, {
          method: 'DELETE',
          credentials: 'include'
        });
        const data = await res.json();
        if (data.status === 'ok') {
          setMessages([]);
          showAlert('Đã xóa toàn bộ lịch sử trò chuyện với AI.');
        }
      } catch (err) {
        console.error('Lỗi khi xóa lịch sử chat:', err);
      }
    });
  };

  // 5. Gợi ý câu hỏi nhanh
  const suggestions = [
    { text: 'Làm sao để nạp tiền vào ví?', label: 'Ví tiền' },
    { text: 'Làm thế nào để tìm kiếm gia sư?', label: 'Tìm gia sư' },
    { text: 'Quy định hủy lịch học thế nào?', label: 'Hủy lịch học' }
  ];

  // 6. Hàm phân tích cú pháp markdown cơ bản cho AI
  const formatMessageText = (text) => {
    if (!text) return '';
    return text.split('\n').map((line, idx) => {
      let content = line;
      
      // Định dạng dòng trống thành thẻ break
      if (content.trim() === '') {
        return <div key={`br-${idx}`} className="h-2" />; // nosonar
      }

      // Xử lý danh sách không thứ tự (* hoặc -)
      if (content.startsWith('* ') || content.startsWith('- ')) {
        const itemText = content.substring(2);
        return (
          <li key={`ul-${idx}`} className="list-disc ml-4 my-0.5 text-slate-700"> {/* nosonar */}
            {renderInlineMarkdown(itemText)}
          </li>
        );
      }

      // Xử lý danh sách có thứ tự (e.g. 1. hoặc 2.)
      const matchNumbered = content.match(/^(\d+)\.\s(.*)/);
      if (matchNumbered) {
        const num = matchNumbered[1];
        const rest = matchNumbered[2];
        return (
          <li key={`ol-${idx}`} className="list-decimal ml-4 my-0.5 text-slate-700" value={num}> {/* nosonar */}
            {renderInlineMarkdown(rest)}
          </li>
        );
      }

      return (
        <p key={`p-${idx}`} className="my-0.5 leading-relaxed text-slate-700"> {/* nosonar */}
          {renderInlineMarkdown(content)}
        </p>
      );
    });
  };

  // Phân tích các định dạng nội dòng (chữ đậm **text**)
  const renderInlineMarkdown = (text) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={`strong-${index}`} className="font-bold text-slate-900">{part}</strong>; // nosonar
      }
      return part;
    });
  };

  return (
    <>
      {/* 1. Bong bóng Chatbot AI nổi ở góc dưới bên phải */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 focus:outline-none ring-4 ring-blue-500/20 animate-bounce group"
        style={{ animationDuration: '3s' }}
        aria-label="Mở Trợ lý AI"
      >
        {isOpen ? (
          <X className="h-7 w-7 rotate-90 transition-transform duration-300" />
        ) : (
          <div className="relative">
            <Bot className="h-7 w-7 group-hover:rotate-12 transition-transform" />
            <Sparkles className="h-3.5 w-3.5 text-amber-300 absolute -top-1.5 -right-1.5 animate-pulse" />
          </div>
        )}
      </button>

      {/* 2. Cửa sổ chatbox */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-2rem)] h-[520px] max-h-[80vh] bg-white rounded-3xl shadow-2xl border border-slate-100 flex flex-col z-50 overflow-hidden animate-in slide-in-from-bottom-6 fade-in duration-300 ease-out">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md">
                <Bot className="h-6 w-6 text-amber-300" />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                  {'Trợ lý ảo EduMatch '}
                  <span className="inline-flex h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                </h3>
                <p className="text-[10px] text-blue-100 font-medium">Sẵn sàng hỗ trợ 24/7</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearHistory}
                  title="Xóa lịch sử trò chuyện"
                  className="p-1.5 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body tin nhắn */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 flex flex-col">
            {messages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 my-auto">
                <div className="h-16 w-16 bg-blue-50 rounded-3xl flex items-center justify-center mb-4 text-blue-600 shadow-inner">
                  <Bot className="h-8 w-8 text-indigo-600" />
                </div>
                <h4 className="font-bold text-slate-800 text-base mb-1">Xin chào {user.fullName || user.username}! 👋</h4>
                <p className="text-xs text-slate-500 max-w-[240px] leading-relaxed mb-6">
                  Tôi là Trợ lý AI EduMatch. Tôi có thể giải đáp các thắc mắc về tìm kiếm gia sư, đặt lịch học hoặc hướng dẫn nạp ví tiền!
                </p>

                {/* Quick suggestions if empty */}
                <div className="w-full space-y-2 mt-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-left mb-1.5">Gợi ý câu hỏi nhanh:</p>
                  {suggestions.map((sug) => (
                    <button
                      key={`sug1-${sug.text}`}
                      type="button"
                      onClick={() => handleSendMessage(sug.text)}
                      className="w-full text-left px-4 py-2.5 bg-white border border-slate-100 hover:border-blue-400 hover:bg-blue-50/30 rounded-2xl text-xs text-slate-600 font-medium transition-all shadow-sm flex items-center justify-between group"
                    >
                      <span>{sug.text}</span>
                      <Sparkles className="h-3 w-3 text-slate-300 group-hover:text-blue-500 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="text-center my-1">
                  <span className="px-3 py-1 bg-white border border-slate-200/60 rounded-full text-[9px] text-slate-400 font-bold uppercase tracking-widest shadow-sm">
                    Cuộc hội thoại bảo mật với AI
                  </span>
                </div>
                {messages.map((msg, idx) => {
                  const isMe = msg.sender === 'user';
                  const prevMsg = idx > 0 ? messages[idx - 1] : null;
                  const showDateDivider = !prevMsg || !isSameDay(prevMsg.created_at, msg.created_at);

                  return (
                    <React.Fragment key={msg.id || idx}>
                      {showDateDivider && (
                        <div className="flex justify-center my-4">
                          <span className="px-3 py-0.5 bg-slate-200/90 text-slate-600 rounded-full text-[10px] font-bold shadow-2xs tracking-tight">
                            {formatDateDivider(msg.created_at)}
                          </span>
                        </div>
                      )}
                      <div
                        className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}
                      >
                        <div className={`max-w-[85%] ${isMe ? 'order-1' : 'order-2'}`}>
                          <div className={`px-4 py-3.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                            isMe
                              ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-tr-none'
                              : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none'
                          }`}>
                            {isMe ? msg.message : formatMessageText(msg.message)}
                          </div>
                          <div className={`flex items-center gap-1 mt-1 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-[9px] text-slate-400 font-medium">
                              {formatSmartTime(msg.created_at)}
                            </span>
                            {isMe && <CheckCheck className="h-3 w-3 text-blue-400" />}
                          </div>
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
              </>
            )}

            {/* Loading typing bubble */}
            {loading && (
              <div className="flex justify-start animate-in fade-in duration-100">
                <div className="bg-white border border-slate-100 px-4 py-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions footer (if has history) */}
          {messages.length > 0 && !loading && (
            <div className="px-4 py-1.5 bg-slate-50/50 border-t border-slate-100 flex gap-2 overflow-x-auto scrollbar-none whitespace-nowrap">
              {suggestions.map((sug) => (
                <button
                  key={`sug2-${sug.text}`}
                  type="button"
                  onClick={() => handleSendMessage(sug.text)}
                  className="px-3 py-1 bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50 text-[10px] text-slate-500 font-bold rounded-full transition-all shadow-sm flex-shrink-0"
                >
                  {sug.label}
                </button>
              ))}
            </div>
          )}

          {/* Input Area */}
          <div className="p-3 border-t border-slate-100 bg-white">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Hỏi trợ lý ảo EduMatch..."
                disabled={loading}
                className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white disabled:opacity-75 transition-all"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="p-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl transition-all shadow-md shadow-indigo-100 flex-shrink-0 active:scale-95"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>

        </div>
      )}
    </>
  );
};

export default AIAssistantWidget;
