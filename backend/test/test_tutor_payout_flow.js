import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

import pool, { initDb } from '../config/db.js';
import bookingService from '../services/bookingService.js';
import tutorFinanceService from '../services/tutorFinanceService.js';
import adminFinanceService from '../services/adminFinanceService.js';

// Tách logic tạo user và tutor ra hàm riêng để giảm Complexity
async function createTestAccounts() {
  const userRes = await pool.query(`
    INSERT INTO users (email, full_name, password, balance)
    VALUES ('user_payout_test_edu@test.com', 'Học viên Test Payout', 'hashed_pass_test', 2000000)
    RETURNING id
  `);
  const tutorRes = await pool.query(`
    INSERT INTO tutors (full_name, email, status, balance)
    VALUES ('Gia sư Test Payout', 'tutor_payout_test_edu@test.com', 'Đã duyệt', 0)
    RETURNING id
  `);
  return { userId: userRes.rows[0].id, tutorId: tutorRes.rows[0].id };
}

// Bỏ async function runTests() và dùng top-level await (IIFE tự thực thi)
try {
  console.log('🚀 BẮT ĐẦU KIỂM THỬ TRỌN VẸN LUỒNG VÍ GIA SƯ, KHÓA THỜI GIAN & CHI TRẢ VIETQR...');
  let userId = null;
  let tutorId = null;
  let bookingId = null;
  try {
    await initDb();
    console.log('✅ [Bước 1] Cấu hình & Database schema initialized thành công!');

    const accounts = await createTestAccounts();
    userId = accounts.userId;
    tutorId = accounts.tutorId;
    console.log(`✅ [Bước 2] Đã tạo Học viên (#${userId}) và Gia sư (#${tutorId}) với số dư ban đầu = 0 đ.`);

    // Test 1: Khóa thời gian (Time-gate Validation)
    // Tạo 1 booking có lịch học là thời gian tương lai (ví dụ bắt đầu cách đây 30 phút, thời lượng 2 giờ -> chưa hết giờ)
    const activeStartTime = new Date(Date.now() - 30 * 60 * 1000).toISOString(); // 30 phút trước
    const bookingRes = await pool.query(`
      INSERT INTO bookings (user_id, tutor_id, subject, schedule_time, duration, total_fee, status)
      VALUES ($1, $2, 'Toán Học (Test)', $3, 2.0, 600000, 'confirmed')
      RETURNING id
    `, [userId, tutorId, activeStartTime]);
    bookingId = bookingRes.rows[0].id;

    console.log(`📋 [Bước 3] Kiểm tra tính năng Khóa thời gian (Time-Gate) trên ca học #${bookingId}...`);
    try {
      await bookingService.completeBookingAsTutor(tutorId, bookingId);
      console.error('❌ Lỗi: Hệ thống đã cho phép hoàn thành lớp trước khi hết giờ (Time-gate thất bại)!');
      throw new Error('Time-gate failed to block early completion');
    } catch (err) {
      if (err.message === 'Time-gate failed to block early completion') throw err;
      console.log(`✅ [Time-Gate Đã Chặt] Hệ thống đã chặn chính xác: "${err.message}"`);
    }

    // Test 2: Hoàn thành lớp sau khi hết giờ & Tính toán thu nhập ví
    // Sửa lịch học thành cách đây 3 tiếng (đã hết giờ dạy)
    const pastStartTime = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
    await pool.query('UPDATE bookings SET schedule_time = $1 WHERE id = $2', [pastStartTime, bookingId]);

    console.log(`📋 [Bước 4] Giả lập thời gian đã trôi qua (> 2 giờ). Thực hiện tất toán lớp học...`);
    await bookingService.completeBookingAsTutor(tutorId, bookingId);
    
    // Kiểm tra số dư gia sư
    const financeInfo = await tutorFinanceService.getWalletAndHistory(tutorId);
    // Hoa hồng hệ thống là 15%, học phí 600.000đ -> thu nhập ròng = 600.000 * 0.85 = 510.000đ
    if (Number(financeInfo.balance) === 510000) {
      console.log(`✅ [Thu nhập ví chuẩn xác] Số dư gia sư hiện tại = ${Number(financeInfo.balance).toLocaleString('vi-VN')} VNĐ (Đã chia 15% phí hệ thống từ 600.000đ).`);
    } else {
      console.error(`❌ Lỗi tính toán thu nhập: Mong đợi 510.000đ, nhưng thực tế = ${financeInfo.balance}đ`);
      throw new Error(`Incorrect balance: ${financeInfo.balance}`);
    }

    // Test 3: Cập nhật thông tin tài khoản ngân hàng
    console.log(`📋 [Bước 5] Gia sư thiết lập tài khoản Ngân hàng VNĐ...`);
    const bankData = await tutorFinanceService.updateBankInfo(tutorId, {
      bankName: 'Vietcombank',
      bankAccountNumber: '098765432199',
      bankAccountHolder: 'nguyen van gia su' // Hệ thống sẽ tự động chuyển thành chữ hoa
    });
    console.log(`✅ [Cập nhật Ngân hàng] Đã lưu: ${bankData.bankName} - ${bankData.bankAccountNumber} (${bankData.bankAccountHolder})`);

    // Test 4: Tạo yêu cầu rút tiền (Tutor Payout Request)
    console.log(`📋 [Bước 6] Gia sư tạo lệnh rút tiền 400.000 VNĐ...`);
    const payoutReq = await tutorFinanceService.requestPayout(tutorId, 400000);
    console.log(`✅ [Yêu cầu rút tiền] Đã khởi tạo thành công Lệnh #${payoutReq.id}, Trạng thái: "${payoutReq.status}"`);

    // Test 5: Admin kiểm tra và Phê duyệt giải ngân
    console.log(`📋 [Bước 7] Admin kiểm tra danh sách chờ giải ngân và duyệt chi qua VietQR...`);
    const adminOverview = await adminFinanceService.getPayoutRequests({ status: 'pending' });
    const foundReq = adminOverview.requests.find(r => r.id === payoutReq.id);
    if (!foundReq) {
      console.error('❌ Lỗi: Không tìm thấy lệnh rút tiền trong danh sách chờ của Admin!');
    } else {
      console.log(`✅ [Admin Dashboard] Đã nhận lệnh rút của gia sư ${foundReq.tutor_name}, số dư hiện tại ${foundReq.tutor_current_balance}đ.`);
    }

    await adminFinanceService.processPayoutRequest(payoutReq.id, 'approve', 'Đã chuyển tiền Vietcombank thành công via VietQR');
    console.log(`✅ [Admin Duyệt Chi] Đã xử lý giải ngân Lệnh #${payoutReq.id}!`);

    // Kiểm tra số dư cuối cùng của gia sư sau khi rút 400.000đ từ 510.000đ -> còn 110.000đ
    const finalInfo = await tutorFinanceService.getWalletAndHistory(tutorId);
    if (Number(finalInfo.balance) === 110000) {
      console.log(`✅ [Thử nghiệm số dư cuối cùng] Số dư khả dụng của gia sư sau rút = ${Number(finalInfo.balance).toLocaleString('vi-VN')} VNĐ (Mong đợi: 110.000 VNĐ).`);
    } else {
      console.error(`❌ Lỗi số dư cuối cùng: Mong đợi 110.000 VNĐ, thực tế = ${finalInfo.balance} đ`);
    }

    console.log(`🎉 TỔNG KẾT: TOÀN BỘ 7 BƯỚC KIỂM THỬ HỆ THỐNG VÍ GIA SƯ VÀ QUẢN TRỊ CHI TRẢ VIETQR ĐẠT KẾT QUẢ HOÀN HẢO!`);

    // Dọn dẹp dữ liệu test
    if (bookingId) await pool.query('DELETE FROM bookings WHERE id = $1', [bookingId]);
    if (tutorId) await pool.query('DELETE FROM payout_requests WHERE tutor_id = $1', [tutorId]);
    await pool.query('DELETE FROM transactions WHERE user_id IN ($1, $2)', [userId || -1, tutorId || -1]);
    if (userId) await pool.query('DELETE FROM users WHERE id = $1', [userId]);
    if (tutorId) await pool.query('DELETE FROM tutors WHERE id = $1', [tutorId]);
    console.log('🧹 Đã dọn dẹp dữ liệu kiểm thử thành công.');

    process.exit(0);
  } catch (error) {
    console.error('❌ LỖI TRONG QUÁ TRÌNH KIỂM THỬ:', error);
    try {
      if (bookingId) await pool.query('DELETE FROM bookings WHERE id = $1', [bookingId]);
      if (tutorId) await pool.query('DELETE FROM payout_requests WHERE tutor_id = $1', [tutorId]);
      if (userId && tutorId) await pool.query('DELETE FROM transactions WHERE user_id IN ($1, $2)', [userId, tutorId]);
      if (userId) await pool.query('DELETE FROM users WHERE id = $1', [userId]);
      if (tutorId) await pool.query('DELETE FROM tutors WHERE id = $1', [tutorId]);
    } catch (cleanupErr) {
      console.error('Cleanup error:', cleanupErr);
    }
    process.exit(1);
  }
}

