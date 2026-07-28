import pool from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

const PERIOD_CONFIGS = {
  '7d': {
    summarySql: `
      SELECT 
        COALESCE(SUM(CASE WHEN type IN ('deposit', 'booking_payment') THEN amount ELSE 0 END), 0) as gross_revenue,
        COALESCE(SUM(CASE WHEN type = 'booking_payment' THEN amount ELSE 0 END), 0) as booking_revenue,
        COALESCE(SUM(CASE WHEN type = 'tutor_payout' THEN amount ELSE 0 END), 0) as tutor_payouts,
        COUNT(*) as total_transactions
      FROM transactions
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `,
    timelineSql: `
      WITH dates AS (
        SELECT generate_series(
          date_trunc('day', NOW() - INTERVAL '7 days'),
          date_trunc('day', NOW()),
          '1 day'::interval
        ) as time_bucket
      )
      SELECT 
        to_char(d.time_bucket, 'DD/MM') as label,
        d.time_bucket,
        COALESCE(SUM(CASE WHEN t.type IN ('deposit', 'booking_payment') THEN t.amount ELSE 0 END), 0) as gross_revenue,
        COALESCE(SUM(CASE WHEN t.type = 'booking_payment' THEN t.amount ELSE 0 END), 0) * ($1 / 100.0) as commission,
        COUNT(t.id) as transactions_count
      FROM dates d
      LEFT JOIN transactions t ON date_trunc('day', t.created_at) = d.time_bucket
      GROUP BY d.time_bucket
      ORDER BY d.time_bucket ASC
    `,
    breakdownSql: `
      SELECT 
        type,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM transactions
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY type
    `
  },
  '30d': {
    summarySql: `
      SELECT 
        COALESCE(SUM(CASE WHEN type IN ('deposit', 'booking_payment') THEN amount ELSE 0 END), 0) as gross_revenue,
        COALESCE(SUM(CASE WHEN type = 'booking_payment' THEN amount ELSE 0 END), 0) as booking_revenue,
        COALESCE(SUM(CASE WHEN type = 'tutor_payout' THEN amount ELSE 0 END), 0) as tutor_payouts,
        COUNT(*) as total_transactions
      FROM transactions
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `,
    timelineSql: `
      WITH dates AS (
        SELECT generate_series(
          date_trunc('day', NOW() - INTERVAL '30 days'),
          date_trunc('day', NOW()),
          '1 day'::interval
        ) as time_bucket
      )
      SELECT 
        to_char(d.time_bucket, 'DD/MM') as label,
        d.time_bucket,
        COALESCE(SUM(CASE WHEN t.type IN ('deposit', 'booking_payment') THEN t.amount ELSE 0 END), 0) as gross_revenue,
        COALESCE(SUM(CASE WHEN t.type = 'booking_payment' THEN t.amount ELSE 0 END), 0) * ($1 / 100.0) as commission,
        COUNT(t.id) as transactions_count
      FROM dates d
      LEFT JOIN transactions t ON date_trunc('day', t.created_at) = d.time_bucket
      GROUP BY d.time_bucket
      ORDER BY d.time_bucket ASC
    `,
    breakdownSql: `
      SELECT 
        type,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM transactions
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY type
    `
  },
  '12m': {
    summarySql: `
      SELECT 
        COALESCE(SUM(CASE WHEN type IN ('deposit', 'booking_payment') THEN amount ELSE 0 END), 0) as gross_revenue,
        COALESCE(SUM(CASE WHEN type = 'booking_payment' THEN amount ELSE 0 END), 0) as booking_revenue,
        COALESCE(SUM(CASE WHEN type = 'tutor_payout' THEN amount ELSE 0 END), 0) as tutor_payouts,
        COUNT(*) as total_transactions
      FROM transactions
      WHERE created_at >= NOW() - INTERVAL '1 year'
    `,
    timelineSql: `
      WITH dates AS (
        SELECT generate_series(
          date_trunc('month', NOW() - INTERVAL '1 year'),
          date_trunc('month', NOW()),
          '1 month'::interval
        ) as time_bucket
      )
      SELECT 
        to_char(d.time_bucket, 'MM/YYYY') as label,
        d.time_bucket,
        COALESCE(SUM(CASE WHEN t.type IN ('deposit', 'booking_payment') THEN t.amount ELSE 0 END), 0) as gross_revenue,
        COALESCE(SUM(CASE WHEN t.type = 'booking_payment' THEN t.amount ELSE 0 END), 0) * ($1 / 100.0) as commission,
        COUNT(t.id) as transactions_count
      FROM dates d
      LEFT JOIN transactions t ON date_trunc('month', t.created_at) = d.time_bucket
      GROUP BY d.time_bucket
      ORDER BY d.time_bucket ASC
    `,
    breakdownSql: `
      SELECT 
        type,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM transactions
      WHERE created_at >= NOW() - INTERVAL '1 year'
      GROUP BY type
    `
  }
};

