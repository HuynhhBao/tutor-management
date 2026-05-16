import pool from '../config/db.js';

/**
 * Controller xử lý hệ thống trò chuyện giữa Gia sư và Học viên
 */

// 1. Gửi tin nhắn mới
export const sendMessage = async (req, res) => {
  const senderId = req.user.id;
  const senderType = req.user.role === 'user' ? 'user' : 'tutor';
  const { receiverId, receiverType, content } = req.body;

  if (!receiverId || !receiverType || !content) {
    return res.status(400).json({ status: 'error', message: 'Thiếu thông tin người nhận hoặc nội dung tin nhắn' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO messages (sender_id, sender_type, receiver_id, receiver_type, content)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [senderId, senderType, receiverId, receiverType, content]
    );
    res.status(201).json({ status: 'ok', data: result.rows[0] });
  } catch (err) {
    console.error('sendMessage error:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server khi gửi tin nhắn' });
  }
};

// 2. Lấy lịch sử tin nhắn giữa 2 người
export const getMessages = async (req, res) => {
  const myId = req.user.id;
  const myType = req.user.role === 'user' ? 'user' : 'tutor';
  const { partnerId, partnerType } = req.params;

  if (!partnerId || !partnerType) {
    return res.status(400).json({ status: 'error', message: 'Thiếu thông tin đối tác trò chuyện' });
  }

  try {
    // Lấy toàn bộ tin nhắn qua lại giữa 2 bên
    const result = await pool.query(
      `SELECT * FROM messages 
       WHERE (sender_id = $1 AND sender_type = $2 AND receiver_id = $3 AND receiver_type = $4)
          OR (sender_id = $3 AND sender_type = $4 AND receiver_id = $1 AND receiver_type = $2)
       ORDER BY created_at ASC`,
      [myId, myType, partnerId, partnerType]
    );
    
    // Đánh dấu các tin nhắn gửi cho mình là đã đọc
    await pool.query(
      `UPDATE messages SET is_read = TRUE 
       WHERE receiver_id = $1 AND receiver_type = $2 AND sender_id = $3 AND sender_type = $4 AND is_read = FALSE`,
      [myId, myType, partnerId, partnerType]
    );

    res.json({ status: 'ok', data: result.rows });
  } catch (err) {
    console.error('getMessages error:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server khi lấy tin nhắn' });
  }
};

// 3. Lấy danh sách cuộc hội thoại (những người đã từng nhắn tin)
export const getConversations = async (req, res) => {
  const myId = req.user.id;
  const myType = req.user.role === 'user' ? 'user' : 'tutor';

  try {
    let query = '';
    // Nếu là học viên, lấy danh sách gia sư đã liên hệ
    if (myType === 'user') {
      query = `
        SELECT DISTINCT ON (t.id) 
          t.id, t.full_name, t.avatar_url, 'tutor' as partner_type,
          m.content as last_message, m.created_at as last_message_time
        FROM tutors t
        JOIN messages m ON (m.sender_id = t.id AND m.sender_type = 'tutor' AND m.receiver_id = $1 AND m.receiver_type = 'user')
                        OR (m.receiver_id = t.id AND m.receiver_type = 'tutor' AND m.sender_id = $1 AND m.sender_type = 'user')
        ORDER BY t.id, m.created_at DESC
      `;
    } 
    // Nếu là gia sư, lấy danh sách học viên đã liên hệ
    else {
      query = `
        SELECT DISTINCT ON (u.id) 
          u.id, u.full_name, u.avatar_url, 'user' as partner_type,
          m.content as last_message, m.created_at as last_message_time
        FROM users u
        JOIN messages m ON (m.sender_id = u.id AND m.sender_type = 'user' AND m.receiver_id = $1 AND m.receiver_type = 'tutor')
                        OR (m.receiver_id = u.id AND m.receiver_type = 'user' AND m.sender_id = $1 AND m.sender_type = 'tutor')
        ORDER BY u.id, m.created_at DESC
      `;
    }

    const result = await pool.query(query, [myId]);
    
    // Sắp xếp lại danh sách theo thời gian tin nhắn mới nhất
    const sortedData = result.rows.sort((a, b) => 
      new Date(b.last_message_time) - new Date(a.last_message_time)
    );

    res.json({ status: 'ok', data: sortedData });
  } catch (err) {
    console.error('getConversations error:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server khi lấy danh sách hội thoại' });
  }
};
