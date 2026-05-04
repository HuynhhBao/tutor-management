import express from 'express';
import pool from '../config/db.js';
import multer from 'multer';
import path from 'path';
import nodemailer from 'nodemailer';

const router = express.Router();

// Set up multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// Nodemailer config
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Get all tutors
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tutors ORDER BY created_at DESC');
    res.json({ status: 'ok', data: result.rows });
  } catch (err) {
    console.error('Error fetching tutors:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server' });
  }
});

// Create new tutor
router.post('/', async (req, res) => {
  const { fullName, gender, age, subject, qualification } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO tutors (full_name, gender, age, subjects, qualification) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [fullName, gender, age, subject, qualification]
    );
    res.status(201).json({ status: 'ok', data: result.rows[0] });
  } catch (err) {
    console.error('Error creating tutor:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server' });
  }
});

// Delete tutor
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tutors WHERE id = $1', [id]);
    res.json({ status: 'ok', message: 'Xóa gia sư thành công' });
  } catch (err) {
    console.error('Error deleting tutor:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server' });
  }
});

// Update tutor
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { fullName, gender, age, subject, qualification } = req.body;
  try {
    const result = await pool.query(
      'UPDATE tutors SET full_name = $1, gender = $2, age = $3, subjects = $4, qualification = $5 WHERE id = $6 RETURNING *',
      [fullName, gender, age, subject, qualification, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy gia sư' });
    }
    res.json({ status: 'ok', data: result.rows[0] });
  } catch (err) {
    console.error('Error updating tutor:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server' });
  }
});

// Submit tutor application
router.post('/apply', upload.single('cvImage'), async (req, res) => {
  const { email } = req.body;
  const cvFile = req.file;

  if (!email || !cvFile) {
    return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp email và hình ảnh CV' });
  }

  const cvImageUrl = `/uploads/${cvFile.filename}`;

  try {
    // Check if email already applied
    const existingApp = await pool.query('SELECT * FROM tutor_applications WHERE email = $1', [email]);
    if (existingApp.rows.length > 0) {
      const status = existingApp.rows[0].status;
      if (status === 'pending') {
        return res.status(400).json({ status: 'error', message: 'Email này đã nộp hồ sơ và đang chờ duyệt.' });
      } else if (status === 'approved') {
        return res.status(400).json({ status: 'error', message: 'Email này đã được duyệt làm gia sư.' });
      } else {
        return res.status(400).json({ status: 'error', message: 'Email này đã nộp hồ sơ trước đó.' });
      }
    }

    const result = await pool.query(
      'INSERT INTO tutor_applications (email, cv_image_url) VALUES ($1, $2) RETURNING *',
      [email, cvImageUrl]
    );
    res.status(201).json({ status: 'ok', data: result.rows[0], message: 'Nộp hồ sơ ứng tuyển thành công' });
  } catch (err) {
    console.error('Error submitting tutor application:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server' });
  }
});

// Get tutor applications
router.get('/applications', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tutor_applications ORDER BY created_at DESC');
    res.json({ status: 'ok', data: result.rows });
  } catch (err) {
    console.error('Error fetching applications:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server' });
  }
});

// Approve tutor application
router.put('/applications/:id/approve', async (req, res) => {
  const { id } = req.params;
  const { interviewTime, interviewAddress } = req.body;

  if (!interviewTime || !interviewAddress) {
    return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp thời gian và địa điểm phỏng vấn' });
  }

  try {
    const appResult = await pool.query('SELECT * FROM tutor_applications WHERE id = $1', [id]);
    if (appResult.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy hồ sơ ứng tuyển' });
    }
    
    const application = appResult.rows[0];

    const result = await pool.query(
      "UPDATE tutor_applications SET status = 'approved' WHERE id = $1 RETURNING *",
      [id]
    );

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: application.email,
      subject: 'GiaSuPro - Thông báo mời phỏng vấn Gia Sư',
      html: `
        <h3>Chúc mừng bạn đã vượt qua vòng sơ loại của GiaSuPro!</h3>
        <p>Chúng tôi xin trân trọng kính mời bạn đến tham dự buổi phỏng vấn gia sư với thông tin chi tiết như sau:</p>
        <ul>
          <li><strong>Thời gian:</strong> ${interviewTime}</li>
          <li><strong>Địa điểm:</strong> ${interviewAddress}</li>
        </ul>
        <p>Vui lòng xác nhận lại bằng cách trả lời email này nếu bạn có thể tham gia.</p>
        <br/>
        <p>Trân trọng,</p>
        <p><strong>Đội ngũ GiaSuPro</strong></p>
      `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) console.error('Error sending email:', error);
      else console.log('Interview email sent:', info.response);
    });

    res.json({ status: 'ok', data: result.rows[0], message: 'Đã duyệt hồ sơ và gửi email thông báo' });
  } catch (err) {
    console.error('Error approving application:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server' });
  }
});

// Reject tutor application
router.delete('/applications/:id/reject', async (req, res) => {
  const { id } = req.params;

  try {
    const appResult = await pool.query('SELECT * FROM tutor_applications WHERE id = $1', [id]);
    if (appResult.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy hồ sơ ứng tuyển' });
    }
    
    const application = appResult.rows[0];

    // Delete application so they can re-apply
    await pool.query('DELETE FROM tutor_applications WHERE id = $1', [id]);

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: application.email,
      subject: 'GiaSuPro - Thông báo kết quả ứng tuyển Gia Sư',
      html: `
        <h3>Chào bạn,</h3>
        <p>Cảm ơn bạn đã quan tâm và gửi hồ sơ ứng tuyển làm gia sư tại hệ thống GiaSuPro.</p>
        <p>Sau khi xem xét kỹ lưỡng hồ sơ và năng lực của bạn, chúng tôi rất tiếc phải thông báo rằng hồ sơ của bạn <strong>hiện tại chưa phù hợp</strong> với các tiêu chí tuyển dụng của hệ thống.</p>
        <p>Chúng tôi đã xóa thông tin ứng tuyển của bạn trên hệ thống. Khi có thêm kinh nghiệm hoặc cập nhật CV mới, bạn hoàn toàn có thể nộp lại hồ sơ bất cứ lúc nào.</p>
        <p>Chúc bạn nhiều sức khỏe và thành công trên con đường giảng dạy!</p>
        <br/>
        <p>Trân trọng,</p>
        <p><strong>Đội ngũ GiaSuPro</strong></p>
      `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) console.error('Error sending rejection email:', error);
      else console.log('Rejection email sent:', info.response);
    });

    res.json({ status: 'ok', message: 'Đã từ chối, gửi email và xóa hồ sơ' });
  } catch (err) {
    console.error('Error rejecting application:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server' });
  }
});

export default router;
