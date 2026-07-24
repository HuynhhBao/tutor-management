import redisClient from '../utils/redisClient.js';

export const checkCache = async (req, res, next) => {
    try {
        // Dùng chính URL API làm KEY (VD: "/api/tutors?search=Toan")
        const key = req.originalUrl;
        const data = await redisClient.get(key);

        if (data) {
            // Hitting Cache -> Trả thẳng về, KHÔNG gọi Controller hay DB nữa
            return res.json(JSON.parse(data));
        }
        // Miss Cache -> Tiếp tục chạy vào Controller
        next();
    } catch (error) {
        next(); // Lỗi Redis thì vẫn cho chạy bình thường bằng DB
    }
};
