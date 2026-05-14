import pool from '../config/db.js';
import crypto from 'crypto';
import querystring from 'querystring';

// Cấu hình VNPay Sandbox test mặc định
const VNP_TMN_CODE = process.env.VNP_TMN_CODE || '2QXUI4J4';
const VNP_HASH_SECRET = process.env.VNP_HASH_SECRET || 'SECRETKEYVNPayTEST123456789012345';
const VNP_URL = 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
const VNP_RETURN_URL = 'http://localhost:5173/student-dashboard/wallet';

function sortObject(obj) {
  let sorted = {};
  let str = [];
  let key;
  for (key in obj) {
    if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
    }
  }
  str.sort();
  for (key = 0; key < str.length; key++) {
    sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
  }
  return sorted;
}

// GET /api/wallet - Lấy thông tin số dư và lịch sử giao dịch
export const getWalletInfo = async (req, res) => {
  const userId = req.user.id;

  try {
    const userResult = await pool.query('SELECT balance FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy người dùng' });
    }
    const balance = parseFloat(userResult.rows[0].balance || 0);

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

// POST /api/wallet/deposit (Mock cũ, vẫn giữ lại để tương thích nếu cần)
export const depositMoney = async (req, res) => {
  const userId = req.user.id;
  const { amount, paymentMethod } = req.body;

  const depositAmount = parseFloat(amount);
  if (isNaN(depositAmount) || depositAmount <= 0) {
    return res.status(400).json({ status: 'error', message: 'Số tiền nạp không hợp lệ' });
  }

  try {
    await pool.query('BEGIN');
    await pool.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [depositAmount, userId]);

    const desc = `Nạp tiền qua cổng ${paymentMethod || 'Thanh toán trực tuyến'}`;
    const txResult = await pool.query(`
      INSERT INTO transactions (user_id, user_type, amount, type, description)
      VALUES ($1, 'user', $2, 'deposit', $3) RETURNING *
    `, [userId, depositAmount, desc]);

    await pool.query('COMMIT');

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

// POST /api/wallet/create_payment_url - Tạo URL thanh toán VNPay
export const createPaymentUrl = async (req, res) => {
  const userId = req.user.id;
  const { amount, paymentMethod } = req.body;

  const depositAmount = parseFloat(amount);
  if (isNaN(depositAmount) || depositAmount <= 0) {
    return res.status(400).json({ status: 'error', message: 'Số tiền nạp không hợp lệ' });
  }

  try {
    let date = new Date();
    let createDate = date.toISOString().replace(/[-:T.]/g, '').slice(0, 14);
    let orderId = `EDU_${userId}_${Date.now()}`;

    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = VNP_TMN_CODE;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = orderId;
    vnp_Params['vnp_OrderInfo'] = `Nap tien vi EduMatch cho user ${userId}`;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = depositAmount * 100; // VNPay nhân 100
    vnp_Params['vnp_ReturnUrl'] = VNP_RETURN_URL;
    vnp_Params['vnp_IpAddr'] = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
    vnp_Params['vnp_CreateDate'] = createDate;

    vnp_Params = sortObject(vnp_Params);

    let signData = querystring.stringify(vnp_Params, { encode: false });
    let hmac = crypto.createHmac('sha512', VNP_HASH_SECRET);
    let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    vnp_Params['vnp_SecureHash'] = signed;

    let paymentUrl = VNP_URL + '?' + querystring.stringify(vnp_Params, { encode: false });

    res.status(200).json({
      status: 'ok',
      paymentUrl,
      message: 'Tạo URL thanh toán VNPay thành công'
    });
  } catch (err) {
    console.error('createPaymentUrl error:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server khi tạo URL thanh toán' });
  }
};

// POST /api/wallet/vnpay_return - Xử lý callback khi thanh toán VNPay thành công
export const vnpayReturn = async (req, res) => {
  const userId = req.user.id;
  let vnp_Params = req.body;

  let secureHash = vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHash'];
  delete vnp_Params['vnp_SecureHashType'];

  vnp_Params = sortObject(vnp_Params);

  let signData = querystring.stringify(vnp_Params, { encode: false });
  let hmac = crypto.createHmac('sha512', VNP_HASH_SECRET);
  let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

  if (secureHash === signed) {
    let rspCode = vnp_Params['vnp_ResponseCode'];
    let amount = parseFloat(vnp_Params['vnp_Amount']) / 100; // Chia lại 100
    let orderId = vnp_Params['vnp_TxnRef'];

    if (rspCode === '00') {
      try {
        await pool.query('BEGIN');

        // Kiểm tra xem mã đơn hàng này đã được cộng tiền chưa (tránh F5 cộng nhiều lần)
        const checkTx = await pool.query('SELECT id FROM transactions WHERE description LIKE $1', [`%${orderId}%`]);
        if (checkTx.rows.length > 0) {
          await pool.query('ROLLBACK');
          // Giao dịch đã xử lý trước đó
          const userRes = await pool.query('SELECT balance FROM users WHERE id = $1', [userId]);
          return res.status(200).json({
            status: 'ok',
            balance: parseFloat(userRes.rows[0].balance),
            message: 'Giao dịch đã được xử lý thành công trước đó'
          });
        }

        // Cộng tiền cho user
        await pool.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [amount, userId]);

        // Thêm bản ghi lịch sử
        const desc = `Nạp tiền thành công qua VNPay (Mã GD: ${orderId})`;
        const txResult = await pool.query(`
          INSERT INTO transactions (user_id, user_type, amount, type, description)
          VALUES ($1, 'user', $2, 'deposit', $3) RETURNING *
        `, [userId, amount, desc]);

        await pool.query('COMMIT');

        const userRes = await pool.query('SELECT balance FROM users WHERE id = $1', [userId]);
        const newBalance = parseFloat(userRes.rows[0].balance || 0);

        return res.status(200).json({
          status: 'ok',
          balance: newBalance,
          transaction: txResult.rows[0],
          message: `Nạp thành công ${amount.toLocaleString('vi-VN')}đ qua VNPay!`
        });
      } catch (dbErr) {
        await pool.query('ROLLBACK');
        console.error('vnpayReturn DB error:', dbErr);
        return res.status(500).json({ status: 'error', message: 'Lỗi ghi nhận giao dịch vào database' });
      }
    } else {
      return res.status(400).json({ status: 'error', message: 'Giao dịch thanh toán bị hủy hoặc thất bại' });
    }
  } else {
    return res.status(400).json({ status: 'error', message: 'Chữ ký VNPay không hợp lệ (Sai checksum)' });
  }
};
