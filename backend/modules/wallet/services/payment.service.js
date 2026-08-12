import crypto from 'node:crypto';
import querystring from 'qs';
import walletService from './wallet.service.js';
import pool from '../../../config/db.js';

class PaymentService {
  /**
   * Tạo URL thanh toán VNPay
   * @param {Object} req - Request object từ Express
   * @param {Number} amount - Số tiền cần nạp
   * @param {String} ownerId - ID của người nạp
   * @param {String} ownerType - Loại tài khoản ('user' hoặc 'tutor')
   */
  async createVNPayUrl(req, amount, ownerId, ownerType) {
    process.env.TZ = 'Asia/Ho_Chi_Minh';
    
    let date = new Date();
    let createDate = date.toISOString().replace(/[-:T.]/g, '').substring(0, 14); // Format: yyyyMMddHHmmss
    
    let ipAddr = req.headers['x-forwarded-for'] || req.ip || '127.0.0.1';

    let tmnCode = process.env.VNP_TMN_CODE || 'DUMMYCODE';
    let secretKey = process.env.VNP_HASH_SECRET || 'DUMMYSECRET';
    let vnpUrl = process.env.VNP_URL || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    let returnUrl = process.env.VNP_RETURN_URL || 'http://localhost:3000/api/wallet/vnpay-return';

    // Tạo reference ID duy nhất cho giao dịch
    let orderId = `VNPAY_${date.getTime()}_${ownerId}`;

    // Tạo transaction PENDING trong DB trước khi đẩy sang VNPay
    const walletRes = await pool.query(
      'SELECT id FROM wallets WHERE owner_id = $1 AND owner_type = $2',
      [ownerId, ownerType]
    );
    
    let walletId;
    if (walletRes.rows.length === 0) {
      const newWallet = await walletService.createWallet(ownerId, ownerType);
      walletId = newWallet.id;
    } else {
      walletId = walletRes.rows[0].id;
    }

    // Ghi log PENDING (balance_after = hiện tại)
    const currentBalance = await walletService.getWalletBalance(ownerId, ownerType);
    await pool.query(
      `INSERT INTO transactions (wallet_id, type, amount, balance_after, status, payment_method, reference_id, description)
       VALUES ($1, 'DEPOSIT', $2, $3, 'PENDING', 'VNPAY', $4, $5)`,
      [walletId, amount, currentBalance.balance, orderId, `Nạp tiền ${amount}đ qua VNPay`]
    );

    let vnp_Params = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = orderId;
    vnp_Params['vnp_OrderInfo'] = `Nap tien cho tai khoan ${ownerId}`;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = amount * 100; // VNPay yêu cầu nhân 100
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;

    // Sort params
    vnp_Params = this.sortObject(vnp_Params);

    let signData = querystring.stringify(vnp_Params, { encode: false });
    let hmac = crypto.createHmac('sha512', secretKey);
    let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex'); 
    vnp_Params['vnp_SecureHash'] = signed;
    vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

    return vnpUrl;
  }

  /**
   * Xử lý IPN Webhook từ VNPay
   */
  async handleVNPayIPN(req) {
    let vnp_Params = req.query;
    let secureHash = vnp_Params['vnp_SecureHash'];
    
    let orderId = vnp_Params['vnp_TxnRef'];
    let rspCode = vnp_Params['vnp_ResponseCode'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = this.sortObject(vnp_Params);
    
    let secretKey = process.env.VNP_HASH_SECRET || 'DUMMYSECRET';
    let signData = querystring.stringify(vnp_Params, { encode: false });
    let hmac = crypto.createHmac('sha512', secretKey);
    let signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');     
    
    // Debug logs removed for security (SonarCloud)

    if (secureHash === signed) {
      // Xác minh chữ ký thành công
      // 1. Tìm giao dịch trong DB
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        
        const txRes = await client.query(
          'SELECT * FROM transactions WHERE reference_id = $1 FOR UPDATE',
          [orderId]
        );
        const transaction = txRes.rows[0];
        
        if (!transaction) {
          await client.query('ROLLBACK');
          return { code: '01', message: 'Order not found' };
        }
        
        if (transaction.status === 'SUCCESS') {
          await client.query('ROLLBACK');
          return { code: '02', message: 'Order already confirmed' }; // Đã xử lý (Idempotency)
        }

        if (rspCode === '00') {
          // Giao dịch thành công -> Cộng tiền
          // Lấy ví
          const walletRes = await client.query('SELECT * FROM wallets WHERE id = $1 FOR UPDATE', [transaction.wallet_id]);
          const wallet = walletRes.rows[0];
          
          const amountToAdd = Number.parseFloat(transaction.amount);
          
          await client.query(
            'UPDATE wallets SET balance = balance + $1, updated_at = NOW() WHERE id = $2',
            [amountToAdd, wallet.id]
          );
          
          await client.query(
            'UPDATE transactions SET status = $1, balance_after = balance_after + $2 WHERE id = $3',
            ['SUCCESS', amountToAdd, transaction.id]
          );
          
        } else {
          // Giao dịch thất bại
          await client.query(
            'UPDATE transactions SET status = $1 WHERE id = $2',
            ['FAILED', transaction.id]
          );
        }
        
        await client.query('COMMIT');
        return { code: '00', message: 'Confirm Success' };
      } catch (e) {
        await client.query('ROLLBACK');
        console.error('IPN Error', e);
        return { code: '99', message: 'Unknown error' };
      } finally {
        client.release();
      }
    } else {
      return { code: '97', message: 'Invalid signature' };
    }
  }

  // Hàm sort params VNPay
  sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj){
      if (obj.hasOwnProperty(key)) {
      str.push(encodeURIComponent(key));
      }
    }
    str.sort((a, b) => a.localeCompare(b));
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replaceAll('%20', '+');
    }
    return sorted;
  }
}

export default new PaymentService();
