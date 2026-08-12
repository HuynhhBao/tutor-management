import pool from './config/db.js';

const client = await pool.connect();
try {
  await client.query('BEGIN');
  
  // Xóa toàn bộ lịch sử giao dịch
  await client.query('DELETE FROM transactions');
  
  // Reset số dư tất cả ví về 0
  await client.query('UPDATE wallets SET balance = 0');
  
  await client.query('COMMIT');
  console.log('Dọn dẹp thành công! Tất cả ví đã về 0 và lịch sử trống.');
} catch (err) {
  await client.query('ROLLBACK');
  console.error('Lỗi dọn dẹp:', err);
} finally {
  client.release();
  process.exit();
}
