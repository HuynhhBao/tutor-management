import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Send, 
  Search, 
  User, 
  MoreVertical, 
  Phone, 
  Video, 
  Info,
  MessageSquare,
  Clock,
  CheckCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const API_BASE = 'http://localhost:3001/api';

const ChatPage = () => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingMessages, setFetchingMessages] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 1. Lấy danh sách hội thoại
  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/chat/conversations`, { credentials: 'include' });
      const data = await res.json();
      if (data.status === 'ok') {
        setConversations(data.data);
      }
    } catch (err) {
      console.error('fetchConversations error:', err);
    }
  }, []);

  // 2. Lấy lịch sử tin nhắn
  const fetchMessages = useCallback(async (partnerId, partnerType) => {
    if (!partnerId) return;
    setFetchingMessages(true);
    try {
      const res = await fetch(`${API_BASE}/chat/messages/${partnerId}/${partnerType}`, { credentials: 'include' });
      const data = await res.json();
      if (data.status === 'ok') {
        setMessages(data.data);
      }
    } catch (err) {
      console.error('fetchMessages error:', err);
    } finally {
      setFetchingMessages(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
    // Polling danh sách hội thoại mỗi 10s
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedPartner) {
      fetchMessages(selectedPartner.id, selectedPartner.partner_type);
      // Polling tin nhắn mới mỗi 3s
      const interval = setInterval(() => {
        fetchMessages(selectedPartner.id, selectedPartner.partner_type);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [selectedPartner, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 3. Gửi tin nhắn
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedPartner) return;

    const msgContent = newMessage;
    setNewMessage('');

    try {
      const res = await fetch(`${API_BASE}/chat/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          receiverId: selectedPartner.id,
          receiverType: selectedPartner.partner_type,
          content: msgContent
        }),
      });
      const data = await res.json();
      if (data.status === 'ok') {
        setMessages(prev => [...prev, data.data]);
        fetchConversations(); // Cập nhật lại danh sách hội thoại để hiện tin nhắn mới nhất
      }
    } catch (err) {
      console.error('handleSendMessage error:', err);
    }
  };

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in duration-500">
      {/* Sidebar - Danh sách hội thoại */}
      <div className="w-full md:w-80 lg:w-96 border-r border-slate-100 flex flex-col bg-slate-50/30">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-slate-900 mb-6">Trò chuyện</h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm cuộc hội thoại..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-6">
          {conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
              <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
              <p className="text-sm">Chưa có cuộc trò chuyện nào.</p>
              <p className="text-xs mt-1">Các cuộc trò chuyện sẽ tự động hiện lên khi gia sư xác nhận lịch học của bạn.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {conversations.map((conv) => (
                <button
                  key={`${conv.id}-${conv.partner_type}`}
                  onClick={() => setSelectedPartner(conv)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all ${
                    selectedPartner?.id === conv.id 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-100' 
                      : 'hover:bg-white text-slate-600'
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    {conv.avatar_url ? (
                      <img 
                        src={`http://localhost:3001${conv.avatar_url}`} 
                        alt={conv.full_name} 
                        className="h-12 w-12 rounded-full object-cover border-2 border-white"
                      />
                    ) : (
                      <div className={`h-12 w-12 rounded-full flex items-center justify-center font-bold text-lg ${
                        selectedPartner?.id === conv.id ? 'bg-blue-500 text-white' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {conv.full_name?.charAt(0) || 'U'}
                      </div>
                    )}
                    <div className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <h4 className={`font-bold truncate ${selectedPartner?.id === conv.id ? 'text-white' : 'text-slate-900'}`}>
                        {conv.full_name}
                      </h4>
                      <span className={`text-[10px] ${selectedPartner?.id === conv.id ? 'text-blue-100' : 'text-slate-400'}`}>
                        {new Date(conv.last_message_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className={`text-xs truncate ${selectedPartner?.id === conv.id ? 'text-blue-100' : 'text-slate-500'}`}>
                      {conv.last_message}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Window */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedPartner ? (
          <>
            {/* Chat Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {selectedPartner.avatar_url ? (
                    <img 
                      src={`http://localhost:3001${selectedPartner.avatar_url}`} 
                      alt={selectedPartner.full_name} 
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                      {selectedPartner.full_name?.charAt(0)}
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-emerald-500 border-2 border-white rounded-full"></div>
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{selectedPartner.full_name}</h3>
                  <div className="flex items-center gap-1">
                    <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Đang hoạt động</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                  <Phone className="h-5 w-5" />
                </button>
                <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                  <Video className="h-5 w-5" />
                </button>
                <button className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all">
                  <Info className="h-5 w-5" />
                </button>
                <button className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all md:hidden">
                  <MoreVertical className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
              {fetchingMessages && messages.length === 0 ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <>
                  <div className="flex justify-center mb-8">
                    <span className="px-4 py-1.5 bg-white border border-slate-200 rounded-full text-[10px] text-slate-400 font-bold uppercase tracking-widest shadow-sm">
                      Bắt đầu cuộc hội thoại
                    </span>
                  </div>
                  {messages.map((msg, idx) => {
                    const isMe = msg.sender_id === user.id && 
                               ((user.role === 'user' && msg.sender_type === 'user') || 
                                (user.role === 'tutor' && msg.sender_type === 'tutor'));
                    return (
                      <div key={msg.id || idx} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`max-w-[75%] lg:max-w-[60%] ${isMe ? 'order-1' : 'order-2'}`}>
                          <div className={`px-5 py-3.5 rounded-2xl shadow-sm text-sm leading-relaxed ${
                            isMe 
                              ? 'bg-blue-600 text-white rounded-br-none' 
                              : 'bg-white text-slate-700 border border-slate-100 rounded-bl-none'
                          }`}>
                            {msg.content}
                          </div>
                          <div className={`flex items-center gap-1.5 mt-1.5 px-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && <CheckCheck className="h-3 w-3 text-blue-400" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Chat Input */}
            <div className="p-6 border-t border-slate-100 bg-white">
              <form onSubmit={handleSendMessage} className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="w-full pl-6 pr-12 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                  />
                  <button 
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-slate-400 hover:text-blue-600 transition-colors"
                  >
                    <MoreVertical className="h-5 w-5 rotate-90" />
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="p-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl transition-all shadow-lg shadow-blue-100 active:scale-95 flex-shrink-0"
                >
                  <Send className="h-5 w-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/30 p-12 text-center">
            <div className="w-24 h-24 bg-white rounded-3xl shadow-xl border border-slate-100 flex items-center justify-center mb-8 animate-bounce duration-1000">
              <MessageSquare className="h-10 w-10 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Chào mừng bạn đến với mục Trò chuyện!</h2>
            <p className="max-w-md text-sm leading-relaxed">
              Chọn một cuộc hội thoại từ danh sách bên trái để bắt đầu trao đổi nội dung học tập và giải đáp các thắc mắc ngay lập tức.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
