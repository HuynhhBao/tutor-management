# Tài Liệu Triển Khai: Tối Ưu Caching (Redis) & CI/CD Docker

## 1. Triển Khai Caching với Redis (Backend)
Redis là In-memory DB hoàn toàn miễn phí, lưu dữ liệu trên RAM để tăng tốc.

**Cài đặt:** `npm install redis`

*   **`backend/utils/redisClient.js`**:
    Khởi tạo connection.
    ```javascript
    import { createClient } from 'redis';

    // Dùng URL mặc định nếu chạy Docker trên máy local (redis://localhost:6379)
    const redisClient = createClient({ url: process.env.REDIS_URL });

    redisClient.on('error', err => console.log('Redis Client Error', err));
    await redisClient.connect();

    export default redisClient;
    ```

*   **`backend/middlewares/cacheMiddleware.js`**:
    Viết Middleware chặn request lại để kiểm tra xem đã có dữ liệu trong Cache chưa.
    ```javascript
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
    ```

*   **Cách sử dụng tại Controller (`tutorController.js`)**:
    Sửa lại hàm trả response để lưu đệm vào Cache.
    ```javascript
    import redisClient from '../utils/redisClient.js';

    export const getTutors = async (req, res) => {
        // ... logic lấy gia sư bằng pool.query ...
        const responseData = { status: 'ok', data: tutors };
        
        // Lưu vào Redis, sống trong 3600 giây (1 tiếng)
        await redisClient.setEx(req.originalUrl, 3600, JSON.stringify(responseData));
        
        res.json(responseData);
    };
    ```
    *Lưu ý ở Route phải gắn Middleware:* `router.get('/tutors', checkCache, getTutors);`

## 2. Triển Khai CI/CD & Docker
**Mục tiêu:** Push code lên GitHub là tự động Build và cập nhật server (Miễn phí 2000 phút GitHub Actions).

*   **`docker-compose.yml` (Bổ sung Redis)**:
    Mở file hiện có của bạn và thêm service `redis`.
    ```yaml
    services:
      redis:
        image: redis:alpine
        ports:
          - "6379:6379"
      backend:
        # ... cấu hình cũ ...
        environment:
          - REDIS_URL=redis://redis:6379 # Liên kết network nội bộ Docker
    ```

*   **`.github/workflows/deploy.yml`**:
    File tự động hóa của GitHub Actions. Tạo thư mục `.github/workflows/` trong project root.
    ```yaml
    name: Deploy EduMatch
    on:
      push:
        branches: [ main ] # Kích hoạt khi merge vào main
    jobs:
      build-and-deploy:
        runs-on: ubuntu-latest
        steps:
        - name: Checkout code
          uses: actions/checkout@v3

        - name: Setup Node
          uses: actions/setup-node@v3
          with: { node-version: '18' }

        - name: Run Backend Tests
          run: |
            cd backend
            npm install
            npm test # Nếu bạn có viết test
        
        # Nếu test pass, tiếp tục deploy (Ví dụ call SSH)
        - name: Deploy to Server
          uses: appleboy/ssh-action@master
          with:
            host: ${{ secrets.SERVER_IP }}
            username: ${{ secrets.SERVER_USER }}
            key: ${{ secrets.SERVER_KEY }}
            script: |
              cd /var/www/tutor-management
              git pull origin main
              docker-compose up -d --build
    ```
