import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, Mic, MicOff, Phone, Monitor, Radio, UserCheck, Clock } from 'lucide-react';

export default function VideoCallArea({ 
  classId, 
  socket,
  userRole, 
  userName, 
  partnerName,
  roomMembers = [], 
  cameraActive, 
  onCameraToggle, 
  micActive, 
  onMicToggle,
  onLeaveRoom,
  isActive = true
}) {
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteScreenFrame, setRemoteScreenFrame] = useState(null);
  const [remoteMicActive, setRemoteMicActive] = useState(true);

  const localVideoRef = useRef(null);
  const localCameraRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);

  // Kiểm tra xem đối phương (Học viên hoặc Gia sư) đã vào phòng học hay chưa
  const isPartnerOnline = (roomMembers || []).some(m => m && (m.userRole !== userRole || (m.userName && m.userName !== userName)));

  // 1. Lắng nghe sự kiện truyền phát màn hình & trạng thái Micro từ đối phương qua Socket.io
  useEffect(() => {
    if (!socket) return;

    const handleFrame = (data) => {
      setRemoteScreenFrame(data.frame);
    };

    const handleStop = () => {
      setRemoteScreenFrame(null);
    };

    const handleRemoteMic = (data) => {
      setRemoteMicActive(data.micActive);
    };

    socket.on('screen-share-frame', handleFrame);
    socket.on('screen-share-stop', handleStop);
    socket.on('toggle-mic', handleRemoteMic);

    return () => {
      socket.off('screen-share-frame', handleFrame);
      socket.off('screen-share-stop', handleStop);
      socket.off('toggle-mic', handleRemoteMic);
    };
  }, [socket]);

  // Đồng bộ trạng thái Mic cá nhân sang đối phương khi micActive thay đổi
  useEffect(() => {
    if (socket && classId) {
      socket.emit('toggle-mic', { classId: String(classId), micActive });
    }
  }, [micActive, socket, classId]);

  // 2. Gán stream media vào thẻ <video> khi thẻ <video> được React mount
  useEffect(() => {
    const videoEl = localVideoRef.current;
    const cameraEl = localCameraRef.current;
    if (!videoEl) return;

    const playVideo = (el) => {
      if (isActive && el && el.srcObject) {
        el.play().catch(() => {});
      }
    };

    if (isScreenSharing && screenStreamRef.current) {
      if (videoEl.srcObject !== screenStreamRef.current) {
        videoEl.srcObject = screenStreamRef.current;
      }
      playVideo(videoEl);
      
      if (cameraActive && localStreamRef.current && cameraEl) {
        if (cameraEl.srcObject !== localStreamRef.current) {
          cameraEl.srcObject = localStreamRef.current;
        }
        playVideo(cameraEl);
      }
    } else if (cameraActive && localStreamRef.current) {
      if (videoEl.srcObject !== localStreamRef.current) {
        videoEl.srcObject = localStreamRef.current;
      }
      playVideo(videoEl);
    } else {
      videoEl.srcObject = null;
      if (cameraEl) cameraEl.srcObject = null;
    }

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        playVideo(videoEl);
        if (isScreenSharing && cameraActive) playVideo(cameraEl);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isScreenSharing, cameraActive, isActive]);

  // 3. Quản lý việc chụp & phát khung hình màn hình cá nhân sang đối phương qua Socket.io
  useEffect(() => {
    if (!isScreenSharing || !socket || !classId) return;

    const captureCanvas = document.createElement('canvas');
    const captureCtx = captureCanvas.getContext('2d');

    const intervalId = setInterval(() => {
      const videoEl = localVideoRef.current;
      if (videoEl && (videoEl.videoWidth > 0 || videoEl.readyState >= 1)) {
        const w = videoEl.videoWidth || 800;
        const h = videoEl.videoHeight || 450;
        captureCanvas.width = Math.min(w, 960);
        captureCanvas.height = Math.min(h, 540);
        
        // Vẽ màn hình được share
        captureCtx.drawImage(videoEl, 0, 0, captureCanvas.width, captureCanvas.height);
        
        // Vẽ thêm camera (PiP) nếu camera đang bật
        const camEl = localCameraRef.current;
        if (cameraActive && camEl && camEl.readyState >= 1) {
          const pipW = Math.max(120, captureCanvas.width * 0.2); // 20% chiều rộng
          const pipH = (camEl.videoHeight / (camEl.videoWidth || 1)) * pipW || (pipW * 0.75);
          const pipX = captureCanvas.width - pipW - 16;
          const pipY = captureCanvas.height - pipH - 16;
          
          // Vẽ viền cho PiP
          captureCtx.fillStyle = '#1e293b';
          captureCtx.fillRect(pipX - 2, pipY - 2, pipW + 4, pipH + 4);
          
          // Vẽ camera (lật ngang)
          captureCtx.save();
          captureCtx.translate(pipX + pipW, pipY);
          captureCtx.scale(-1, 1);
          captureCtx.drawImage(camEl, 0, 0, pipW, pipH);
          captureCtx.restore();
        }

        const frameData = captureCanvas.toDataURL('image/jpeg', 0.5);
        socket.emit('screen-share-frame', {
          classId: String(classId),
          frame: frameData
        });
      }
    }, 150);

    return () => {
      clearInterval(intervalId);
      socket.emit('screen-share-stop', { classId: String(classId) });
    };
  }, [isScreenSharing, socket, classId, cameraActive]);

  const stopAllLocalTracks = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
  }, []);

  // 4. Quản lý luồng Camera & Micro local
  useEffect(() => {
    async function handleMediaStream() {
      if (cameraActive || micActive) {
        try {
          if (!localStreamRef.current) {
            const constraints = {
              video: cameraActive ? { width: 640, height: 480, frameRate: 20 } : false,
              audio: micActive
            };
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            localStreamRef.current = stream;
          } else {

            const videoTracks = localStreamRef.current.getVideoTracks();
            if (cameraActive && videoTracks.length === 0) {
              const videoStream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, frameRate: 20 } });
              const newVideoTrack = videoStream.getVideoTracks()[0];
              localStreamRef.current.addTrack(newVideoTrack);
            } else if (!cameraActive && videoTracks.length > 0) {
              videoTracks.forEach(t => {
                t.stop();
                localStreamRef.current.removeTrack(t);
              });
            }

            const audioTracks = localStreamRef.current.getAudioTracks();
            if (micActive && audioTracks.length === 0) {
              const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
              const newAudioTrack = audioStream.getAudioTracks()[0];
              localStreamRef.current.addTrack(newAudioTrack);
            } else if (audioTracks.length > 0) {
              audioTracks.forEach(t => {
                t.enabled = micActive;
              });
            }
          }
        } catch (err) {
          // Xử lý lỗi khi không thể mở thiết bị media
        }
      } else {
        stopAllLocalTracks();
      }
    }

    handleMediaStream();
  }, [cameraActive, micActive, stopAllLocalTracks]);

  // 5. Chức năng chia sẻ màn hình
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenSharing();
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        screenStreamRef.current = stream;
        setIsScreenSharing(true);

        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.onended = () => {
            stopScreenSharing();
          };
        }
      } catch (err) {
        // Người dùng đã hủy chia sẻ màn hình
      }
    }
  };

  const stopScreenSharing = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharing(false);

    if (socket && classId) {
      socket.emit('screen-share-stop', { classId: String(classId) });
    }
  };

  // 6. Chức năng rời phòng
  const handleLeave = () => {
    // Chỉ gọi callback để VirtualClassroom hiển thị Modal xác nhận
    // Các thao tác dọn dẹp (tắt cam, tắt mic, ngắt socket) sẽ tự động chạy 
    // khi component thực sự bị unmount (khi người dùng bấm Đồng ý rời).
    if (onLeaveRoom) {
      onLeaveRoom();
    }
  };

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      stopAllLocalTracks();
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [stopAllLocalTracks]);

  const oppositeRole = userRole === 'tutor' ? 'Học viên' : 'Gia sư';
  const oppositeName = partnerName || oppositeRole;

  return (
    <div className="flex flex-col h-full bg-slate-900 text-white rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative">
      {/* Top status bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-center pointer-events-none">
        <div className="bg-slate-950/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-800 flex items-center gap-2 pointer-events-auto">
          <span className={`w-2.5 h-2.5 rounded-full ${isPartnerOnline ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
            {isPartnerOnline ? 'Phòng học trực tiếp (2/2 đã vào)' : `Đang chờ ${oppositeRole} (1/2 người)`}
          </span>
        </div>
        <div className="bg-slate-950/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-800 flex items-center gap-1.5 pointer-events-auto">
          <Radio className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-[11px] font-medium text-slate-300">Băng thông: Tốt</span>
        </div>
      </div>

      {/* Main Dynamic View: Chỉ hiện 2 ô khi ĐÃ VÀO PHÒNG CẢ 2, hiện 1 ô khi CHƯA VÀO ĐỦ */}
      <div className={`flex-1 p-4 bg-slate-950 grid gap-4 transition-all duration-300 ${isPartnerOnline ? 'grid-cols-1 md:grid-cols-2 min-h-[300px]' : 'grid-cols-1 max-w-3xl mx-auto w-full min-h-[350px]'}`}>
        
        {/* 1. Remote Member View (Chỉ hiện khi ĐỐI PHƯƠNG ĐÃ VÀO PHÒNG) */}
        {isPartnerOnline && (
          <div className="relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center group shadow-inner">
            {remoteScreenFrame ? (
              <div className="absolute inset-0 bg-black flex items-center justify-center">
                <img 
                  src={remoteScreenFrame} 
                  alt="Shared Screen" 
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-3 left-3 bg-blue-600/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider shadow-md">
                  Màn hình chia sẻ từ {oppositeName}
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                <div className="text-center space-y-4">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-3xl font-bold shadow-lg shadow-blue-500/20 mx-auto animate-pulse">
                    {oppositeName[0]}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-200">{oppositeName}</h4>
                    <p className="text-xs text-emerald-400 font-semibold flex items-center justify-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" /> Đã tham gia phòng học
                    </p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
              </div>
            )}

            {/* User name label overlay */}
            <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-semibold flex items-center gap-1.5 z-10">
              <span className="w-2 h-2 bg-blue-500 rounded-full" />
              <span>{oppositeName} ({oppositeRole})</span>
              {!remoteMicActive && <MicOff className="w-3.5 h-3.5 text-red-500 ml-1" title="Đối phương đã tắt Micro" />}
            </div>
          </div>
        )}

        {/* 2. Local Member View (Luôn hiện khung của người đã vào) */}
        <div className="relative bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-inner">
          {(cameraActive || isScreenSharing) ? (
            <div className="absolute inset-0 bg-slate-950">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isScreenSharing ? '' : 'scale-x-[-1]'}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
              
              {/* Picture in Picture Camera */}
              {isScreenSharing && cameraActive && (
                <div className="absolute bottom-12 right-3 w-28 aspect-video bg-slate-950 rounded-lg overflow-hidden border-2 border-slate-700 shadow-2xl z-20">
                  <video
                    ref={localCameraRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                </div>
              )}

              {isScreenSharing && (
                <div className="absolute top-3 left-3 bg-blue-600/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider z-10">
                  Đang chia sẻ màn hình
                </div>
              )}
            </div>
          ) : (
            <div className="text-center space-y-3">
              <div className="w-20 h-20 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500 mx-auto">
                <CameraOff className="w-8 h-8" />
              </div>
              <p className="text-xs font-semibold text-slate-400">Bạn đã tắt Camera</p>
            </div>
          )}

          {/* Thông báo chưa có đối phương nếu chỉ có 1 người */}
          {!isPartnerOnline && (
            <div className="absolute top-3 left-3 bg-amber-950/90 text-amber-300 border border-amber-800/80 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg backdrop-blur-md z-10">
              <Clock className="w-4 h-4 animate-spin text-amber-400" />
              <span>Đang chờ {oppositeName} ({oppositeRole}) vào phòng...</span>
            </div>
          )}

          {/* User name label overlay */}
          <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-semibold flex items-center gap-1.5 z-10">
            <span className="w-2 h-2 bg-emerald-500 rounded-full" />
            <span>{userName} (Bạn)</span>
            {!micActive && <MicOff className="w-3.5 h-3.5 text-red-500 ml-1" />}
          </div>
        </div>
      </div>

      {/* Control Buttons Panel */}
      <div className="bg-slate-900 border-t border-slate-800 px-6 py-4 flex items-center justify-between gap-4 flex-wrap">

        {/* Core Media Controls */}
        <div className="flex items-center gap-4">
          {/* Button 1: Mở / Tắt Mic */}
          <button
            onClick={onMicToggle}
            title={micActive ? 'Tắt Micro' : 'Mở Micro'}
            className={`p-3.5 rounded-full transition-all border shadow-lg ${
              micActive 
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' 
                : 'bg-rose-600/90 border-rose-500 text-white hover:bg-rose-700'
            }`}
          >
            {micActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* Button 2: Camera */}
          <button
            onClick={onCameraToggle}
            title={cameraActive ? 'Tắt Camera' : 'Mở Camera'}
            className={`p-3.5 rounded-full transition-all border shadow-lg ${
              cameraActive 
                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' 
                : 'bg-rose-600/90 border-rose-500 text-white hover:bg-rose-700'
            }`}
          >
            {cameraActive ? <Camera className="w-5 h-5" /> : <CameraOff className="w-5 h-5" />}
          </button>

          {/* Button 3: Chia sẻ màn hình */}
          <button
            onClick={toggleScreenShare}
            title={isScreenSharing ? 'Dừng chia sẻ màn hình' : 'Chia sẻ màn hình'}
            className={`p-3.5 rounded-full transition-all border shadow-lg ${
              isScreenSharing 
                ? 'bg-blue-600 border-blue-500 text-white hover:bg-blue-700 ring-2 ring-blue-400/50 animate-pulse' 
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
          >
            <Monitor className="w-5 h-5" />
          </button>
        </div>

        {/* Button 4: Rời phòng */}
        <div className="flex items-center">
          <button 
            onClick={handleLeave}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-rose-900/20 active:scale-95"
          >
            <Phone className="w-4 h-4 rotate-[135deg]" />
            <span>Rời phòng</span>
          </button>
        </div>
      </div>
    </div>
  );
}
