import { Server } from 'socket.io';
import pool from '../config/db.js';

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Helper lấy classId an toàn từ string hoặc object payload
  const parseClassId = (data) => {
    if (!data) return null;
    if (typeof data === 'object') {
      return data.classId ? String(data.classId) : null;
    }
    return String(data);
  };

  // Helper tính toán và phát danh sách thành viên online trong phòng
  const broadcastRoomPresence = (room) => {
    if (!room) return;
    const roomSockets = io.sockets.adapter.rooms.get(room);
    const members = [];
    if (roomSockets) {
      for (const socketId of roomSockets) {
        const clientSocket = io.sockets.sockets.get(socketId);
        if (clientSocket && clientSocket.userData) {
          members.push(clientSocket.userData);
        }
      }
    }
    console.log(`Broadcasting room presence for ${room}:`, members.map(m => m.userName));
    io.in(room).emit('room-presence', { room, members });
  };

  io.on('connection', (socket) => {
    console.log('A user connected via socket:', socket.id);

    // Khi người dùng tham gia phòng học trực tuyến
    socket.on('join-class', (data) => {
      const classId = parseClassId(data);
      const user = (typeof data === 'object' && data !== null) ? data.user : null;
      if (!classId) return;

      const room = `class_${classId}`;

      socket.join(room);
      socket.currentRoom = room;
      if (user) {
        socket.userData = { userId: user.id, userName: user.fullName, userRole: user.role, socketId: socket.id };
      } else {
        socket.userData = { userId: socket.id, userName: 'Người dùng', userRole: 'guest', socketId: socket.id };
      }
      console.log(`Socket ${socket.id} (${socket.userData.userName}) joined room ${room}`);
      
      // Thông báo cho những người khác trong phòng và phát danh sách thành viên online
      socket.to(room).emit('user-joined', { socketId: socket.id });
      broadcastRoomPresence(room);
    });

    // Khi người dùng thoát phòng học
    socket.on('leave-class', (data) => {
      const classId = parseClassId(data);
      const room = classId ? `class_${classId}` : socket.currentRoom;
      if (room) {
        socket.leave(room);
        if (socket.currentRoom) {
          const oldRoom = socket.currentRoom;
          socket.currentRoom = null;
          broadcastRoomPresence(oldRoom);
        }
      }
    });

    // Khi người dùng gửi tin nhắn (bao gồm chat chữ hoặc gửi file)
    socket.on('send-message', async (data) => {
      const classId = parseClassId(data);
      if (!classId) return;
      const room = `class_${classId}`;
      
      try {
        await pool.query(
          `INSERT INTO classroom_messages (booking_id, sender_id, sender_name, sender_role, content, file_url, file_name, file_size)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            classId,
            data.senderId,
            data.senderName,
            data.senderRole,
            data.text || '',
            data.fileUrl || null,
            data.fileName || null,
            data.fileSize || null
          ]
        );
      } catch (dbErr) {
        console.error('Error saving classroom message to DB:', dbErr);
      }

      socket.to(room).emit('receive-message', data);
    });

    // Đồng bộ nét vẽ trên Bảng vẽ
    socket.on('draw-sync', (data) => {
      const classId = parseClassId(data);
      if (!classId) return;
      const room = `class_${classId}`;
      socket.to(room).emit('draw-sync', data);
    });

    socket.on('clear-board', (data) => {
      const classId = parseClassId(data);
      if (!classId) return;
      const room = `class_${classId}`;
      socket.to(room).emit('clear-board');
    });

    // Đồng bộ chuyển đổi chế độ xem
    socket.on('view-toggle', (data) => {
      const classId = parseClassId(data);
      if (!classId) return;
      const room = `class_${classId}`;
      socket.to(room).emit('view-toggle', data);
    });

    // Đồng bộ truyền phát khung hình chia sẻ màn hình
    socket.on('screen-share-frame', (data) => {
      const classId = parseClassId(data);
      if (!classId) return;
      const room = `class_${classId}`;
      socket.to(room).emit('screen-share-frame', data);
    });

    socket.on('screen-share-stop', (data) => {
      const classId = parseClassId(data);
      if (!classId) return;
      const room = `class_${classId}`;
      socket.to(room).emit('screen-share-stop', data);
    });

    // Đồng bộ trạng thái tắt/bật Micro giữa 2 bên
    socket.on('toggle-mic', (data) => {
      const classId = parseClassId(data);
      if (!classId) return;
      const room = `class_${classId}`;
      socket.to(room).emit('toggle-mic', data);
    });

    // Đồng bộ luồng video Camera trực tiếp giữa 2 bên
    socket.on('camera-frame', (data) => {
      const classId = parseClassId(data);
      if (!classId) return;
      const room = `class_${classId}`;
      socket.to(room).emit('camera-frame', data);
    });

    socket.on('camera-stop', (data) => {
      const classId = parseClassId(data);
      if (!classId) return;
      const room = `class_${classId}`;
      socket.to(room).emit('camera-stop', data);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected socket:', socket.id);
      if (socket.currentRoom) {
        broadcastRoomPresence(socket.currentRoom);
      }
    });
  });

  return io;
};
