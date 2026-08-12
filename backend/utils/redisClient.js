import { createClient } from 'redis';

// Dùng URL mặc định nếu chạy Docker trên máy local (redis://localhost:6379)
const redisClient = createClient({ 
    url: process.env.REDIS_URL,
    socket: {
        // Tắt tự động kết nối lại để không bị spam log và không treo server
        reconnectStrategy: false
    }
});

redisClient.on('error', err => console.log('Redis Client Error', err.message));

// KHÔNG dùng await ở đây để tránh việc treo toàn bộ server nếu Redis chưa bật
try {
    await redisClient.connect();
    console.log('Redis connected successfully');
} catch (err) {
    console.error('Lỗi khi kết nối Redis (Server vẫn chạy bình thường):', err.message);
}

export default redisClient;
