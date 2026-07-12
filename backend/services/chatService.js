import pool from '../config/db.js';

class ChatService {
  async sendMessage(senderId, senderType, { receiverId, receiverType, content }) {
    const result = await pool.query(
      `INSERT INTO messages (sender_id, sender_type, receiver_id, receiver_type, content)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [senderId, senderType, receiverId, receiverType, content]
    );
    return result.rows[0];
  }

  async getMessages(myId, myType, partnerId, partnerType) {
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

    return result.rows;
  }

  async getConversations(myId, myType) {
    let query = '';
    
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
    } else {
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
    
    return result.rows.sort((a, b) => 
      new Date(b.last_message_time) - new Date(a.last_message_time)
    );
  }
}

export default new ChatService();
