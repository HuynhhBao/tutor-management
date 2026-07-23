import React, { useState, useEffect, useRef } from 'react';
import { Send, FileText, Download, Paperclip, Image, FileArchive, HelpCircle, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../../utils/constants';

export default function ClassChat({ classId, socket, userRole, userId, userName }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Tải lịch sử tin nhắn từ cơ sở dữ liệu khi vào phòng
  useEffect(() => {
    async function loadChatHistory() {
      try {
        const res = await fetch(`${API_BASE_URL}/class-session/${classId}/messages`, { credentials: 'include' });
        const json = await res.json();
        if (json.status === 'ok') {
          setMessages(json.data || []);
        }
      } catch (err) {
        console.error('Lỗi khi tải lịch sử tin nhắn:', err);
      }
    }

    if (classId) {
      loadChatHistory();
    }
  }, [classId]);

  useEffect(() => {
    if (!socket) return;


    // Lắng nghe tin nhắn mới từ phòng học qua Socket.io
    socket.on('receive-message', (data) => {
      setMessages((prev) => [...prev, data]);
    });

    return () => {
      socket.off('receive-message');
    };
  }, [socket]);

  // Cuộn xuống tin nhắn cuối cùng tự động
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const messageData = {
      classId,
      senderId: userId,
      senderName: userName,
      senderRole: userRole,
      text: inputText,
      createdAt: new Date().toISOString()
    };

    // Gửi tin nhắn qua Socket
    socket.emit('send-message', messageData);

    // Lưu vào state của chính mình
    setMessages((prev) => [...prev, messageData]);
    setInputText('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Giới hạn 20MB ở client side
    if (file.size > 20 * 1024 * 1024) {
      alert('Kích thước file vượt quá 20MB. Vui lòng chọn file nhỏ hơn!');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE_URL}/class-session/upload`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const json = await res.json();
      if (json.status === 'ok') {
        const fileUrl = json.fileUrl || json.data?.fileUrl;
        const fileName = json.fileName || json.data?.fileName || file.name;
        const fileSize = json.fileSize || json.data?.fileSize || file.size;

        const fileMessageData = {
          classId,
          senderId: userId,
          senderName: userName,
          senderRole: userRole,
          text: `Đã chia sẻ tài liệu: ${fileName}`,
          fileUrl,
          fileName,
          fileSize,
          createdAt: new Date().toISOString()
        };

        // Gửi qua socket
        if (socket) {
          socket.emit('send-message', fileMessageData);
        }

        // Lưu vào chat của chính mình
        setMessages((prev) => [...prev, fileMessageData]);
      } else {
        alert(json.message || 'Không thể tải file lên');
      }
    } catch (err) {
      console.error('Lỗi khi tải file lên:', err);
      alert('Lỗi kết nối khi tải file. Vui lòng thử lại!');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatBytes = (bytes, decimals = 1) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  // Trả về icon phù hợp với định dạng file
  const getFileIcon = (fileName = '') => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) {
      return <Image className="w-8 h-8 text-blue-500" />;
    }
    if (['zip', 'rar', '7z', 'tar'].includes(ext)) {
      return <FileArchive className="w-8 h-8 text-amber-500" />;
    }
    return <FileText className="w-8 h-8 text-emerald-500" />;
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Chat header */}
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Trò chuyện trực tiếp</h3>
          <p className="text-[10px] text-slate-400 font-medium">Hộp thư được đồng bộ tức thì</p>
        </div>
        <div className="px-2.5 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold rounded-full border border-blue-100 uppercase tracking-wider">
          {messages.length} tin nhắn
        </div>
      </div>

      {/* Messages stream area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <HelpCircle className="w-10 h-10 text-slate-300 stroke-1 mb-2.5" />
            <p className="text-xs font-semibold">Chưa có tin nhắn nào</p>
            <p className="text-[10px] opacity-80 mt-0.5">Nhập tin nhắn hoặc chia sẻ tài liệu phía dưới nhé!</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderId === userId;
            const msgKey = msg.id || `${msg.senderId}_${msg.createdAt}_${idx}`;
            const cleanSender = (msg.senderName || '').replace(/\s*\((Học viên|Gia sư)\)\s*/gi, '').trim();
            return (
              <div
                key={msgKey}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
              >
                {/* Sender Name */}
                <span className="text-[10px] font-bold text-slate-400 px-1">
                  {cleanSender} ({msg.senderRole === 'tutor' ? 'Gia sư' : 'Học viên'})
                </span>

                {/* Message Box */}
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm text-xs leading-relaxed ${
                    isMe
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white text-slate-800 rounded-bl-none border border-slate-200/80'
                  }`}
                >
                  {/* File card display if shared file url exists */}
                  {msg.fileUrl ? (
                    <div className="flex flex-col gap-2.5">
                      <div className={`flex items-center gap-3 p-2.5 rounded-xl border ${
                        isMe ? 'bg-blue-700/50 border-blue-400/30 text-white' : 'bg-slate-100 border-slate-200 text-slate-800'
                      }`}>
                        {getFileIcon(msg.fileName)}
                        <div className="min-w-0 flex-1">
                          <p className={`font-bold truncate text-[11px] max-w-[150px] ${
                            isMe ? 'text-white' : 'text-slate-800'
                          }`}>
                            {msg.fileName}
                          </p>
                          <p className={`text-[9px] mt-0.5 ${
                            isMe ? 'text-blue-100' : 'text-slate-500'
                          }`}>
                            {formatBytes(msg.fileSize)}
                          </p>
                        </div>
                      </div>
                      <a
                        href={msg.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 font-bold text-[10px] rounded-lg transition-all shadow-sm ${
                          isMe 
                            ? 'bg-white text-blue-600 hover:bg-blue-50' 
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        <Download className="w-3.5 h-3.5" />
                        Tải tài liệu về
                      </a>
                    </div>
                  ) : (
                    <p className="whitespace-pre-line font-medium">{msg.text}</p>
                  )}
                </div>

                {/* Timestamp */}
                <span className="text-[9px] text-slate-400 px-1">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input controls form */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 bg-white space-y-2">
        <div className="flex items-center gap-2">
          {/* File attach button */}
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all active:scale-95 disabled:opacity-50"
            title="Đính kèm tài liệu học tập"
          >
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
            ) : (
              <Paperclip className="w-5 h-5" />
            )}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.xls,.xlsx,.zip"
          />

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Nhập lời nhắn gửi lớp học..."
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />

          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 text-white disabled:text-slate-400 rounded-xl transition-all active:scale-95 shadow-md shadow-blue-100 disabled:shadow-none"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
