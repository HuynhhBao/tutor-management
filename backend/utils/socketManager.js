import { Server } from 'socket.io';
import pool from '../config/db.js';

// Lưu trữ socket.id tương ứng với userId. VD: { 'student_1': 'socketxyz123' }
global.onlineUsers = new Map();

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Helper lấy classId an toàn từ string hoặc object payload
  const parseClassId = (data) => {
    if (!data) return null;
    let idStr = typeof data === 'object' ? data.classId : data;
    if (!idStr) return null;
    const idNum = parseInt(idStr, 10);
    return isNaN(idNum) ? null : idNum;
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

    // Nếu phòng học không còn ai (cả gia sư và học viên đều đã rời đi)
    if (members.length === 0) {
      const classIdMatch = room.match(/^class_(\d+)$/);
      if (classIdMatch) {
        const classId = classIdMatch[1];
        // Tự động xóa toàn bộ tin nhắn cũ của phòng học này
        pool.query('DELETE FROM classroom_messages WHERE booking_id = $1', [classId])
          .then(() => console.log(`Cleared all messages for empty room ${room}`))
          .catch(err => console.error('Error clearing messages:', err));
          
        // Reset luôn cả bảng vẽ để phòng học trở lại trạng thái mới tinh
        pool.query('UPDATE class_sessions SET canvas_snapshot = NULL WHERE booking_id = $1', [classId])
          .catch(() => {});
      }
    }

    console.log(`Broadcasting room presence for ${room}:`, members.map(m => m.userName));
    io.in(room).emit('room-presence', { room, members });
  };

  io.on('connection', (socket) => {
    console.log('A user connected via socket:', socket.id);

    // Frontend gửi event lên sau khi login thành công
    socket.on('authenticate', ({ userId, role }) => {
      const key = `${role}_${userId}`;
      global.onlineUsers.set(key, socket.id);
      console.log(`User authenticated for notifications: ${key} -> ${socket.id}`);
    });

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
      
      // Prevent IDOR: Always use server-side authenticated user data if available
      const senderId = socket.userData?.userId || data.senderId;
      const senderName = socket.userData?.userName || data.senderName;
      const senderRole = socket.userData?.userRole || data.senderRole;

      try {
        await pool.query(
          `INSERT INTO classroom_messages (booking_id, sender_id, sender_name, sender_role, content, file_url, file_name, file_size)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            classId,
            senderId,
            senderName,
            senderRole,
            data.text || '',
            data.fileUrl || null,
            data.fileName || null,
            data.fileSize || null
          ]
        );
      } catch (dbErr) {
        console.error('Error saving classroom message to DB:', dbErr);
      }

      // Ensure the broadcasted data contains the authenticated sender details
      const broadcastData = {
        ...data,
        senderId,
        senderName,
        senderRole
      };

      socket.to(room).emit('receive-message', broadcastData);
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

    socket.on('undo-board', (data) => {
      const classId = parseClassId(data);
      if (!classId) return;
      const room = `class_${classId}`;
      socket.to(room).emit('undo-board');
    });

    // Đồng bộ trạng thái tắt/bật Micro giữa 2 bên
    socket.on('toggle-mic', (data) => {
      const classId = parseClassId(data);
      if (!classId) return;
      const room = `class_${classId}`;
      socket.to(room).emit('toggle-mic', data);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected socket:', socket.id);
      if (socket.currentRoom) {
        broadcastRoomPresence(socket.currentRoom);
      }
      // Xóa khỏi Map khi user tắt tab
      for (const [key, value] of global.onlineUsers.entries()) {
        if (value === socket.id) {
          global.onlineUsers.delete(key);
          console.log(`Removed user from online tracking: ${key}`);
        }
      }
    });
  });

  global.io = io; // Lưu io ra global để các service khác gọi được
  return io;
};
