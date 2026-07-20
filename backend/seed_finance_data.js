import pool from './config/db.js';

async function seedFinanceData() {
  try {
    console.log('--- Starting Finance Seed Script ---');

    // Lấy ID học viên và gia sư trong DB
    const usersRes = await pool.query("SELECT id, full_name FROM users LIMIT 10");
    const tutorsRes = await pool.query("SELECT id, full_name FROM tutors LIMIT 10");

    const userList = usersRes.rows;
    const tutorList = tutorsRes.rows;

    if (userList.length === 0) {
      console.log('No users found in database to seed transactions.');
      process.exit(0);
    }

    // Kiểm tra số lượng giao dịch hiện tại
    const countRes = await pool.query("SELECT COUNT(*) FROM transactions");
    const currentCount = parseInt(countRes.rows[0].count, 10);
    console.log(`Current transactions count in DB: ${currentCount}`);

    // Seed khoảng 30 - 50 giao dịch đa dạng qua các ngày gần nhất
    const types = ['deposit', 'booking_payment', 'tutor_payout', 'refund'];
    const now = new Date();

    const sampleDescriptions = {
      deposit: [
        'Nạp tiền qua VNPay',
        'Nạp tiền qua Chuyển khoản ngân hàng QR Code',
        'Nạp tiền vào Ví EduMatch qua MoMo',
        'Nạp tiền tự động qua thẻ Visa'
      ],
      booking_payment: [
        'Thanh toán nhận lớp Toán 12 Nâng cao',
        'Thanh toán học phí Tiếng Anh IELTS 7.5',
        'Đặt cọc lớp Vật Lý Luyện thi Đại học',
        'Thanh toán lớp Hóa học 10 Chuyên'
      ],
      tutor_payout: [
        'Thanh toán thù lao giảng dạy tháng này cho Gia sư',
        'Chuyển tiền quyết toán lớp học hoàn tất #102',
        'Rút tiền từ tài khoản Gia sư về MBBank',
        'Thanh toán thưởng chuyên cần cho Gia sư'
      ],
      refund: [
        'Hoàn tiền hủy lớp học do Gia sư bận đột xuất',
        'Hoàn tiền học phí lớp Toán 10 theo yêu cầu Phụ huynh',
        'Hoàn trả tiền dư thừa sau khi đối soát'
      ]
    };

    let insertedCount = 0;
    // Generate data spread across the last 30 days
    for (let dayAgo = 30; dayAgo >= 0; dayAgo--) {
      // 1-3 transactions per day
      const dailyTxCount = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < dailyTxCount; i++) {
        const txDate = new Date(now.getTime() - dayAgo * 24 * 60 * 60 * 1000 - Math.random() * 12 * 60 * 60 * 1000);
        const type = types[Math.floor(Math.random() * types.length)];
        
        let userId;
        let userType;

        if (type === 'tutor_payout' && tutorList.length > 0) {
          userId = tutorList[Math.floor(Math.random() * tutorList.length)].id;
          userType = 'tutor';
        } else {
          userId = userList[Math.floor(Math.random() * userList.length)].id;
          userType = 'user';
        }

        let amount = 0;
        if (type === 'deposit') amount = [200000, 500000, 1000000, 2000000, 5000000][Math.floor(Math.random() * 5)];
        else if (type === 'booking_payment') amount = [300000, 600000, 1200000, 2500000, 4000000][Math.floor(Math.random() * 5)];
        else if (type === 'tutor_payout') amount = [500000, 1000000, 1800000, 3200000][Math.floor(Math.random() * 4)];
        else amount = [200000, 500000, 800000][Math.floor(Math.random() * 3)];

        const descs = sampleDescriptions[type];
        const description = descs[Math.floor(Math.random() * descs.length)];

        await pool.query(`
          INSERT INTO transactions (user_id, user_type, amount, type, description, created_at)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [userId, userType, amount, type, description, txDate]);

        insertedCount++;
      }
    }

    console.log(`Successfully seeded ${insertedCount} transactions!`);
    process.exit(0);
  } catch (err) {
    console.error('Seed finance error:', err);
    process.exit(1);
  }
}

seedFinanceData();
