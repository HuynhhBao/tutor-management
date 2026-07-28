import pool from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import notificationService from './notificationService.js';

class TutorFinanceService {
  /**
   * Lấy thông tin ví thu nhập, thông tin ngân hàng, lịch sử thu nhập & lệnh rút tiền của gia sư
   */
  async getWalletAndHistory(tutorId) {
    const tutorRes = await pool.query(
      'SELECT id, full_name, balance, bank_name, bank_account_number, bank_account_holder FROM tutors WHERE id = $1',
      [tutorId]
    );

    if (tutorRes.rows.length === 0) {
      throw new ApiError(404, 'Không tìm thấy thông tin gia sư');
    }

    const tutor = tutorRes.rows[0];

    // Lấy danh sách lịch sử giao dịch thu nhập (tutor_earning) và thanh toán lương (tutor_payout)
    const txRes = await pool.query(`
      SELECT id, amount, type, description, created_at
      FROM transactions
      WHERE user_id = $1 AND user_type = 'tutor'
      ORDER BY created_at DESC
      LIMIT 50
    `, [tutorId]);

    // Lấy danh sách các lệnh rút tiền (payout_requests)
    const payoutRes = await pool.query(`
      SELECT id, amount, status, bank_snapshot, admin_note, created_at, processed_at
      FROM payout_requests
      WHERE tutor_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [tutorId]);

    // Thống kê tổng tiền đã kiếm được & tổng tiền đã rút thành công
    const statsRes = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'tutor_earning' THEN amount ELSE 0 END), 0) AS total_earned,
        COALESCE(SUM(CASE WHEN type = 'tutor_payout' THEN amount ELSE 0 END), 0) AS total_withdrawn
      FROM transactions
      WHERE user_id = $1 AND user_type = 'tutor'
    `, [tutorId]);

    return {
      balance: parseFloat(tutor.balance || 0),
      bankInfo: {
        bankName: tutor.bank_name || '',
        bankAccountNumber: tutor.bank_account_number || '',
        bankAccountHolder: tutor.bank_account_holder || ''
      },
      stats: {
        totalEarned: parseFloat(statsRes.rows[0]?.total_earned || 0),
        totalWithdrawn: parseFloat(statsRes.rows[0]?.total_withdrawn || 0)
      },
      transactions: txRes.rows,
      payoutRequests: payoutRes.rows
    };
  }

  /**
   * Cập nhật thông tin tài khoản ngân hàng của gia sư
   */
  async updateBankInfo(tutorId, { bankName, bankAccountNumber, bankAccountHolder }) {
    if (!bankName || !bankAccountNumber || !bankAccountHolder) {
      throw new ApiError(400, 'Vui lòng cung cấp đầy đủ tên Ngân hàng, Số tài khoản và Tên chủ tài khoản!');
    }

    const res = await pool.query(`
      UPDATE tutors 
      SET bank_name = $1, bank_account_number = $2, bank_account_holder = $3
      WHERE id = $4 
      RETURNING bank_name, bank_account_number, bank_account_holder
    `, [bankName.trim(), bankAccountNumber.trim(), bankAccountHolder.trim().toUpperCase(), tutorId]);

    if (res.rows.length === 0) {
      throw new ApiError(404, 'Không tìm thấy gia sư');
    }

    return {
      bankName: res.rows[0].bank_name,
      bankAccountNumber: res.rows[0].bank_account_number,
      bankAccountHolder: res.rows[0].bank_account_holder
    };
  }

  /**
   * Tạo yêu cầu xin chi trả / rút tiền về tài khoản ngân hàng
   */
  async requestPayout(tutorId, amount) {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount < 200000) {
      throw new ApiError(400, 'Số tiền rút tối thiểu cho mỗi lệnh là 200.000 VNĐ!');
    }

    // Kiểm tra thông tin gia sư & số dư khả dụng
    const tutorRes = await pool.query(
      'SELECT balance, bank_name, bank_account_number, bank_account_holder FROM tutors WHERE id = $1',
      [tutorId]
    );

    if (tutorRes.rows.length === 0) {
      throw new ApiError(404, 'Không tìm thấy gia sư');
    }

    const tutor = tutorRes.rows[0];
    const currentBalance = parseFloat(tutor.balance || 0);

    if (currentBalance < parsedAmount) {
      throw new ApiError(400, `Số dư ví khả dụng (${currentBalance.toLocaleString('vi-VN')} VNĐ) không đủ để rút ${parsedAmount.toLocaleString('vi-VN')} VNĐ!`);
    }

    if (!tutor.bank_name || !tutor.bank_account_number || !tutor.bank_account_holder) {
      throw new ApiError(400, 'Bạn chưa thiết lập thông tin Tài khoản Ngân hàng thụ hưởng. Vui lòng cập nhật thông tin Ngân hàng trước khi rút tiền!');
    }

    // Kiểm tra xem có lệnh nào đang chờ xử lý không (mỗi gia sư chỉ nên có tối đa 2 lệnh pending cùng lúc)
    const pendingRes = await pool.query(`
      SELECT COUNT(*) AS pending_count 
      FROM payout_requests 
      WHERE tutor_id = $1 AND status = 'pending'
    `, [tutorId]);

    if (parseInt(pendingRes.rows[0]?.pending_count || 0, 10) >= 2) {
      throw new ApiError(400, 'Bạn đang có 2 yêu cầu rút tiền chờ Quản trị viên phê duyệt. Vui lòng đợi các yêu cầu trước được giải quyết!');
    }

    const bankSnapshot = JSON.stringify({
      bankName: tutor.bank_name,
      bankAccountNumber: tutor.bank_account_number,
      bankAccountHolder: tutor.bank_account_holder
    });

    const insertRes = await pool.query(`
      INSERT INTO payout_requests (tutor_id, amount, status, bank_snapshot)
      VALUES ($1, $2, 'pending', $3)
      RETURNING *
    `, [tutorId, parsedAmount, bankSnapshot]);

    await notificationService.sendNotification(
      tutorId,
      'tutor',
      '💸 Đã gửi yêu cầu rút tiền',
      `Yêu cầu rút số tiền ${parsedAmount.toLocaleString('vi-VN')} VNĐ về tài khoản ${tutor.bank_name} - ${tutor.bank_account_number} đã được ghi nhận và đang chờ Quản trị viên phê duyệt chi trả!`
    );

    return insertRes.rows[0];
  }
}

export default new TutorFinanceService();
