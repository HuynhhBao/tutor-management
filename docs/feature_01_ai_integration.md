# Tài Liệu Triển Khai: Tích Hợp AI (AI Matchmaker & Assistant)

## 1. Mục Tiêu
Xây dựng hệ thống gợi ý gia sư (AI Matchmaker) và Trợ lý ảo sử dụng Google Gemini. Phải tuân thủ kiến trúc Layered Architecture hiện tại của backend.

## 2. Hướng Dẫn Lấy API Key (Google Gemini)
Dùng Gemini vì hoàn toàn miễn phí và cực kỳ mạnh mẽ.
1. Truy cập: [Google AI Studio](https://aistudio.google.com/).
2. Đăng nhập bằng tài khoản Google.
3. Bấm **"Get API key"** ở menu bên trái $\rightarrow$ **"Create API key"**.
4. Copy chuỗi Key sinh ra và dán vào file `.env` ở Backend:
   ```env
   GEMINI_API_KEY=AIzaSyB...
   ```

## 3. Chi Tiết Cấu Trúc & Code Backend
**Cài đặt thư viện:** `npm install @google/generative-ai pgvector`

*   **`backend/services/aiService.js`**:
    Nơi chứa toàn bộ logic gọi Gemini và tính toán Database.
    ```javascript
    import { GoogleGenerativeAI } from '@google/generative-ai';
    import pool from '../config/db.js';

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

    class AiService {
        async getTutorRecommendations(promptText) {
            // 1. Dùng Gemini để hiểu yêu cầu của user và tạo Embedding (Vector)
            const model = genAI.getGenerativeModel({ model: "text-embedding-004"});
            const result = await model.embedContent(promptText);
            const vector = result.embedding.values;

            // 2. Query DB để tìm gia sư phù hợp nhất (Cosine Similarity)
            // LƯU Ý: Yêu cầu chạy script CREATE EXTENSION vector trước
            const query = `
                SELECT id, full_name, subject, 
                       1 - (profile_embedding <=> $1::vector) as similarity
                FROM tutors
                ORDER BY profile_embedding <=> $1::vector
                LIMIT 3;
            `;
            const dbRes = await pool.query(query, [JSON.stringify(vector)]);
            return dbRes.rows;
        }
        
        async chatWithAssistant(message) {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});
            const result = await model.generateContent(message);
            return result.response.text();
        }
    }
    export default new AiService();
    ```

*   **`backend/controllers/aiController.js`**:
    Nhận request, gọi `aiService` và trả response JSON chuẩn.
    ```javascript
    import aiService from '../services/aiService.js';

    export const matchTutor = async (req, res) => {
        try {
            const { prompt } = req.body;
            const data = await aiService.getTutorRecommendations(prompt);
            res.json({ status: 'ok', data });
        } catch (error) {
            res.status(500).json({ status: 'error', message: error.message });
        }
    };
    ```

*   **`backend/routes/aiRoutes.js`**:
    Định nghĩa Route.
    ```javascript
    import express from 'express';
    import { matchTutor } from '../controllers/aiController.js';
    const router = express.Router();
    router.post('/matchmaker', matchTutor);
    export default router;
    ```

## 4. Chi Tiết Triển Khai Frontend
*   **`frontend/src/components/ai/AiMatchmaker.jsx`**:
    Tạo ô input text cho phép user gõ "Tìm gia sư dạy Toán lớp 10 giỏi".
    Khi bấm nút, gọi:
    ```javascript
    const response = await apiClient.post('/ai/matchmaker', { prompt: text });
    setSuggestedTutors(response.data);
    ```
    Hiển thị `suggestedTutors` bằng thẻ Card gia sư tái sử dụng.
