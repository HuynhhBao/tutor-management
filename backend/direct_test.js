import paymentService from './modules/wallet/services/payment.service.js';
import pool from './config/db.js';

try {
  const mockReq = {
    headers: {},
    ip: '127.0.0.1'
  };
  
  // Tạo user giả nếu chưa có
  await pool.query("INSERT INTO users (id, email, full_name, password) VALUES (9999, 'test@test.com', 'Test', 'pass') ON CONFLICT DO NOTHING");
  
  const url = await paymentService.createVNPayUrl(mockReq, 500000, 9999, 'user');
  console.log('URL:', url);
} catch (err) {
  console.error('ERROR:', err);
} finally {
  process.exit(0);
}
