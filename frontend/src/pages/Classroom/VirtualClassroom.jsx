import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { Video, Trash2, ArrowLeft, Loader2, PenTool, Undo2, Eraser } from 'lucide-react';
import { API_BASE_URL } from '../../utils/constants';
import VideoCallArea from '../../components/classroom/VideoCallArea';
import ClassChat from '../../components/classroom/ClassChat';

export default function VirtualClassroom() {
  const { classId } = useParams();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const navigate = useNavigate();

  const [classInfo, setClassInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [activeTab, setActiveTab] = useState('whiteboard'); // 'whiteboard' | 'video'
  const [roomMembers, setRoomMembers] = useState([]);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  // Video Call states - lưu vào localStorage để giữ nguyên khi F5 reload trang
  const [cameraActive, setCameraActive] = useState(() => {
    const saved = localStorage.getItem(`classroom_camera_${classId}`);
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [micActive, setMicActive] = useState(() => {
    const saved = localStorage.getItem(`classroom_mic_${classId}`);
    return saved !== null ? JSON.parse(saved) : true;
  });

  useEffect(() => {
    if (classId) {
      localStorage.setItem(`classroom_camera_${classId}`, JSON.stringify(cameraActive));
    }
  }, [cameraActive, classId]);

  useEffect(() => {
    if (classId) {
      localStorage.setItem(`classroom_mic_${classId}`, JSON.stringify(micActive));
    }
  }, [micActive, classId]);

  // Canvas Whiteboard states
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  // Offscreen canvas để lưu trữ nội dung bảng vẽ khi chuyển tab
  const offscreenCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#2563eb'); // Mặc định xanh dương
  const [lineWidth, setLineWidth] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const [history, setHistory] = useState([]); // Lưu mảng ImageData để undo
  const [isHoveringToolbar, setIsHoveringToolbar] = useState(false);

  // 1. Fetch Class/Booking details
  useEffect(() => {
    async function getClassDetails() {
      try {
        setLoading(true);
        const endpoint = user.role === 'tutor' 
          ? `${API_BASE_URL}/tutor/bookings` 
          : `${API_BASE_URL}/student/bookings`;
        
        const res = await fetch(endpoint, { credentials: 'include' });
        const json = await res.json();
        
        if (json.status === 'ok') {
          const list = json.data || [];
          const currentClass = list.find(b => b.id === Number.parseInt(classId, 10));
          if (currentClass) {
            setClassInfo(currentClass);
          } else {
            showAlert('Bạn không có quyền tham gia lớp học này.');
            navigate(user.role === 'tutor' ? '/tutor-dashboard/my-classes' : '/student-dashboard/booking-history');
          }
        }
      } catch (err) {
        console.error('Lỗi khi lấy thông tin lớp học:', err);
        showAlert('Có lỗi xảy ra khi lấy thông tin lớp học.');
      } finally {
        setLoading(false);
      }
    }

    if (user && classId) {
      getClassDetails();
    }
  }, [classId, user, navigate, showAlert]);

  // 2. Initialize Socket.io Connection
  useEffect(() => {
    if (!classId) return;

    // Lấy hostname để thiết lập kết nối Socket động
    const socketHost = window.location.hostname === 'localhost' ? 'http://localhost:3001' : window.location.origin;
    const socketConn = io(socketHost, { transports: ['websocket'] });


    socketConn.on('connect', () => {
      if (user) {
        socketConn.emit('join-class', {
          classId,
          user: { id: user.id, fullName: user.fullName, role: user.role }
        });
      }
    });

    socketConn.on('room-presence', ({ members }) => {
      setRoomMembers(members || []);
    });

    setSocket(socketConn);

    return () => {
      socketConn.disconnect();
    };
  }, [classId, user]);

  const lastPointRef = useRef(null);
  // Debounce timer ref để auto-save snapshot sau khi vẽ
  const saveTimerRef = useRef(null);

  // Helper lấy context vẽ an toàn và khởi tạo canvas khi sẵn sàng
  const getContext = useCallback(() => {
    if (contextRef.current) return contextRef.current;
    const canvas = canvasRef.current;
    if (!canvas) return null;

    canvas.width = 1600;
    canvas.height = 1000;

    const context = canvas.getContext('2d');
    context.lineCap = 'round';
    context.lineJoin = 'round';

    // Đặt nền trắng cho canvas
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Khôi phục nội dung từ offscreen canvas nếu có (khi chuyển tab)
    if (offscreenCanvasRef.current) {
      context.drawImage(offscreenCanvasRef.current, 0, 0);
    }

    contextRef.current = context;
    return context;
  }, []);

  // Helper lưu snapshot canvas lên server
  const saveCanvasSnapshot = useCallback(async (canvas) => {
    if (!canvas || canvas.width === 0 || canvas.height === 0) return;
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const res = await fetch(`${API_BASE_URL}/class-session/${encodeURIComponent(classId)}/snapshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ snapshot: dataUrl })
      });
      await res.json();
    } catch (err) {
      console.error('Lỗi khi lưu snapshot:', err);
      // Bỏ qua nếu lỗi lưu snapshot background
    }
  }, [classId]);

  // Helper load snapshot từ server và vẽ lên canvas
  const loadCanvasSnapshot = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/class-session/${encodeURIComponent(classId)}/snapshot`, { credentials: 'include' });
      const json = await res.json();
      const snapshotData = json.snapshot || json.data?.snapshot;
      if (json.status === 'ok' && snapshotData) {
        const img = new Image();
        img.onload = () => {
          const ctx = getContext();
          if (!ctx) return;
          ctx.drawImage(img, 0, 0);
        };
        img.src = snapshotData;
      }
    } catch (err) {
      console.error('Lỗi khi tải bảng vẽ cũ:', err);
      showAlert('Không thể tải dữ liệu bảng vẽ cũ.');
    }
  }, [classId, getContext, showAlert]);

  // 3. Canvas Whiteboard initialization - khởi tạo và load snapshot khi vào/quay lại whiteboard
  useEffect(() => {
    if (activeTab === 'whiteboard') {
      // Canvas vừa được mount lại - reset context ref để dùng canvas mới
      contextRef.current = null;
      // Khởi tạo canvas sau khi DOM đã render xong
      const timer = setTimeout(async () => {
        getContext(); // init canvas trắng
        // Nếu không có offscreen cache (tải lại trang), load từ DB
        if (!offscreenCanvasRef.current) {
          await loadCanvasSnapshot();
        }
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [activeTab, getContext, loadCanvasSnapshot]);

  // Hàm chuyển tab - lưu nội dung canvas TRƯỚC khi React unmount canvas
  const handleTabChange = (newTab) => {
    if (newTab === activeTab) return;
    // Nếu đang ở whiteboard và chuyển sang tab khác: lưu canvas ngay lập tức
    if (activeTab === 'whiteboard') {
      const canvas = canvasRef.current;
      if (canvas && canvas.width > 0 && canvas.height > 0) {
        // Lưu vào offscreen (cache local)
        const offscreen = document.createElement('canvas');
        offscreen.width = canvas.width;
        offscreen.height = canvas.height;
        const offCtx = offscreen.getContext('2d');
        offCtx.drawImage(canvas, 0, 0);
        offscreenCanvasRef.current = offscreen;
        // Lưu lên server (background, không chờ)
        saveCanvasSnapshot(canvas);
      }
      // Reset context ref vì canvas sắp bị unmount
      contextRef.current = null;
    }
    setActiveTab(newTab);
  };

  // Auto-save khi người dùng rời trang (F5, đóng tab, điều hướng)
  useEffect(() => {
    const handleBeforeUnload = () => {
      const canvas = canvasRef.current;
      if (canvas && canvas.width > 0 && canvas.height > 0 && activeTab === 'whiteboard') {
        saveCanvasSnapshot(canvas);
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [activeTab, classId, saveCanvasSnapshot]);

  // Lắng nghe đồng bộ nét vẽ từ Socket.io
  useEffect(() => {
    if (!socket) return;

    socket.on('draw-sync', (data) => {
      if (activeTab !== 'whiteboard') return;
      
      const ctx = getContext();
      if (!ctx) return;

      const canvas = canvasRef.current;
      // Quy đổi tọa độ tương đối sang tọa độ thực tế của canvas 1600x1000
      const x1 = data.x1 * canvas.width;
      const y1 = data.y1 * canvas.height;
      const x2 = data.x2 * canvas.width;
      const y2 = data.y2 * canvas.height;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = data.color;
      ctx.lineWidth = data.size;
      ctx.stroke();
      ctx.closePath();
    });

    socket.on('clear-board', () => {
      const ctx = getContext();
      if (!ctx) return;
      const canvas = canvasRef.current;
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory(prev => [...prev.slice(-9), imageData]);
      
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });

    socket.on('undo-board', () => {
      setHistory(prev => {
        if (prev.length === 0) return prev;
        const previousState = prev.at(-1);
        const ctx = getContext();
        if (ctx) ctx.putImageData(previousState, 0, 0);
        return prev.slice(0, -1);
      });
    });

    return () => {
      socket.off('draw-sync');
      socket.off('clear-board');
      socket.off('undo-board');
    };
  }, [socket, activeTab, getContext]);

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0, ratioX: 0, ratioY: 0 };
    const rect = canvas.getBoundingClientRect();
    
    // Lấy toạ độ chuột hoặc chạm cảm ứng
    let clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const relativeX = (clientX - rect.left) / rect.width;
    const relativeY = (clientY - rect.top) / rect.height;

    return {
      x: relativeX * canvas.width,
      y: relativeY * canvas.height,
      ratioX: relativeX,
      ratioY: relativeY
    };
  };

  const startDrawing = (e) => {
    const ctx = getContext();
    const canvas = canvasRef.current;
    if (!canvas || !ctx) return;

    // Lưu trạng thái trước khi vẽ để Undo (lưu tối đa 10 trạng thái gần nhất)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory(prev => [...prev.slice(-9), imageData]);

    const { x, y, ratioX, ratioY } = getCoordinates(e);
    lastPointRef.current = { x, y, ratioX, ratioY };
    setIsDrawing(true);
  };

  const undo = () => {
    if (history.length === 0) return;
    const ctx = getContext();
    const canvas = canvasRef.current;
    if (!canvas || !ctx) return;

    const previousState = history[history.length - 1];
    ctx.putImageData(previousState, 0, 0);
    
    setHistory(prev => prev.slice(0, -1));

    if (socket) {
      socket.emit('undo-board', { classId });
    }
    
    saveCanvasSnapshot(canvas);
  };

  const draw = (e) => {
    if (!isDrawing || !lastPointRef.current) return;
    const ctx = getContext();
    const canvas = canvasRef.current;
    if (!canvas || !ctx) return;

    const { x, y, ratioX, ratioY } = getCoordinates(e);
    const lastPoint = lastPointRef.current;
    const activeColor = isEraser ? '#ffffff' : color;
    const activeWidth = isEraser ? 35 : lineWidth; // Tăng kích thước tẩy xóa lên

    // Vẽ nét cục bộ
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(x, y);
    ctx.strokeStyle = activeColor;
    ctx.lineWidth = activeWidth;
    ctx.stroke();
    ctx.closePath();

    // Đồng bộ nét vẽ qua Socket
    if (socket) {
      socket.emit('draw-sync', {
        classId,
        x1: lastPoint.ratioX,
        y1: lastPoint.ratioY,
        x2: ratioX,
        y2: ratioY,
        color: activeColor,
        size: activeWidth
      });
    }

    // Lưu điểm hiện tại làm điểm bắt đầu cho phân đoạn tiếp theo
    lastPointRef.current = { x, y, ratioX, ratioY };
    e.preventDefault();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    lastPointRef.current = null;
    // Auto-save snapshot lên DB 800ms sau khi người dùng nhấc cắt bút (debounce)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      const canvas = canvasRef.current;
      if (canvas && canvas.width > 0 && canvas.height > 0) {
        saveCanvasSnapshot(canvas);
      }
    }, 800);
  };




  const clearBoard = () => {
    const ctx = getContext();
    const canvas = canvasRef.current;
    if (!canvas || !ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory(prev => [...prev.slice(-9), imageData]);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Lưu trạng thái bảng trắng lên DB ngay lập tức
    saveCanvasSnapshot(canvas);

    if (socket) {
      socket.emit('clear-board', { classId });
    }
  };

  const handleLeaveRoom = () => {
    setShowLeaveModal(true);
  };

  const confirmLeaveRoom = () => {
    setShowLeaveModal(false);
    // Lưu snapshot bảng vẽ lần cuối nếu có
    const canvas = canvasRef.current;
    if (canvas && canvas.width > 0 && canvas.height > 0) {
      saveCanvasSnapshot(canvas);
    }
    if (socket) {
      socket.disconnect();
    }
    const redirectPath = user?.role === 'tutor' 
      ? '/tutor-dashboard/my-classes' 
      : '/student-dashboard/booking-history';
    navigate(redirectPath);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-300">Đang chuẩn bị phòng học trực tuyến...</p>
      </div>
    );
  }

  const partnerName = user.role === 'tutor' ? classInfo?.student_name : classInfo?.tutor_name;

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-hidden">
      
      {/* Top Classroom Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handleLeaveRoom}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all active:scale-95"
            title="Thoát phòng học"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-md uppercase tracking-wider">
                Môn: {classInfo?.subject}
              </span>
              <span className="text-xs text-slate-400">ID Lớp: #{classId}</span>
            </div>
            <h1 className="text-base font-bold text-white mt-0.5">
              Lớp học trực tuyến của {user.role === 'tutor' ? 'Gia sư ' + user.fullName : 'Học viên ' + user.fullName}
            </h1>

          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-800 p-1 rounded-xl border border-slate-700">
          <button
            onClick={() => handleTabChange('whiteboard')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'whiteboard' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <PenTool className="w-4 h-4" />
            <span>Bảng vẽ trực tuyến</span>
          </button>
          <button
            onClick={() => handleTabChange('video')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'video' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Phòng Video Call</span>
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 flex flex-col lg:flex-row p-4 lg:p-6 gap-4 lg:gap-6 overflow-hidden min-h-0">
        
        {/* Left Side: Teaching Screen (Whiteboard or Video call) */}
        <div className="flex-1 flex flex-col h-full bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden relative min-h-[450px]">
          
          {/* A. Whiteboard Screen */}
          {activeTab === 'whiteboard' && (
            <div className="flex-1 flex flex-col relative bg-white">
              {/* Whiteboard Controls Overlay - Vertical, Left, Auto-hide */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 left-0 z-10 py-4 px-1"
                onMouseEnter={() => setIsHoveringToolbar(true)}
                onMouseLeave={() => setIsHoveringToolbar(false)}
              >
                <div className={`flex flex-col items-center gap-2.5 bg-slate-900/95 backdrop-blur-md p-2 rounded-r-2xl border-y border-r border-slate-700 shadow-2xl transition-transform duration-300 relative ${isHoveringToolbar ? 'translate-x-0' : '-translate-x-[80%]'}`}>
                  
                  {/* Grip icon to indicate it can be opened */}
                  <div className={`absolute -right-2 top-1/2 -translate-y-1/2 bg-slate-800 border border-slate-700 rounded-full w-5 h-10 flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-opacity ${isHoveringToolbar ? 'opacity-0' : 'opacity-100'}`}>
                     <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                     <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                     <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                  </div>

                  {/* Colors picker */}
                  <div className="flex flex-col items-center gap-2 pr-3 pl-0.5">
                    {['#2563eb', '#dc2626', '#16a34a', '#0f172a'].map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          setColor(c);
                          setIsEraser(false);
                        }}
                        className={`w-6 h-6 rounded-full border transition-all ${
                          color === c && !isEraser ? 'scale-110 border-white ring-[1.5px] ring-blue-500' : 'border-transparent'
                        }`}
                        style={{ backgroundColor: c }}
                        title="Chọn màu"
                      />
                    ))}
                  </div>

                  <div className="w-6 h-px bg-slate-700 pr-3" />

                  {/* Brush size slider - vertical */}
                  <div className="pr-3 h-20 flex items-center justify-center">
                    <input
                      type="range"
                      min="2"
                      max="12"
                      value={lineWidth}
                      onChange={(e) => setLineWidth(parseInt(e.target.value, 10))}
                      className="w-16 accent-blue-500 cursor-pointer -rotate-90"
                      title="Độ dày nét vẽ"
                    />
                  </div>

                  <div className="w-6 h-px bg-slate-700 pr-3" />

                  {/* Eraser */}
                  <div className="pr-3 pl-0.5">
                    <button
                      onClick={() => setIsEraser(!isEraser)}
                      className={`p-2 rounded-xl border transition-all ${
                        isEraser 
                          ? 'bg-amber-600 border-amber-500 text-white shadow-md shadow-amber-500/20' 
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700'
                      }`}
                      title="Tẩy xóa"
                    >
                      <Eraser className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="w-6 h-px bg-slate-700 pr-3" />

                  {/* Undo & Clear */}
                  <div className="flex flex-col items-center gap-2 pr-3 pl-0.5">
                    <button
                      onClick={undo}
                      disabled={history.length === 0}
                      className="p-2 bg-slate-800 hover:bg-blue-900 border border-slate-700 text-blue-400 hover:text-blue-300 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      title="Hoàn tác (Undo)"
                    >
                      <Undo2 className="w-4 h-4" />
                    </button>
                    
                    <button
                      onClick={clearBoard}
                      className="p-2 bg-slate-800 hover:bg-rose-950 border border-slate-700 hover:border-rose-900 text-rose-400 hover:text-rose-300 rounded-xl transition-all"
                      title="Xóa toàn bộ bảng"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Drawing Canvas */}
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-full cursor-crosshair touch-none bg-white"
              />
            </div>
          )}

          {/* B. Video Call Screen - dùng CSS ẩn thay vì unmount để giữ trạng thái camera/mic */}
          <div className={`flex-1 p-4 bg-slate-950 flex flex-col ${activeTab === 'video' ? '' : 'hidden'}`}>
            <VideoCallArea 
              classId={classId} 
              socket={socket}
              userRole={user.role} 
              userName={user.fullName}
              partnerName={partnerName}
              roomMembers={roomMembers}
              cameraActive={cameraActive}
              onCameraToggle={() => setCameraActive(prev => !prev)}
              micActive={micActive}
              onMicToggle={() => setMicActive(prev => !prev)}
              onLeaveRoom={handleLeaveRoom}
              isActive={activeTab === 'video'}
            />
          </div>
        </div>

        {/* Right Side: Chat & File Sharing Container */}
        <div className="w-full lg:w-[380px] flex flex-col overflow-hidden min-h-0">
          <ClassChat
            classId={classId}
            socket={socket}
            userRole={user.role}
            userId={user.id}
            userName={user.fullName}
          />
        </div>

      </div>

      {/* Leave Room Confirmation Modal */}
      {showLeaveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 rounded-3xl max-w-sm w-full shadow-2xl border border-slate-700 animate-in zoom-in-95 duration-200 overflow-hidden">
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-rose-500/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <ArrowLeft className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Rời phòng học?</h3>
              <p className="text-sm text-slate-400">
                Bạn có chắc chắn muốn rời khỏi lớp học trực tuyến này không? Kết nối video và âm thanh sẽ bị ngắt.
              </p>
            </div>
            
            <div className="p-4 bg-slate-900/50 border-t border-slate-800 flex gap-3 justify-end">
              <button
                onClick={() => setShowLeaveModal(false)}
                className="flex-1 px-5 py-2.5 rounded-xl font-semibold text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmLeaveRoom}
                className="flex-1 px-5 py-2.5 rounded-xl font-semibold text-white bg-rose-600 hover:bg-rose-500 transition-colors shadow-lg shadow-rose-500/20"
              >
                Đồng ý rời
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