class AdminFinanceService {
  /**
   * Lấy cấu hình hệ thống (mặc định lấy % hoa hồng)
   */
  async getSettings() {
    const result = await pool.query('SELECT key, value, description, updated_at FROM system_settings');
    const settings = {};
    result.rows.forEach(row => {
      settings[row.key] = row.value;
    });
    
    // Mặc định commission_rate = 15% nếu chưa thiết lập
    if (!settings.commission_rate) {
      settings.commission_rate = '15';
    }

    return {
      commissionRate: parseFloat(settings.commission_rate),
      rawSettings: result.rows
    };
  }

  /**
   * Cập nhật tỷ lệ hoa hồng hệ thống
   */
  async updateCommissionRate(commissionRate) {
    const rate = parseFloat(commissionRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      throw new ApiError(400, 'Tỷ lệ hoa hồng phải là một số hợp lệ từ 0 đến 100');
    }

    await pool.query(`
      INSERT INTO system_settings (key, value, description, updated_at)
      VALUES ('commission_rate', $1, 'Tỷ lệ hoa hồng hệ thống (%)', NOW())
      ON CONFLICT (key) DO UPDATE
      SET value = EXCLUDED.value, updated_at = NOW()
    `, [rate.toString()]);

    return { commissionRate: rate };
  }

  /**
   * Lấy thông số thống kê tài chính và dữ liệu biểu đồ
   */
  async getDashboardStats(period = '30d') {
    // Lấy tỷ lệ hoa hồng hiện tại
    const { commissionRate } = await this.getSettings();

    const config = PERIOD_CONFIGS[period] || PERIOD_CONFIGS['30d'];

    // 1. Thống kê Tổng Doanh Thu & Số lượng Giao dịch
    const summaryResult = await pool.query(config.summarySql);
    const summary = summaryResult.rows[0] || {};
    const grossRevenue = parseFloat(summary.gross_revenue || 0);
    const bookingRevenue = parseFloat(summary.booking_revenue || 0);
    const platformCommission = bookingRevenue * (commissionRate / 100);
    const totalTransactions = parseInt(summary.total_transactions || 0, 10);

    // 2. Tổng số dư ví học viên hiện tại trong hệ thống
    const userBalanceResult = await pool.query(
      'SELECT COALESCE(SUM(balance), 0) as total_user_balance FROM users'
    );
    const totalUserBalance = parseFloat(userBalanceResult.rows[0]?.total_user_balance || 0);

    // 3. Chuỗi dữ liệu biểu đồ xu hướng theo thời gian (Area Spline Chart)
    const chartTimelineResult = await pool.query(config.timelineSql, [commissionRate]);

    const chartData = chartTimelineResult.rows.map(row => ({
      label: row.label,
      grossRevenue: Math.round(parseFloat(row.gross_revenue || 0)),
      commission: Math.round(parseFloat(row.commission || 0)),
      count: parseInt(row.transactions_count || 0, 10)
    }));

    // 4. Phân bổ các loại giao dịch (Donut Chart)
    const breakdownResult = await pool.query(config.breakdownSql);

    const typeLabels = {
      deposit: 'Nạp tiền vào ví',
      booking_payment: 'Thanh toán thuê Gia sư',
      tutor_payout: 'Thanh toán cho Gia sư',
      refund: 'Hoàn tiền Lớp học'
    };

    const typeColors = {
      deposit: '#10b981',        // Emerald green
      booking_payment: '#6366f1',// Indigo blue
      tutor_payout: '#f59e0b',   // Amber orange
      refund: '#f43f5e'          // Rose red
    };

    const breakdown = breakdownResult.rows.map(row => ({
      type: row.type,
      name: typeLabels[row.type] || row.type,
      count: parseInt(row.count, 10),
      totalAmount: parseFloat(row.total_amount),
      color: typeColors[row.type] || '#8b5cf6'
    }));

    return {
      period,
      commissionRate,
      metrics: {
        grossRevenue,
        platformCommission,
        totalTransactions,
        totalUserBalance,
        bookingRevenue,
        tutorPayouts: parseFloat(summary.tutor_payouts || 0)
      },
      chartData,
      breakdown
    };
  }

