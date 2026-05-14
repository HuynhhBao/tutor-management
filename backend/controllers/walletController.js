import pool from '../config/db.js';

// GET /api/wallet - Lấy thông tin số dư và lịch sử giao dịch
export const getWalletInfo = async (req, res) => {
  const userId = req.user.id;

  try {
    // Lấy số dư user
    const userResult = await pool.query('SELECT balance FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy người dùng' });
    }
    const balance = parseFloat(userResult.rows[0].balance || 0);

    // Lấy lịch sử giao dịch
    const txResult = await pool.query(`
      SELECT id, amount, type, description, created_at 
      FROM transactions 
      WHERE user_id = $1 AND user_type = 'user' 
      ORDER BY created_at DESC
    `, [userId]);

    res.json({
      status: 'ok',
      data: {
        balance,
        transactions: txResult.rows
      }
    });
  } catch (err) {
    console.error('getWalletInfo error:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server khi lấy thông tin ví tiền' });
  }
};

// POST /api/wallet/deposit - Nạp tiền vào tài khoản
export const depositMoney = async (req, res) => {
  const userId = req.user.id;
  const { amount, paymentMethod } = req.body;

  const depositAmount = parseFloat(amount);
  if (isNaN(depositAmount) || depositAmount <= 0) {
    return res.status(400).json({ status: 'error', message: 'Số tiền nạp không hợp lệ' });
  }

  try {
    await pool.query('BEGIN');

    // Cập nhật số dư user
    await pool.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [depositAmount, userId]);

    // Thêm lịch sử giao dịch
    const desc = `Nạp tiền qua cổng ${paymentMethod || 'Thanh toán trực tuyến'}`;
    const txResult = await pool.query(`
      INSERT INTO transactions (user_id, user_type, amount, type, description)
      VALUES ($1, 'user', $2, 'deposit', $3) RETURNING *
    `, [userId, depositAmount, desc]);

    await pool.query('COMMIT');

    // Lấy số dư mới
    const userResult = await pool.query('SELECT balance FROM users WHERE id = $1', [userId]);
    const newBalance = parseFloat(userResult.rows[0].balance || 0);

    res.status(200).json({
      status: 'ok',
      data: {
        balance: newBalance,
        transaction: txResult.rows[0]
      },
      message: `Nạp thành công ${depositAmount.toLocaleString('vi-VN')}đ vào tài khoản!`
    });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('depositMoney error:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server khi nạp tiền' });
  }
};
