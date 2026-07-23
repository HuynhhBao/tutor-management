import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { useAuth } from '../../context/AuthContext';
import { useAlert } from '../../context/AlertContext';
import { Video, Trash2, ArrowLeft, Loader2, PenTool } from 'lucide-react';
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

  // 1. Fetch Class/Booking details
  useEffect(() => {
    async function getClassDetails() {
      try {
        setLoading(true);
        const endpoint = user?.role === 'tutor' 
          ? `${API_BASE_URL}/tutor/bookings` 
          : `${API_BASE_URL}/student/bookings`;
        
        const res = await fetch(endpoint, { credentials: 'include' });
        const json = await res.json();
        
        if (json.status === 'ok') {
          const list = json.data || [];
          const currentClass = list.find(b => b.id === parseInt(classId));
          if (currentClass) {
            setClassInfo(currentClass);
          } else {
            showAlert('Bạn không có quyền tham gia lớp học này.');
            navigate(user?.role === 'tutor' ? '/tutor-dashboard/my-classes' : '/student-dashboard/booking-history');
          }
        }
      } catch (err) {
        console.error('Error fetching class details:', err);
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
      console.log('Connected to socket server for classroom:', socketConn.id);
      if (user) {
        socketConn.emit('join-class', {
          classId,
          user: { id: user.id, fullName: user.fullName, role: user.role }
        });
      }
    });

    socketConn.on('room-presence', ({ members }) => {
      console.log('Room presence updated:', members);
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
  const getContext = () => {
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
  };

  // Helper lưu snapshot canvas lên server
  const saveCanvasSnapshot = async (canvas) => {
    if (!canvas || canvas.width === 0 || canvas.height === 0) return;
    try {
      const dataUrl = canvas.toDataURL('image/png');
      console.log(`[Canvas] Saving snapshot for class ${classId}, size: ${Math.round(dataUrl.length / 1024)}KB`);
      const res = await fetch(`${API_BASE_URL}/class-session/${classId}/snapshot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ snapshot: dataUrl })
      });
      const json = await res.json();
      console.log('[Canvas] Save response:', json.status);
    } catch (err) {
      console.error('Lỗi lưu snapshot bảng vẽ:', err);
    }
  };

  // Helper load snapshot từ server và vẽ lên canvas
  const loadCanvasSnapshot = async () => {
    try {
      console.log(`[Canvas] Loading snapshot for class ${classId}...`);
      const res = await fetch(`${API_BASE_URL}/class-session/${classId}/snapshot`, { credentials: 'include' });
      const json = await res.json();
      const snapshotData = json.snapshot || json.data?.snapshot;
      console.log('[Canvas] Load response status:', json.status, 'has snapshot:', !!snapshotData);
      if (json.status === 'ok' && snapshotData) {
        const img = new Image();
        img.onload = () => {
          const ctx = getContext();
          if (!ctx) return;
          ctx.drawImage(img, 0, 0);
          console.log('[Canvas] Snapshot drawn onto canvas successfully.');
        };
        img.src = snapshotData;
      }
    } catch (err) {
      console.error('Lỗi load snapshot bảng vẽ:', err);
    }
  };

  // 3. Canvas Whiteboard initialization - khởi tạo và load snapshot khi vào/quay lại whiteboard
  useEffect(() => {
    if (activeTab === 'whiteboard') {
      // Canvas vừa được mount lại - reset context ref để dùng canvas mới
      contextRef.current = null;
      // Khởi tạo canvas sau khi DOM đã render xong
      setTimeout(async () => {
        getContext(); // init canvas trắng
        // Nếu không có offscreen cache (tải lại trang), load từ DB
        if (!offscreenCanvasRef.current) {
          await loadCanvasSnapshot();
        }
      }, 30);
    }
  }, [activeTab]);

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
  }, [activeTab, classId]);

  // Lắng nghe đồng bộ nét vẽ từ Socket.io
  useEffect(() => {
    if (!socket) return;

    socket.on('draw-sync', (data) => {
      console.log('Classroom socket received draw-sync:', data);
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
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    });

    return () => {
      socket.off('draw-sync');
      socket.off('clear-board');
    };
  }, [socket, activeTab]);

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

    const { x, y, ratioX, ratioY } = getCoordinates(e);
    lastPointRef.current = { x, y, ratioX, ratioY };
    setIsDrawing(true);
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
      console.log('Classroom socket emitting draw-sync:', {
        classId,
        x1: lastPoint.ratioX,
        y1: lastPoint.ratioY,
        x2: ratioX,
        y2: ratioY,
        color: activeColor,
        size: activeWidth
      });
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

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
        <p className="text-sm font-bold text-slate-300">Đang chuẩn bị phòng học trực tuyến...</p>
      </div>
    );
  }

  const roleLabel = user?.role === 'tutor' ? 'Gia sư' : 'Học viên';
  const partnerName = user?.role === 'tutor' ? classInfo?.student_name : classInfo?.tutor_name;

  const displayUserName = user?.fullName?.replace(/\s*\((Học viên|Gia sư)\)\s*/gi, '').trim() || '';

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex flex-col font-sans overflow-y-auto">
      
      {/* Top Classroom Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-5 py-3.5 flex items-center justify-between shrink-0">
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
              Lớp học trực tuyến của {user?.role === 'tutor' ? 'Gia sư ' + displayUserName : 'Học viên ' + displayUserName}
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

      {/* Main Body - Tự động có thanh cuộn mượt mà khi thu nhỏ cửa sổ */}
      <div className="flex-1 flex flex-col lg:flex-row p-4 gap-4 overflow-y-auto min-h-0">
        
        {/* Left Side: Teaching Screen (Whiteboard or Video call) */}
        <div className="flex-1 flex flex-col min-h-[480px] lg:h-full bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden relative">
          
          {/* A. Whiteboard Screen */}
          {activeTab === 'whiteboard' && (
            <div className="flex-1 flex flex-col relative bg-white w-full h-full min-h-0 overflow-hidden">
              {/* Whiteboard Controls Overlay */}
              <div className="absolute top-4 left-4 z-10 flex items-center gap-3.5 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-800 shadow-xl">
                {/* Colors picker */}
                <div className="flex items-center gap-2">
                  {['#2563eb', '#dc2626', '#16a34a', '#0f172a'].map((c) => (
                    <button
                      key={c}
                      onClick={() => {
                        setColor(c);
                        setIsEraser(false);
                      }}
                      className={`w-6 h-6 rounded-full border transition-all ${
                        color === c && !isEraser ? 'scale-125 border-white ring-2 ring-blue-500' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>

                <div className="h-6 w-px bg-slate-800" />

                {/* Brush size slider */}
                <input
                  type="range"
                  min="2"
                  max="12"
                  value={lineWidth}
                  onChange={(e) => setLineWidth(parseInt(e.target.value))}
                  className="w-20 accent-blue-500 cursor-pointer"
                  title="Độ dày nét vẽ"
                />

                <div className="h-6 w-px bg-slate-800" />

                {/* Pen Tool, Eraser & Clear */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEraser(false)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all flex items-center gap-1.5 ${
                      !isEraser 
                        ? 'bg-blue-600 border-blue-500 text-white' 
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                    title="Chế độ Bút vẽ"
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    <span>Bút vẽ</span>
                  </button>
                  <button
                    onClick={() => setIsEraser(true)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                      isEraser 
                        ? 'bg-amber-600 border-amber-500 text-white' 
                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                    }`}
                    title="Chế độ Tẩy xóa"
                  >
                    Tẩy xóa
                  </button>
                  <button
                    onClick={clearBoard}
                    className="p-1.5 bg-slate-800 hover:bg-rose-950 border border-slate-700 hover:border-rose-900 text-rose-400 hover:text-rose-300 rounded-lg transition-all"
                    title="Xóa toàn bộ bảng"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
          <div className={`flex-1 p-4 bg-slate-950 flex flex-col h-full ${activeTab === 'video' ? '' : 'hidden'}`}>
            <VideoCallArea 
              classId={classId} 
              socket={socket}
              userRole={user?.role} 
              userName={user?.fullName || ''}
              partnerName={partnerName}
              roomMembers={roomMembers}
              cameraActive={cameraActive}
              onCameraToggle={() => setCameraActive(prev => !prev)}
              micActive={micActive}
              onMicToggle={() => setMicActive(prev => !prev)}
              onLeaveRoom={handleLeaveRoom}
            />
          </div>
        </div>

        {/* Right Side: Chat & File Sharing Container */}
        <div className="w-full lg:w-[350px] xl:w-[380px] min-h-[350px] lg:h-full flex flex-col shrink-0">
          <ClassChat
            classId={classId}
            socket={socket}
            userRole={user?.role}
            userId={user?.id}
            userName={user?.fullName || ''}
          />
        </div>

      </div>
    </div>
  );
}
