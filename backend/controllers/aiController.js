import { GoogleGenerativeAI } from '@google/generative-ai';
import pool from '../config/db.js';

// Hệ thống mô phỏng trợ lý khi chưa cấu hình Gemini API Key
const getSimulatedResponse = (userMessage) => {
  const msg = userMessage.toLowerCase();
  
  if (msg.includes('chào') || msg.includes('hello') || msg.includes('hi')) {
    return 'Xin chào! Tôi là **Trợ lý ảo EduMatch AI**. Rất vui được hỗ trợ bạn ngày hôm nay! Bạn cần tôi giúp gì về việc tìm gia sư, đặt lịch học hay nạp tiền ví?';
  }
  
  if (msg.includes('nạp tiền') || msg.includes('ví') || msg.includes('nạp tiền thế nào')) {
    return 'Để nạp tiền vào tài khoản EduMatch, bạn vui lòng làm theo các bước sau:\n\n1. Vào mục **Ví tiền** trên thanh menu.\n2. Chọn số tiền bạn muốn nạp hoặc nhập số tiền tùy chọn.\n3. Nhấn **Nạp tiền ngay**.\n4. Thực hiện chuyển khoản ngân hàng quét mã QR hiển thị trên màn hình với nội dung chuyển khoản được ghi sẵn.\n\nHệ thống sẽ tự động cộng số dư cho bạn sau 1-3 phút!';
  }
  
  if (msg.includes('đặt lịch') || msg.includes('thuê') || msg.includes('book') || msg.includes('tìm') || msg.includes('gia sư')) {
    return 'Quy trình đặt lịch gia sư trên EduMatch rất đơn giản:\n\n1. Truy cập trang **Tìm gia sư**.\n2. Lọc gia sư theo Môn học, Trình độ hoặc tìm kiếm theo tên.\n3. Nhấp vào hồ sơ gia sư để xem thông tin chi tiết chi phí và lịch sử.\n4. Nhấn nút **Đặt lịch học ngay**, chọn môn học, khung giờ rảnh và điền lời nhắn cho gia sư.\n5. Đảm bảo ví tiền của bạn đủ số dư, sau đó xác nhận thanh toán đặt lịch.';
  }

  if (msg.includes('hủy') || msg.includes('hủy lịch')) {
    return 'Bạn có thể hủy lịch học tại mục **Lịch của tôi**:\n\n* Bạn được phép hủy lịch miễn phí và được hoàn tiền 100% nếu thực hiện hủy **trước thời gian học tối thiểu 2 giờ**.\n* Nếu hủy muộn hơn hoặc sát giờ học, bạn có thể không được hoàn tiền tùy thuộc vào chính sách hỗ trợ gia sư.\n* Để hủy, chỉ cần tìm lớp tương ứng và click nút **Hủy lịch** và nhập lý do.';
  }

  if (msg.includes('giá') || msg.includes('học phí') || msg.includes('bao nhiêu')) {
    return 'Học phí trên EduMatch do từng gia sư tự thiết lập tùy thuộc vào trình độ và kinh nghiệm của họ (thường dao động từ 100,000đ - 300,000đ/giờ).\n\nBạn có thể thấy rõ học phí theo từng giờ học công khai ngay khi click vào trang tìm kiếm gia sư.';
  }

  return 'Cảm ơn câu hỏi của bạn! Nhưng hiện tại tôi chỉ hỗ trợ giải đáp các vấn đề cơ bản của hệ thống EduMatch:\n* Tìm kiếm gia sư & Đặt lịch học\n* Quản lý ví tiền & Nạp tiền tài khoản\n* Hủy lịch học & Hoàn tiền\n\nBạn muốn tìm hiểu thêm về chủ đề nào ở trên không?';
};

/**
 * 1. Gửi tin nhắn đến AI và nhận câu trả lời
 */
