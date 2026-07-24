import { createClient } from 'redis';

// Dùng URL mặc định nếu chạy Docker trên máy local (redis://localhost:6379)
const redisClient = createClient({ url: process.env.REDIS_URL });

redisClient.on('error', err => console.log('Redis Client Error', err.message));

try {
    await redisClient.connect();
    console.log('Redis connected successfully');
} catch (err) {
    console.error('Lỗi khi kết nối Redis lần đầu:', err.message);
}

export default redisClient;
