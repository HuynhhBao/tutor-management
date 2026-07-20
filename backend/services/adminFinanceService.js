import pool from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

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

    // Xác định khoảng thời gian
    let intervalQuery = "INTERVAL '30 days'";
    let dateFormat = 'DD/MM';
    let groupStep = 'day';

    if (period === '7d') {
      intervalQuery = "INTERVAL '7 days'";
      dateFormat = 'DD/MM';
      groupStep = 'day';
    } else if (period === '12m') {
      intervalQuery = "INTERVAL '1 year'";
      dateFormat = 'MM/YYYY';
      groupStep = 'month';
    }

    // 1. Thống kê Tổng Doanh Thu & Số lượng Giao dịch
    const summaryResult = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN type IN ('deposit', 'booking_payment') THEN amount ELSE 0 END), 0) as gross_revenue,
        COALESCE(SUM(CASE WHEN type = 'booking_payment' THEN amount ELSE 0 END), 0) as booking_revenue,
        COALESCE(SUM(CASE WHEN type = 'tutor_payout' THEN amount ELSE 0 END), 0) as tutor_payouts,
        COUNT(*) as total_transactions
      FROM transactions
      WHERE created_at >= NOW() - ${intervalQuery}
    `);

    const summary = summaryResult.rows[0];
    const grossRevenue = parseFloat(summary.gross_revenue || 0);
    const bookingRevenue = parseFloat(summary.booking_revenue || 0);
    const platformCommission = bookingRevenue * (commissionRate / 100);
    const totalTransactions = parseInt(summary.total_transactions || 0, 10);

    // 2. Tổng số dư ví học viên hiện tại trong hệ thống
    const userBalanceResult = await pool.query(`
      SELECT COALESCE(SUM(balance), 0) as total_user_balance FROM users
    `);
    const totalUserBalance = parseFloat(userBalanceResult.rows[0].total_user_balance || 0);

    // 3. Chuỗi dữ liệu biểu đồ xu hướng theo thời gian (Area Spline Chart)
    const chartTimelineResult = await pool.query(`
      WITH dates AS (
        SELECT generate_series(
          date_trunc('${groupStep}', NOW() - ${intervalQuery}),
          date_trunc('${groupStep}', NOW()),
          '1 ${groupStep}'::interval
        ) as time_bucket
      )
      SELECT 
        to_char(d.time_bucket, '${dateFormat}') as label,
        d.time_bucket,
        COALESCE(SUM(CASE WHEN t.type IN ('deposit', 'booking_payment') THEN t.amount ELSE 0 END), 0) as gross_revenue,
        COALESCE(SUM(CASE WHEN t.type = 'booking_payment' THEN t.amount ELSE 0 END), 0) * ($1 / 100.0) as commission,
        COUNT(t.id) as transactions_count
      FROM dates d
      LEFT JOIN transactions t ON date_trunc('${groupStep}', t.created_at) = d.time_bucket
      GROUP BY d.time_bucket
      ORDER BY d.time_bucket ASC
    `, [commissionRate]);

    const chartData = chartTimelineResult.rows.map(row => ({
      label: row.label,
      grossRevenue: Math.round(parseFloat(row.gross_revenue || 0)),
      commission: Math.round(parseFloat(row.commission || 0)),
      count: parseInt(row.transactions_count || 0, 10)
    }));

    // 4. Phân bổ các loại giao dịch (Donut Chart)
    const breakdownResult = await pool.query(`
      SELECT 
        type,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM transactions
      WHERE created_at >= NOW() - ${intervalQuery}
      GROUP BY type
    `);

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
    const totalItems = parseInt(countResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalItems / limitNum) || 1;

    // Data query
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
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
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
}

export default new AdminFinanceService();