  /**
   * Lấy danh sách lịch sử giao dịch kèm thông tin người thực hiện, phân trang và tìm kiếm
   */
  async getTransactions({ page = 1, limit = 10, search = '', type = 'all', startDate = '', endDate = '' }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const whereConditions = [];
    const queryParams = [];
    let paramIndex = 1;

    if (type && type !== 'all') {
      whereConditions.push(`t.type = $${paramIndex++}`);
      queryParams.push(type);
    }

    if (startDate) {
      whereConditions.push(`t.created_at >= $${paramIndex++}`);
      queryParams.push(startDate);
    }

    if (endDate) {
      whereConditions.push(`t.created_at <= $${paramIndex++}`);
      queryParams.push(endDate);
    }

    if (search) {
      whereConditions.push(`(
        t.description ILIKE $${paramIndex} OR 
        u.full_name ILIKE $${paramIndex} OR 
        u.email ILIKE $${paramIndex} OR 
        tut.full_name ILIKE $${paramIndex} OR 
        t.id::text ILIKE $${paramIndex}
      )`);
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Count query
    const countSql = `
      SELECT COUNT(*) 
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id AND t.user_type = 'user'
      LEFT JOIN tutors tut ON t.user_id = tut.id AND t.user_type = 'tutor'
      ${whereClause}
    `;
    const countResult = await pool.query(countSql, queryParams);
    const totalItems = parseInt(countResult.rows[0]?.count || 0, 10);
    const totalPages = Math.ceil(totalItems / limitNum) || 1;

    // Data query
    const limitParamIndex = paramIndex++;
    const offsetParamIndex = paramIndex++;

    const dataSql = `
      SELECT 
        t.id,
        t.user_id,
        t.user_type,
        t.amount,
        t.type,
        t.description,
        t.created_at,
        COALESCE(u.full_name, tut.full_name, 'Hệ thống / Admin') as user_name,
        COALESCE(u.email, tut.email, 'N/A') as user_email,
        COALESCE(u.avatar_url, tut.avatar_url, NULL) as user_avatar
      FROM transactions t
      LEFT JOIN users u ON t.user_id = u.id AND t.user_type = 'user'
      LEFT JOIN tutors tut ON t.user_id = tut.id AND t.user_type = 'tutor'
      ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT $${limitParamIndex} OFFSET $${offsetParamIndex}
    `;

    queryParams.push(limitNum, offset);

    const dataResult = await pool.query(dataSql, queryParams);

    return {
      transactions: dataResult.rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalItems,
        totalPages
      }
    };
  }

