import pool from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

class WalletService {
  async getWalletInfo(userId) {
    // Lấy số dư user
    const userResult = await pool.query('SELECT balance FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      throw new ApiError(404, 'Không tìm thấy người dùng');
    }
    const balance = parseFloat(userResult.rows[0].balance || 0);

    // Lấy lịch sử giao dịch
    const txResult = await pool.query(`
      SELECT id, amount, type, description, created_at 
      FROM transactions 
      WHERE user_id = $1 AND user_type = 'user' 
      ORDER BY created_at DESC
    `, [userId]);

    return {
      balance,
      transactions: txResult.rows
    };
  }

  async depositMoney(userId, { amount, paymentMethod }) {
    let newBalance = 0;
    let transaction = null;

    try {
      await pool.query('BEGIN');

      // Cập nhật số dư user
      await pool.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [amount, userId]);

      // Thêm lịch sử giao dịch
      const desc = `Nạp tiền qua cổng ${paymentMethod || 'Thanh toán trực tuyến'}`;
      const txResult = await pool.query(`
        INSERT INTO transactions (user_id, user_type, amount, type, description)
        VALUES ($1, 'user', $2, 'deposit', $3) RETURNING *
      `, [userId, amount, desc]);

      transaction = txResult.rows[0];

      await pool.query('COMMIT');

      // Lấy số dư mới
      const userResult = await pool.query('SELECT balance FROM users WHERE id = $1', [userId]);
      newBalance = parseFloat(userResult.rows[0].balance || 0);
    } catch (err) {
      await pool.query('ROLLBACK');
      throw err; // Ném lỗi cho ErrorHandler xử lý
    }

    return {
      balance: newBalance,
      transaction
    };
  }
}

export default new WalletService();
