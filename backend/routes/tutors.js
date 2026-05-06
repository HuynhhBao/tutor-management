import express from 'express';
import pool from '../config/db.js';
import multer from 'multer';
import path from 'path';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';

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
  const { fullName, email, gender, age, subject, qualification } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO tutors (full_name, email, gender, age, subjects, qualification) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [fullName, email, gender, age, subject, qualification]
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
  const { fullName, email, gender, age, subject, qualification } = req.body;
  try {
    const result = await pool.query(
      'UPDATE tutors SET full_name = $1, email = $2, gender = $3, age = $4, subjects = $5, qualification = $6 WHERE id = $7 RETURNING *',
      [fullName, email, gender, age, subject, qualification, id]
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

// In-memory OTP store for tutor applications
const applyOtpStore = new Map();

// Send OTP for tutor application email verification
router.post('/apply/send-otp', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ status: 'error', message: 'Vui lòng nhập email' });
  }

  if (!email.endsWith('@gmail.com')) {
    return res.status(400).json({ status: 'error', message: 'Chỉ chấp nhận email @gmail.com' });
  }

  // Check if already applied
  try {
    const existingApp = await pool.query('SELECT * FROM tutor_applications WHERE email = $1', [email]);
    if (existingApp.rows.length > 0) {
      const status = existingApp.rows[0].status;
      if (status === 'pending') {
        return res.status(400).json({ status: 'error', message: 'Email này đã nộp hồ sơ và đang chờ duyệt.' });
      } else if (status === 'approved') {
        return res.status(400).json({ status: 'error', message: 'Email này đã được duyệt làm gia sư.' });
      }
    }
  } catch (err) {
    console.error('Error checking application:', err);
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
  applyOtpStore.set(email, { otp, expiresAt });

  const mailOptions = {
    from: `"EduMatch" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: '🔐 Mã xác minh ứng tuyển Gia Sư - EduMatch',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: #f9fafb; border-radius: 12px;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #7c3aed; margin: 0; font-size: 28px;">🎓 EduMatch</h1>
        </div>
        <div style="background: white; border-radius: 12px; padding: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <h2 style="color: #1e293b; margin-top: 0;">Xác minh email ứng tuyển</h2>
          <p style="color: #475569;">Mã xác nhận nộp hồ sơ gia sư của bạn là:</p>
          <div style="background: #f1f5f9; border: 2px dashed #7c3aed; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
            <span style="font-size: 40px; font-weight: bold; letter-spacing: 10px; color: #7c3aed;">${otp}</span>
          </div>
          <p style="color: #ef4444; font-weight: bold;">⏰ Mã này có hiệu lực trong <strong>5 phút</strong></p>
          <p style="color: #94a3b8; font-size: 13px;">Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email.</p>
        </div>
        <p style="color: #cbd5e1; font-size: 12px; text-align: center; margin-top: 20px;">© 2025 EduMatch. All rights reserved.</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ status: 'ok', message: 'Mã OTP đã được gửi đến email của bạn' });
  } catch (err) {
    console.error('Error sending OTP:', err);
    res.status(500).json({ status: 'error', message: 'Không thể gửi email, vui lòng thử lại' });
  }
});

// Submit tutor application
router.post('/apply', upload.single('cvImage'), async (req, res) => {
  const { email, otp } = req.body;
  const cvFile = req.file;

  if (!email || !cvFile) {
    return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp email và hình ảnh CV' });
  }

  if (!email.endsWith('@gmail.com')) {
    return res.status(400).json({ status: 'error', message: 'Chỉ chấp nhận email @gmail.com' });
  }

  // Validate OTP
  if (!otp) {
    return res.status(400).json({ status: 'error', message: 'Vui lòng nhập mã xác nhận' });
  }

  const otpRecord = applyOtpStore.get(email);
  if (!otpRecord) {
    return res.status(400).json({ status: 'error', message: 'Mã xác nhận không hợp lệ. Vui lòng yêu cầu mã mới.' });
  }

  if (Date.now() > otpRecord.expiresAt) {
    applyOtpStore.delete(email);
    return res.status(400).json({ status: 'error', message: 'Mã xác nhận đã hết hạn. Vui lòng yêu cầu mã mới.' });
  }

  if (otpRecord.otp !== otp.toString()) {
    return res.status(400).json({ status: 'error', message: 'Mã xác nhận không đúng.' });
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

    // Clear OTP after successful submission
    applyOtpStore.delete(email);

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
      subject: 'EduMatch - Thông báo mời phỏng vấn Gia Sư',
      html: `
        <h3>Chúc mừng bạn đã vượt qua vòng sơ loại của EduMatch!</h3>
        <p>Chúng tôi xin trân trọng kính mời bạn đến tham dự buổi phỏng vấn gia sư với thông tin chi tiết như sau:</p>
        <ul>
          <li><strong>Thời gian:</strong> ${interviewTime}</li>
          <li><strong>Địa điểm:</strong> ${interviewAddress}</li>
        </ul>
        <p>Vui lòng xác nhận lại bằng cách trả lời email này nếu bạn có thể tham gia.</p>
        <br/>
        <p>Trân trọng,</p>
        <p><strong>Đội ngũ EduMatch</strong></p>
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
      subject: 'EduMatch - Thông báo kết quả ứng tuyển Gia Sư',
      html: `
        <h3>Chào bạn,</h3>
        <p>Cảm ơn bạn đã quan tâm và gửi hồ sơ ứng tuyển làm gia sư tại hệ thống EduMatch.</p>
        <p>Sau khi xem xét kỹ lưỡng hồ sơ và năng lực của bạn, chúng tôi rất tiếc phải thông báo rằng hồ sơ của bạn <strong>hiện tại chưa phù hợp</strong> với các tiêu chí tuyển dụng của hệ thống.</p>
        <p>Chúng tôi đã xóa thông tin ứng tuyển của bạn trên hệ thống. Khi có thêm kinh nghiệm hoặc cập nhật CV mới, bạn hoàn toàn có thể nộp lại hồ sơ bất cứ lúc nào.</p>
        <p>Chúc bạn nhiều sức khỏe và thành công trên con đường giảng dạy!</p>
        <br/>
        <p>Trân trọng,</p>
        <p><strong>Đội ngũ EduMatch</strong></p>
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

// Grant account to tutor
router.post('/:id/grant-account', async (req, res) => {
  const { id } = req.params;
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp tên tài khoản' });
  }

  try {
    // Check if tutor exists
    const tutorResult = await pool.query('SELECT * FROM tutors WHERE id = $1', [id]);
    if (tutorResult.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy gia sư' });
    }
    const tutor = tutorResult.rows[0];

    if (!tutor.email) {
      return res.status(400).json({ status: 'error', message: 'Gia sư này chưa có địa chỉ email để nhận tài khoản' });
    }

    // Check if username already exists
    const userCheck = await pool.query('SELECT * FROM tutor_accounts WHERE username = $1', [username]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ status: 'error', message: 'Tên tài khoản này đã được sử dụng' });
    }

    // Generate random password
    const rawPassword = Math.random().toString(36).slice(-8); // 8 characters random
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    // Save to database
    await pool.query(
      'INSERT INTO tutor_accounts (tutor_id, username, password) VALUES ($1, $2, $3)',
      [id, username, hashedPassword]
    );

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: tutor.email,
      subject: 'EduMatch - Thông tin tài khoản Gia Sư',
      html: `
        <h3>Chào bạn ${tutor.full_name},</h3>
        <p>Tài khoản Gia Sư của bạn trên hệ thống EduMatch đã được khởi tạo thành công.</p>
        <p>Dưới đây là thông tin đăng nhập của bạn:</p>
        <ul>
          <li><strong>Tên đăng nhập:</strong> ${username}</li>
          <li><strong>Mật khẩu:</strong> ${rawPassword}</li>
        </ul>
        <p>Vui lòng đăng nhập và đổi mật khẩu trong lần đầu tiên truy cập để đảm bảo bảo mật.</p>
        <p>Chúc bạn có những giờ dạy hiệu quả!</p>
        <br/>
        <p>Trân trọng,</p>
        <p><strong>Đội ngũ EduMatch</strong></p>
      `
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) console.error('Error sending account email:', error);
      else console.log('Account email sent:', info.response);
    });

    res.status(201).json({ status: 'ok', message: 'Đã tạo tài khoản và gửi email thành công' });
  } catch (err) {
    console.error('Error granting account:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server' });
  }
});

export default router;