  /**
   * Thống kê tổng quan ví và thu nhập của danh sách gia sư
   */
  async getTutorsFinanceOverview({ search = '', page = 1, limit = 10 }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
    const offset = (pageNum - 1) * limitNum;

    const queryParams = [];
    let whereClause = '';

    if (search) {
      whereClause = 'WHERE full_name ILIKE $1 OR email ILIKE $1 OR bank_account_number ILIKE $1';
      queryParams.push(`%${search}%`);
    }

    const countSql = `SELECT COUNT(*) FROM tutors ${whereClause}`;
    const countRes = await pool.query(countSql, queryParams);
    const totalItems = parseInt(countRes.rows[0]?.count || 0, 10);
    const totalPages = Math.ceil(totalItems / limitNum) || 1;

    const dataSql = `
      SELECT 
        id, full_name, email, avatar_url, COALESCE(balance, 0) as balance, 
        bank_name, bank_account_number, bank_account_holder, created_at
      FROM tutors 
      ${whereClause}
      ORDER BY balance DESC, full_name ASC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
    const dataRes = await pool.query(dataSql, [...queryParams, limitNum, offset]);

    return {
      tutors: dataRes.rows.map(r => ({
        ...r,
        balance: parseFloat(r.balance)
      })),
      pagination: { page: pageNum, limit: limitNum, totalItems, totalPages }
    };
  }

  /**
   * Lấy danh sách yêu cầu rút tiền của gia sư
   */
  async getPayoutRequests({ status = 'all', page = 1, limit = 20 }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const whereConditions = [];
    const queryParams = [];
    if (status && status !== 'all') {
      whereConditions.push(`p.status = $${queryParams.length + 1}`);
      queryParams.push(status);
    }
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countSql = `SELECT COUNT(*) FROM payout_requests p ${whereClause}`;
    const countRes = await pool.query(countSql, queryParams);
    const totalItems = parseInt(countRes.rows[0]?.count || 0, 10);
    const totalPages = Math.ceil(totalItems / limitNum) || 1;

    const dataSql = `
      SELECT 
        p.*, 
        t.full_name as tutor_name, 
        t.email as tutor_email, 
        t.avatar_url as tutor_avatar,
        COALESCE(t.balance, 0) as tutor_current_balance
      FROM payout_requests p
      JOIN tutors t ON p.tutor_id = t.id
      ${whereClause}
      ORDER BY 
        CASE WHEN p.status = 'pending' THEN 0 ELSE 1 END,
        p.created_at DESC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
    const dataRes = await pool.query(dataSql, [...queryParams, limitNum, offset]);

    return {
      requests: dataRes.rows.map(r => ({
        ...r,
        amount: parseFloat(r.amount),
        tutor_current_balance: parseFloat(r.tutor_current_balance),
        bank_snapshot: typeof r.bank_snapshot === 'string' ? JSON.parse(r.bank_snapshot) : r.bank_snapshot
      })),
      pagination: { page: pageNum, limit: limitNum, totalItems, totalPages }
    };
  }

  /**
   * Xử lý (duyệt/từ chối) yêu cầu chi trả rút tiền
   */
  async processPayoutRequest(requestId, action, adminNote = '') {
    if (!['approve', 'reject'].includes(action)) {
      throw new ApiError(400, 'Hành động không hợp lệ');
    }

    try {
      await pool.query('BEGIN');

      const reqRes = await pool.query('SELECT * FROM payout_requests WHERE id = $1', [requestId]);
      if (reqRes.rows.length === 0) {
        throw new ApiError(404, 'Không tìm thấy yêu cầu chi trả');
      }

      const payout = reqRes.rows[0];
      if (payout.status !== 'pending') {
        throw new ApiError(400, 'Yêu cầu này đã được xử lý trước đó');
      }

      const amount = parseFloat(payout.amount);

      if (action === 'approve') {
        const tutorRes = await pool.query('SELECT balance FROM tutors WHERE id = $1', [payout.tutor_id]);
        const balance = parseFloat(tutorRes.rows[0]?.balance || 0);
        if (balance < amount) {
          throw new ApiError(400, `Số dư hiện tại của gia sư (${balance.toLocaleString('vi-VN')} VNĐ) không đủ để duyệt chi ${amount.toLocaleString('vi-VN')} VNĐ!`);
        }

        await pool.query('UPDATE tutors SET balance = balance - $1 WHERE id = $2', [amount, payout.tutor_id]);
        await pool.query(
          'UPDATE payout_requests SET status = $1, processed_at = NOW(), admin_note = $2 WHERE id = $3',
          ['approved', adminNote || 'Đã giải ngân qua chuyển khoản ngân hàng/VietQR', requestId]
        );

        await pool.query(`
          INSERT INTO transactions (user_id, user_type, amount, type, description)
          VALUES ($1, 'tutor', $2, 'tutor_payout', $3)
        `, [payout.tutor_id, amount, `Rút tiền về Ngân hàng thành công (Mã lệnh #${requestId})`]);

        const notificationService = (await import('./notificationService.js')).default;
        await notificationService.sendNotification(
          payout.tutor_id,
          'tutor',
          '✅ Yêu cầu rút tiền được phê duyệt',
          `Khoản tiền ${amount.toLocaleString('vi-VN')} VNĐ đã được chuyển tới tài khoản Ngân hàng của bạn thành công!`
        );
      } else {
        await pool.query(
          'UPDATE payout_requests SET status = $1, processed_at = NOW(), admin_note = $2 WHERE id = $3',
          ['rejected', adminNote || 'Từ chối yêu cầu rút tiền', requestId]
        );

        const notificationService = (await import('./notificationService.js')).default;
        await notificationService.sendNotification(
          payout.tutor_id,
          'tutor',
          '❌ Yêu cầu rút tiền bị từ chối',
          `Yêu cầu rút ${amount.toLocaleString('vi-VN')} VNĐ của bạn đã bị từ chối. Lý do: ${adminNote || 'Vui lòng kiểm tra lại thông tin tài khoản hoặc liên hệ Admin'}.`
        );
      }

      await pool.query('COMMIT');
      return { id: requestId, status: action === 'approve' ? 'approved' : 'rejected' };
    } catch (err) {
      await pool.query('ROLLBACK');
      throw err;
    }
  }

