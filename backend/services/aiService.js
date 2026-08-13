import { GoogleGenerativeAI } from '@google/generative-ai';
import pool from '../config/db.js';

function removeAccents(str = '') {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replaceAll('đ', 'd')
    .replaceAll('Đ', 'D')
    .toLowerCase();
}

class AIService {
  getSimulatedResponse(userMessage) {
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
  }

  async _callGeminiForChat(geminiKey, history, message) {
    const genAI = new GoogleGenerativeAI(geminiKey);
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

    const candidateModels = [
      process.env.GEMINI_MODEL,
      'gemini-1.5-pro',
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-pro'
    ].filter(Boolean);

    let result = null;
    let lastErr = null;
    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        result = await model.generateContent(finalPrompt);
        if (result?.response) break;
      } catch (err) {
        lastErr = err;
      }
    }
    if (!result) throw lastErr || new Error('Không thể kết nối tới các mô hình Gemini');
    return result.response.text();
  }

  async sendMessageToAI(userId, message) {
    const userMsgResult = await pool.query(
      `INSERT INTO ai_chat_messages (user_id, sender, message)
       VALUES ($1, $2, $3) RETURNING *`,
      [userId, 'user', message]
    );
    const userMessageObj = userMsgResult.rows[0];

    const historyResult = await pool.query(
      `SELECT sender, message FROM ai_chat_messages
       WHERE user_id = $1
       ORDER BY created_at DESC LIMIT 10`,
      [userId]
    );
    const history = historyResult.rows.reverse();

    let aiResponseText = '';
    const geminiKey = process.env.GEMINI_API_KEY;

    if (geminiKey && geminiKey !== 'your_gemini_api_key_here' && geminiKey.trim() !== '') {
      try {
        aiResponseText = await this._callGeminiForChat(geminiKey, history, message);
      } catch (geminiError) {
        console.error('Gemini API Error, falling back to simulated response:', geminiError);
        aiResponseText = this.getSimulatedResponse(message);
      }
    } else {
      aiResponseText = this.getSimulatedResponse(message);
    }

    const aiMsgResult = await pool.query(
      `INSERT INTO ai_chat_messages (user_id, sender, message)
       VALUES ($1, $2, $3) RETURNING *`,
      [userId, 'ai', aiResponseText]
    );

    return {
      userMessage: userMessageObj,
      aiMessage: aiMsgResult.rows[0]
    };
  }

  async _getEmbedding(genAI, promptText) {
    try {
      const embeddingModel = genAI.getGenerativeModel({ model: 'text-embedding-004' });
      const embedRes = await embeddingModel.embedContent(promptText);
      return embedRes.embedding?.values;
    } catch (embedErr) {
      console.warn('Gemini embedding failed, falling back to LLM matching:', embedErr.message);
      return null;
    }
  }

  async _searchVectorDB(vector, promptText) {
    if (!vector || !Array.isArray(vector)) return null;
    try {
      const query = `
        SELECT id, full_name, email, gender, age, subjects, qualification, rating, avatar_url, grade_levels,
               1 - (profile_embedding <=> $1::vector) as similarity
        FROM tutors
        ORDER BY profile_embedding <=> $1::vector
        LIMIT 4;
      `;
      const dbRes = await pool.query(query, [JSON.stringify(vector)]);
      if (dbRes.rows && dbRes.rows.length > 0 && dbRes.rows[0].similarity !== null) {
        return dbRes.rows.map(row => ({
          ...row,
          matchScore: Math.round((row.similarity || 0.85) * 100),
          matchReason: `Phù hợp với yêu cầu "${promptText}" của bạn.`
        }));
      }
    } catch (pgvectorErr) {
      console.log('pgvector query fallback:', pgvectorErr.message);
    }
    return null;
  }

  async _callGeminiMatchmaker(genAI, tutors, promptText) {
    const candidateModels = [
      process.env.GEMINI_MODEL,
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro',
      'gemini-pro'
    ].filter(Boolean);

    const evalPrompt = `
Bạn là hệ thống AI Matchmaker thông minh của ứng dụng EduMatch.
Yêu cầu của học viên: "${promptText}"

Danh sách tất cả gia sư hiện có trong hệ thống:
${JSON.stringify(tutors.map(t => ({
      id: t.id,
      full_name: t.full_name,
      gender: t.gender,
      age: t.age,
      subjects: t.subjects,
      qualification: t.qualification,
      rating: t.rating,
      grade_levels: t.grade_levels,
      hourly_rate: t.hourly_rate ? (t.hourly_rate.toLocaleString('vi-VN') + ' VND/h') : undefined
})))}

Nhiệm vụ: Phân tích nhu cầu của học viên. Chọn ra top tối đa 4 gia sư phù hợp nhất.
Trả về định dạng JSON array chuẩn chứa danh sách gia sư phù hợp, cấu trúc mỗi phần tử:
[
  {
    "id": number,
    "matchScore": number (từ 75 đến 98),
    "matchReason": "lý do ngắn gọn 1-2 câu giải thích vì sao gia sư này phù hợp nhất với yêu cầu"
  }
]
CHỈ TRẢ VỀ JSON ARRAY THUẦN, KHÔNG CÓ MARKDOWN HOẶC TEXT KHÁC.
`;

    let rawText = null;
    for (const modelName of candidateModels) {
      try {
        const flashModel = genAI.getGenerativeModel({ model: modelName });
        const evalResult = await flashModel.generateContent(evalPrompt);
        if (evalResult?.response) {
          rawText = evalResult.response.text().trim();
          break;
        }
      } catch (mErr) {
        console.warn(`Model ${modelName} matchmaker error:`, mErr.message);
      }
    }

    if (!rawText) return null;

    if (rawText.startsWith('```json')) rawText = rawText.replace(/^```json\s+/, '').replace(/\s+```$/, '');
    else if (rawText.startsWith('```')) rawText = rawText.replace(/^```\s+/, '').replace(/\s+```$/, '');

    try {
      const matches = JSON.parse(rawText);
      if (Array.isArray(matches) && matches.length > 0) {
        const matchedTutors = matches.map(m => {
          const tutor = tutors.find(t => t.id === m.id);
          if (!tutor) return null;
          return {
            ...tutor,
            matchScore: m.matchScore || 88,
            matchReason: m.matchReason || `Phù hợp với nhu cầu "${promptText}".`
          };
        }).filter(Boolean);

        if (matchedTutors.length > 0) return matchedTutors;
      }
    } catch (jsonErr) {
      console.error('Lỗi parse JSON kết quả Gemini matchmaker:', jsonErr);
    }
    return null;
  }

  _calculateMatchScore(t, lowerPrompt, normPrompt, searchTokens, matchedSubjectObj, matchedGradeObj, targetExactAge, maxAge, minAge, isAnyTutorNameMatched) {
    const subjectsStr = (t.subjects || '').toLowerCase();
    const normSubjectsStr = removeAccents(subjectsStr);
    const gradesStr = (t.grade_levels || '').toLowerCase();
    const normGradesStr = removeAccents(gradesStr);
    const normTutorName = removeAccents(t.full_name || '');
    const tutorNameTokens = new Set(normTutorName.split(/\s+/).filter(w => w.length >= 1));
    const tutorAge = Number.parseInt(t.age, 10) || 25;

    let isThisTutorNameMatched = false;
    searchTokens.forEach(st => {
      if (tutorNameTokens.has(st) || normTutorName.includes(st)) {
        isThisTutorNameMatched = true;
      }
    });

    let hasSubjectMatch = false;
    if (matchedSubjectObj) {
      hasSubjectMatch = subjectsStr.includes(matchedSubjectObj.key) || 
                        normSubjectsStr.includes(matchedSubjectObj.norm) ||
                        matchedSubjectObj.regex.test(normSubjectsStr) ||
                        (matchedSubjectObj.norm === 'toan' && normSubjectsStr.includes('tooan'));
    }

    let hasGradeMatch = false;
    if (matchedGradeObj) {
      hasGradeMatch = gradesStr.includes(matchedGradeObj.key) || normGradesStr.includes(matchedGradeObj.norm);
    }

    let score = 70;
    let ageMatchText = '';

    if (isThisTutorNameMatched) {
      score += 25;
    } else if (isAnyTutorNameMatched) {
      score -= 20;
    }

    if (matchedSubjectObj) {
      if (hasSubjectMatch) {
        score += 20;
      } else {
        score -= 25;
      }
    }

    if (targetExactAge) {
      const ageDiff = Math.abs(tutorAge - targetExactAge);
      if (ageDiff === 0) {
        score += 22;
        ageMatchText = `khớp hoàn toàn độ tuổi ${targetExactAge} tuổi`;
      } else if (ageDiff <= 2) {
        score += 10;
        ageMatchText = `độ tuổi ${tutorAge} gần khớp với ${targetExactAge} tuổi`;
      } else {
        score -= 15;
        ageMatchText = `${tutorAge} tuổi (khác yêu cầu ${targetExactAge} tuổi)`;
      }
    } else {
      if (maxAge) {
        if (tutorAge < maxAge) {
          score += 12;
          ageMatchText = `${tutorAge} tuổi (dưới ${maxAge} tuổi)`;
        } else {
          score -= 15;
        }
      }
      if (minAge) {
        if (tutorAge > minAge) {
          score += 12;
          ageMatchText = `${tutorAge} tuổi (trên ${minAge} tuổi)`;
        } else {
          score -= 15;
        }
      }
    }

    score += (Number.parseFloat(t.rating) || 4.5) * 1.2;

    if ((lowerPrompt.includes('nữ') || normPrompt.includes('nu')) && (t.gender || '').toLowerCase() === 'nữ') score += 6;
    if (lowerPrompt.includes('nam') && (t.gender || '').toLowerCase() === 'nam') score += 6;

    if (matchedGradeObj) {
      if (hasGradeMatch) {
        score += 20;
      } else if (gradesStr) {
        score -= 15;
      }
    }

    const finalScore = Math.min(Math.max(Math.round(score), 50), 98);
    const matchedGradeText = t.grade_levels ? `dạy ${t.grade_levels}` : '';
    const matchedSubjectText = [t.subjects ? `chuyên dạy ${t.subjects}` : '', matchedGradeText].filter(Boolean).join(' - ') || 'trình độ chuyên môn cao';

    let reason = `AI đánh giá phù hợp ${finalScore}%: Gia sư ${t.full_name} (${t.age ? t.age.toString() + ' tuổi' : ''}, ${t.qualification || 'Kinh nghiệm'}), ${matchedSubjectText}.`;
    if (isThisTutorNameMatched) {
      reason = `AI đánh giá phù hợp ${finalScore}%: Gia sư ${t.full_name} khớp chính xác từ khóa tên bạn đang tìm kiếm.`;
    } else if (isAnyTutorNameMatched && !isThisTutorNameMatched) {
      reason = `Độ tương thích ${finalScore}%: Gia sư ${t.full_name} (${matchedSubjectText}) khác tên với từ khóa bạn tìm kiếm.`;
    } else if (matchedGradeObj && hasGradeMatch && matchedSubjectObj && hasSubjectMatch) {
      reason = `AI đánh giá phù hợp ${finalScore}%: Gia sư ${t.full_name} hoàn toàn khớp chuyên môn môn ${matchedSubjectObj.key.toUpperCase()} và khối ${matchedGradeObj.key.toUpperCase()}!`;
    } else if (targetExactAge && ageMatchText) {
      reason = `AI đánh giá phù hợp ${finalScore}%: Gia sư ${t.full_name} (${ageMatchText}), ${matchedSubjectText}.`;
    } else if (matchedSubjectObj && hasSubjectMatch) {
      reason = `AI đánh giá phù hợp ${finalScore}%: Gia sư ${t.full_name} (${t.qualification || 'Kinh nghiệm'}), ${matchedSubjectText}.`;
    } else if (matchedSubjectObj && !hasSubjectMatch) {
      reason = `Độ tương thích ${finalScore}%: Gia sư ${t.full_name} (${matchedSubjectText}) không đăng ký dạy môn ${matchedSubjectObj.key.toUpperCase()}.`;
    }

    return {
      ...t,
      matchScore: finalScore,
      matchReason: reason
    };
  }

  async getTutorRecommendations(promptText) {
    const geminiKey = process.env.GEMINI_API_KEY;
    const allTutorsRes = await pool.query('SELECT * FROM tutors ORDER BY rating DESC');
    const tutors = allTutorsRes.rows;
    if (tutors.length === 0) return [];

    if (geminiKey && geminiKey !== 'your_gemini_api_key_here' && geminiKey.trim() !== '') {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        
        // 1. Dùng Gemini text-embedding-004 tạo vector embedding cho promptText
        const vector = await this._getEmbedding(genAI, promptText);

        // 2. Thử truy vấn Vector DB nếu pgvector được hỗ trợ
        const vectorResults = await this._searchVectorDB(vector, promptText);
        if (vectorResults) return vectorResults;

        // 3. LLM Semantic Matching bằng Gemini AI
        const llmResults = await this._callGeminiMatchmaker(genAI, tutors, promptText);
        if (llmResults) return llmResults;

      } catch (geminiError) {
        console.error('Gemini Matchmaker Error, falling back to simulated match:', geminiError);
      }
    }

    // 4. Fallback thông minh (Rule-based)
    const lowerPrompt = promptText.toLowerCase();
    const normPrompt = removeAccents(lowerPrompt);
    const searchBody = normPrompt
      .replace(/\bgia\s+su\b/g, '')
      .replace(/\btim\b/g, '')
      .replace(/\bday\b/g, '')
      .replace(/\bcan\b/g, '')
      .trim();
    
    // Parse tuổi (use \s? instead of \s* to avoid backtracking)
    const exactAgeMatch = lowerPrompt.match(/(\d+)\s?(?:tuổi|tuoi)/);
    const targetExactAge = exactAgeMatch ? Number.parseInt(exactAgeMatch[1], 10) : null;

    const underAgeMatch = lowerPrompt.match(/(?:dưới|duoi|nhỏ hơn|nho hon|<)\s?(\d+)/);
    const maxAge = underAgeMatch ? Number.parseInt(underAgeMatch[1], 10) : null;

    const overAgeMatch = lowerPrompt.match(/(?:trên|tren|lớn hơn|lon hon|>)\s?(\d+)/);
    const minAge = overAgeMatch ? Number.parseInt(overAgeMatch[1], 10) : null;

    const subjectList = [
      { key: 'toán', norm: 'toan', regex: /\btoan\b|\btoan\s?lop\b|\btooan\b/i },
      { key: 'lý', norm: 'ly', regex: /\bly\b|\bli\b/i },
      { key: 'hóa', norm: 'hoa', regex: /\bhoa\b/i },
      { key: 'văn', norm: 'van', regex: /\bvan\b|\bngu\s?van\b/i },
      { key: 'anh', norm: 'anh', regex: /\banh\b|\btieng\s?anh\b|\benglish\b/i },
      { key: 'sinh', norm: 'sinh', regex: /\bsinh\b|\bsinh\s?hoc\b/i },
      { key: 'sử', norm: 'su', regex: /\bsu\b|\blich\s?su\b/i },
      { key: 'địa', norm: 'dia', regex: /\bdia\b|\bdia\s?ly\b/i },
      { key: 'tin', norm: 'tin', regex: /\btin\b|\btin\s?hoc\b/i },
      { key: 'lập trình', norm: 'lap trinh', regex: /\blap\s?trinh\b/i },
      { key: 'ielts', norm: 'ielts', regex: /\bielts\b/i }
    ];
    const matchedSubjectObj = subjectList.find(s => s.regex.test(searchBody));

    const gradeList = [
      { key: 'lớp 6', norm: 'lop 6', regex: /\blop\s?6\b/i },
      { key: 'lớp 7', norm: 'lop 7', regex: /\blop\s?7\b/i },
      { key: 'lớp 8', norm: 'lop 8', regex: /\blop\s?8\b/i },
      { key: 'lớp 9', norm: 'lop 9', regex: /\blop\s?9\b/i },
      { key: 'lớp 10', norm: 'lop 10', regex: /\blop\s?10\b/i },
      { key: 'lớp 11', norm: 'lop 11', regex: /\blop\s?11\b/i },
      { key: 'lớp 12', norm: 'lop 12', regex: /\blop\s?12\b/i },
      { key: 'ôn thi đại học', norm: 'on thi dai hoc', regex: /\bon\s?(?:thi\s?)?(?:dai\s?hoc|dh|thpt)\b|\bdai\s?hoc\b/i }
    ];
    const matchedGradeObj = gradeList.find(g => g.regex.test(normPrompt) || lowerPrompt.includes(g.key));

    const searchTokens = searchBody
      .replace(/\bten\b/g, '')
      .split(/\s+/)
      .filter(w => w.length >= 2);

    let isAnyTutorNameMatched = false;
    tutors.forEach(t => {
      const normTutorName = removeAccents(t.full_name || '');
      const tutorNameTokens = new Set(normTutorName.split(/\s+/).filter(w => w.length >= 1));
      searchTokens.forEach(st => {
        if (tutorNameTokens.has(st) || normTutorName.includes(st)) {
          isAnyTutorNameMatched = true;
        }
      });
    });

    const scored = tutors.map(t => this._calculateMatchScore(
      t, lowerPrompt, normPrompt, searchTokens, matchedSubjectObj, matchedGradeObj, targetExactAge, maxAge, minAge, isAnyTutorNameMatched
    ));

    scored.sort((a, b) => b.matchScore - a.matchScore);
    return scored.slice(0, 4);
  }

  async getAIChatHistory(userId) {
    const result = await pool.query(
      `SELECT * FROM ai_chat_messages 
       WHERE user_id = $1 
       ORDER BY created_at ASC`,
      [userId]
    );
    return result.rows;
  }

  async clearAIChatHistory(userId) {
    await pool.query(
      `DELETE FROM ai_chat_messages WHERE user_id = $1`,
      [userId]
    );
    return true;
  }
}

export default new AIService();
