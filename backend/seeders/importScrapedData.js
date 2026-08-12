import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool, { initDb } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function seedScrapedTutors() {
  console.log('🔄 [DB Seeder] Đang kết nối CSDL và kiểm tra bộ dữ liệu khai thác...');
  
  const cleanDataPath = path.resolve(__dirname, '../../data_scraping/clean_tutors.json');
  if (!fs.existsSync(cleanDataPath)) {
    console.error('❌ Không tìm thấy file clean_tutors.json tại:', cleanDataPath);
    console.error('👉 Vui lòng chạy lệnh: python data_scraping/data_cleaner.py trước!');
    process.exit(1);
  }

  const fileContent = fs.readFileSync(cleanDataPath, 'utf-8');
  const tutors = JSON.parse(fileContent);
  console.log(`📦 Đã đọc thành công ${tutors.length} hồ sơ gia sư sạch từ Python Pandas.`);

  try {
    await initDb();
    // Đảm bảo cột hourly_rate có sẵn trên bảng tutors
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tutors' AND column_name='hourly_rate') THEN
          ALTER TABLE tutors ADD COLUMN hourly_rate INTEGER DEFAULT 200000;
        END IF;
      END
      $$;
    `);

    // Dọn dẹp & chuẩn hóa các khối lớp cũ không đúng danh mục 8 khối lớp mặc định (Lớp 6 đến Ôn thi Đại học)
    await pool.query("UPDATE tutors SET grade_levels = 'Lớp 10, Lớp 11, Lớp 12, Ôn thi Đại học' WHERE grade_levels LIKE '%Mọi đối tượng%' OR grade_levels LIKE '%Người đi làm%' OR grade_levels LIKE '%Sinh viên%' OR grade_levels LIKE '%Giao tiếp%' OR grade_levels LIKE '%nâng cao%'");
    await pool.query("UPDATE tutors SET grade_levels = 'Lớp 8, Lớp 9, Lớp 10' WHERE grade_levels LIKE '%cơ bản%' OR grade_levels LIKE '%Kiến trúc%' OR grade_levels LIKE '%Mọi%'");

    let insertedCount = 0;
    let skippedCount = 0;

    for (const tutor of tutors) {
      const { fullName, gender, age, subject, qualification, gradeLevels, hourlyRate, avatar_url, rating } = tutor;

      // Kiểm tra xem gia sư ảo có cùng họ tên đã tồn tại chưa
      const existingRes = await pool.query('SELECT id FROM tutors WHERE full_name = $1 LIMIT 1', [fullName]);
      
      if (existingRes.rows.length > 0) {
        // Cập nhật lại avatar về null, chuẩn hóa lại khối lớp hợp lệ, chuyên môn và học phí mới nhất
        await pool.query(
          'UPDATE tutors SET avatar_url = null, hourly_rate = $1, grade_levels = $2, subjects = $3, qualification = $4, rating = $5 WHERE id = $6',
          [hourlyRate || 200000, gradeLevels || '', subject || '', qualification || '', rating || 4.8, existingRes.rows[0].id]
        );
        skippedCount++;
        continue;
      }

      // Nạp vào CSDL với email và avatar_url là null (Gia sư thủ công/ảo sử dụng avatar ký tự viết tắt) và status là 'Active'
      await pool.query(
        `INSERT INTO tutors (
          full_name, email, gender, age, subjects, qualification, grade_levels, rating, avatar_url, hourly_rate, status
         ) VALUES ($1, null, $2, $3, $4, $5, $6, $7, null, $8, 'Active')`,
        [fullName, gender, age, subject, qualification, gradeLevels || '', rating || 4.8, hourlyRate || 200000]
      );
      insertedCount++;
    }

    console.log('\n========================= KẾT QUẢ IMPORT =========================');
    console.log(`✅ [Thành công] Đã thêm mới ${insertedCount} Gia sư ảo vào CSDL PostgreSQL!`);
    if (skippedCount > 0) {
      console.log(`ℹ️ [Bỏ qua] ${skippedCount} gia sư đã tồn tại trước đó.`);
    }
    console.log('💡 Trợ lý AI và hệ thống Tìm Gia Sư giờ đây đã có nguồn dữ liệu phong phú!');
    console.log('==================================================================\n');

  } catch (err) {
    console.error('❌ Lỗi trong quá trình nạp dữ liệu vào CSDL:', err);
  } finally {
    await pool.end();
    process.exit(0);
  }
}

seedScrapedTutors();