  async getSystemOverviewStats() {
    // 1. Tổng số gia sư
    const tutorRes = await pool.query('SELECT COUNT(*) FROM tutors');
    const totalTutors = parseInt(tutorRes.rows[0]?.count || 0, 10);

    // 2. Tổng số học viên
    const studentRes = await pool.query('SELECT COUNT(*) FROM users');
    const totalStudents = parseInt(studentRes.rows[0]?.count || 0, 10);

    // 3. Lớp đang chạy / đã xác nhận
    const activeClassRes = await pool.query("SELECT COUNT(*) FROM bookings WHERE status IN ('confirmed', 'in_progress', 'đã xác nhận')");
    const activeClasses = parseInt(activeClassRes.rows[0]?.count || 0, 10);

    // 4. Doanh thu tháng
    const revenueRes = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as total_rev 
      FROM transactions 
      WHERE created_at >= NOW() - INTERVAL '30 days' 
        AND type IN ('deposit', 'booking_payment', 'tutor_earning')
    `);
    const bookingRevRes = await pool.query(`
      SELECT COALESCE(SUM(total_fee), 0) as completed_fee 
      FROM bookings 
      WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '30 days'
    `);
    const monthlyRevenue = parseFloat(revenueRes.rows[0]?.total_rev || 0) + parseFloat(bookingRevRes.rows[0]?.completed_fee || 0);

    // 5. 10 Lớp học mới kết nối nhất
    const recentClassesRes = await pool.query(`
      SELECT 
        b.id,
        b.subject,
        b.schedule_time,
        b.status,
        u.full_name as student_name,
        t.full_name as tutor_name,
        b.created_at
      FROM bookings b
      LEFT JOIN users u ON b.user_id = u.id
      LEFT JOIN tutors t ON b.tutor_id = t.id
      ORDER BY b.created_at DESC
      LIMIT 10
    `);

    const recentClasses = recentClassesRes.rows.map(item => ({
      id: `#${item.id}`,
      tutor: item.tutor_name || 'Gia sư N/A',
      subject: item.subject || 'Môn học chung',
      student: item.student_name || 'Học viên N/A',
      time: item.schedule_time ? new Date(item.schedule_time).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : new Date(item.created_at).toLocaleDateString('vi-VN'),
      status: item.status === 'confirmed' ? 'Đang chạy' : item.status === 'completed' ? 'Hoàn thành' : item.status === 'pending' ? 'Chờ xác nhận' : (item.status === 'cancelled' || item.status === 'canceled' ? 'Đã hủy' : (item.status === 'rejected' ? 'Bị từ chối' : item.status))
    }));

    return {
      totalTutors,
      totalStudents,
      activeClasses,
      monthlyRevenue,
      recentClasses
    };
  }
}

export default new AdminFinanceService();
