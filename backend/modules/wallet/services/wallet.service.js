import pool from '../../../config/db.js';
import { ApiError } from '../../../utils/ApiError.js';

class WalletService {
  /**
   * Tạo ví mới (0đ) cho user/tutor
   */
  async createWallet(ownerId, ownerType) {
    const result = await pool.query(
      `INSERT INTO wallets (owner_id, owner_type, balance) 
       VALUES ($1, $2, 0) 
       ON CONFLICT (owner_id, owner_type) DO NOTHING
       RETURNING *`,
      [ownerId, ownerType]
    );
    return result.rows[0];
  }

  /**
   * Lấy thông tin ví và số dư
   */
  async getWalletBalance(ownerId, ownerType) {
    const result = await pool.query(
      'SELECT * FROM wallets WHERE owner_id = $1 AND owner_type = $2',
      [ownerId, ownerType]
    );
    
    if (result.rows.length === 0) {
      // Tự động tạo ví nếu chưa có
      return await this.createWallet(ownerId, ownerType);
    }
    
    return result.rows[0];
  }

  /**
   * Lấy lịch sử giao dịch của ví (có phân trang)
   */
  async getTransactions(walletId, limit = 20, offset = 0) {
    const result = await pool.query(
      `SELECT * FROM transactions 
       WHERE wallet_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [walletId, limit, offset]
    );
    return result.rows;
  }

  /**
   * Cộng tiền vào ví an toàn
   */
  async addFunds(ownerId, ownerType, amount, description, referenceId = null, paymentMethod = 'SYSTEM', type = 'DEPOSIT') {
    if (amount <= 0) throw new ApiError(400, 'Số tiền cộng vào phải lớn hơn 0');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Khóa row ví hiện tại (Mặc dù cộng tiền không lo race condition bằng trừ tiền, nhưng vẫn nên dùng để nhất quán)
      const walletRes = await client.query(
        'SELECT id, balance FROM wallets WHERE owner_id = $1 AND owner_type = $2 FOR UPDATE',
        [ownerId, ownerType]
      );

      let wallet = walletRes.rows[0];
      if (!wallet) {
        // Tự động tạo nếu chưa có trong lúc add
        const newWalletRes = await client.query(
          'INSERT INTO wallets (owner_id, owner_type, balance) VALUES ($1, $2, 0) RETURNING id, balance',
          [ownerId, ownerType]
        );
        wallet = newWalletRes.rows[0];
      }

      // 2. Cập nhật balance
      const updateRes = await client.query(
        'UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE id = $2 RETURNING balance',
        [amount, wallet.id]
      );
      const balanceAfter = updateRes.rows[0].balance;

      // 3. Ghi log transaction
      const txRes = await client.query(
        `INSERT INTO transactions (wallet_id, type, amount, balance_after, status, payment_method, reference_id, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [wallet.id, type, amount, balanceAfter, 'SUCCESS', paymentMethod, referenceId, description]
      );

      await client.query('COMMIT');
      return { walletBalance: balanceAfter, transaction: txRes.rows[0] };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Trừ tiền trong ví an toàn (có Pessimistic Locking)
   */
  async deductFunds(ownerId, ownerType, amount, description, type = 'PAYMENT') {
    if (amount <= 0) throw new ApiError(400, 'Số tiền trừ phải lớn hơn 0');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Khóa row ví hiện tại để tránh Race Condition
      const walletRes = await client.query(
        'SELECT id, balance FROM wallets WHERE owner_id = $1 AND owner_type = $2 FOR UPDATE',
        [ownerId, ownerType]
      );

      const wallet = walletRes.rows[0];
      if (!wallet) {
        throw new ApiError(404, 'Không tìm thấy ví người dùng');
      }

      // 2. Kiểm tra số dư
      if (parseFloat(wallet.balance) < amount) {
        throw new ApiError(400, 'Số dư không đủ để thực hiện giao dịch');
      }

      // 3. Trừ tiền
      const updateRes = await client.query(
        'UPDATE wallets SET balance = balance - $1, updated_at = NOW() WHERE id = $2 RETURNING balance',
        [amount, wallet.id]
      );
      const balanceAfter = updateRes.rows[0].balance;

      // 4. Ghi log transaction
      const txRes = await client.query(
        `INSERT INTO transactions (wallet_id, type, amount, balance_after, status, payment_method, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [wallet.id, type, -amount, balanceAfter, 'SUCCESS', 'SYSTEM', description]
      );

      await client.query('COMMIT');
      return { walletBalance: balanceAfter, transaction: txRes.rows[0] };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Tạo yêu cầu rút tiền (Withdrawal)
   */
  async requestWithdrawal(ownerId, ownerType, amount, description) {
    if (amount <= 0) throw new ApiError(400, 'Số tiền rút phải lớn hơn 0');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Khóa row ví
      const walletRes = await client.query(
        'SELECT id, balance FROM wallets WHERE owner_id = $1 AND owner_type = $2 FOR UPDATE',
        [ownerId, ownerType]
      );

      const wallet = walletRes.rows[0];
      if (!wallet) {
        throw new ApiError(404, 'Không tìm thấy ví');
      }

      if (parseFloat(wallet.balance) < amount) {
        throw new ApiError(400, 'Số dư không đủ để rút tiền');
      }

      // 2. Trừ tiền trước (đưa vào trạng thái đóng băng - bằng cách giảm balance, nếu Admin từ chối sẽ Refund lại)
      const updateRes = await client.query(
        'UPDATE wallets SET balance = balance - $1, updated_at = NOW() WHERE id = $2 RETURNING balance',
        [amount, wallet.id]
      );
      const balanceAfter = updateRes.rows[0].balance;

      // 3. Tạo transaction với trạng thái PENDING
      const txRes = await client.query(
        `INSERT INTO transactions (wallet_id, type, amount, balance_after, status, payment_method, description)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
        [wallet.id, 'WITHDRAWAL', -amount, balanceAfter, 'PENDING', 'SYSTEM', description]
      );

      await client.query('COMMIT');
      return { walletBalance: balanceAfter, transaction: txRes.rows[0] };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}

export default new WalletService();