export const sendMessageToAI = async (req, res) => {
  const userId = req.user.id;
  const { message } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({ status: 'error', message: 'Nội dung tin nhắn không được để trống' });
  }

  try {
    // 1. Lưu tin nhắn của Học viên vào Database
    const userMsgResult = await pool.query(
      `INSERT INTO ai_chat_messages (user_id, sender, message)
       VALUES ($1, $2, $3) RETURNING *`,
      [userId, 'user', message]
    );

    const userMessageObj = userMsgResult.rows[0];

    // 2. Lấy 10 tin nhắn gần nhất làm ngữ cảnh hội thoại
    const historyResult = await pool.query(
      `SELECT sender, message FROM ai_chat_messages
       WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 10`,
      [userId]
    );

    // Đảo ngược lại để đúng thứ tự thời gian tăng dần
    const history = historyResult.rows.reverse();

    let aiResponseText = '';
    const geminiKey = process.env.GEMINI_API_KEY;

    if (geminiKey && geminiKey !== 'your_gemini_api_key_here' && geminiKey.trim() !== '') {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        // Sử dụng mô hình gemini-1.5-flash tốc độ cao và miễn phí
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Tạo prompt kèm theo ngữ cảnh hội thoại để AI hiểu được mạch nói chuyện
        const systemPrompt = `Bạn là "EduMatch AI" - Trợ lý ảo cực kỳ thông minh, thân thiện và tận tâm của nền tảng kết nối gia sư và học viên EduMatch. 
Nhiệm vụ của bạn là hỗ trợ học viên giải đáp các thắc mắc về kiến thức học tập hoặc hướng dẫn họ sử dụng website EduMatch.

Thông tin về website EduMatch để bạn hướng dẫn:
1. Đặt lịch gia sư: Vào mục "Tìm gia sư" -> Chọn gia sư -> Click "Đặt lịch" -> Chọn thời gian và Điền lời nhắn.
2. Ví tiền: Học viên có một ví tiền điện tử cá nhân. Vào mục "Ví tiền" để nạp tiền qua quét mã QR chuyển khoản hoặc xem lịch sử giao dịch.
3. Lịch học: Xem danh sách và trạng thái các lịch học tại "Lịch của tôi". Cho phép hủy lịch học trước ít nhất 2 giờ và được tự động hoàn tiền 100% về ví.
4. Trò chuyện: Học viên có thể chat trực tiếp với gia sư tại mục "Trò chuyện" sau khi lịch học được đặt.

Dưới đây là lịch sử cuộc trò chuyện gần đây giữa bạn và học viên:\n`;

        let conversationContext = '';
        for (const msgObj of history) {
          const senderName = msgObj.sender === 'user' ? 'Học viên' : 'EduMatch AI';
          conversationContext += `${senderName}: ${msgObj.message}\n`;
        }

        const finalPrompt = `${systemPrompt}\n${conversationContext}\nEduMatch AI hãy trả lời tin nhắn cuối cùng của Học viên một cách tự nhiên, ngắn gọn và hữu ích. Dùng định dạng markdown đẹp mắt (bôi đậm, gạch đầu dòng) khi cần thiết.`;

        const result = await model.generateContent(finalPrompt);
        aiResponseText = result.response.text();
      } catch (geminiError) {
        console.error('Gemini API Error, falling back to simulated response:', geminiError);
        aiResponseText = getSimulatedResponse(message);
      }
    } else {
      // Offline fallback mode
      aiResponseText = getSimulatedResponse(message);
    }

    // 3. Lưu phản hồi của AI vào Database
    const aiMsgResult = await pool.query(
      `INSERT INTO ai_chat_messages (user_id, sender, message)
       VALUES ($1, $2, $3) RETURNING *`,
      [userId, 'ai', aiResponseText]
    );

    const aiMessageObj = aiMsgResult.rows[0];

    res.json({
      status: 'ok',
      data: {
        userMessage: userMessageObj,
        aiMessage: aiMessageObj
      }
    });

  } catch (err) {
    console.error('sendMessageToAI error:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server khi xử lý tin nhắn AI' });
  }
};

/**
 * 2. Lấy lịch sử chat AI của học viên hiện tại
 */
export const getAIChatHistory = async (req, res) => {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT * FROM ai_chat_messages 
       WHERE user_id = $1 
       ORDER BY created_at ASC`,
      [userId]
    );
    res.json({ status: 'ok', data: result.rows });
  } catch (err) {
    console.error('getAIChatHistory error:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server khi lấy lịch sử chat AI' });
  }
};

/**
 * 3. Xóa sạch lịch sử chat AI để bắt đầu hội thoại mới
 */
export const clearAIChatHistory = async (req, res) => {
  const userId = req.user.id;

  try {
    await pool.query(
      `DELETE FROM ai_chat_messages WHERE user_id = $1`,
      [userId]
    );
    res.json({ status: 'ok', message: 'Đã xóa lịch sử chat AI thành công' });
  } catch (err) {
    console.error('clearAIChatHistory error:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server khi xóa lịch sử chat AI' });
  }
};
