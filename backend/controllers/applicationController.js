import pool from '../config/db.js';
import transporter from '../utils/mailer.js';
import bcrypt from 'bcryptjs';

// In-memory OTP store dành riêng cho ứng tuyển gia sư
const applyOtpStore = new Map();

// POST /api/tutors/apply/send-otp
export const sendApplyOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ status: 'error', message: 'Vui lòng nhập email' });
  }
  if (!email.endsWith('@gmail.com')) {
    return res.status(400).json({ status: 'error', message: 'Chỉ chấp nhận email @gmail.com' });
  }

  // Kiểm tra xem email đã ứng tuyển chưa
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
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 phút
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
};

// POST /api/tutors/apply
export const submitApplication = async (req, res) => {
  const { email, otp } = req.body;
  const cvFiles = req.files; // Sử dụng req.files thay vì req.file

  if (!email || !cvFiles || cvFiles.length === 0) {
    return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp email và ít nhất một hình ảnh CV' });
  }
  if (!email.endsWith('@gmail.com')) {
    return res.status(400).json({ status: 'error', message: 'Chỉ chấp nhận email @gmail.com' });
  }
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

  // Thu thập tất cả URL ảnh
  const cvImageUrls = cvFiles.map(file => `/uploads/${file.filename}`).join(',');

  try {
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
      [email, cvImageUrls]
    );

    applyOtpStore.delete(email);
    res.status(201).json({ status: 'ok', data: result.rows[0], message: 'Nộp hồ sơ ứng tuyển thành công' });
  } catch (err) {
    console.error('Error submitting tutor application:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server' });
  }
};

// GET /api/tutors/applications
export const getApplications = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM tutor_applications 
      WHERE email NOT IN (SELECT email FROM tutors WHERE email IS NOT NULL)
      ORDER BY created_at DESC
    `);
    res.json({ status: 'ok', data: result.rows });
  } catch (err) {
    console.error('Error fetching applications:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server' });
  }
};

// PUT /api/tutors/applications/:id/approve
export const approveApplication = async (req, res) => {
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

    transporter.sendMail({
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
    }, (error, info) => {
      if (error) console.error('Error sending email:', error);
      else console.log('Interview email sent:', info.response);
    });

    res.json({ status: 'ok', data: result.rows[0], message: 'Đã duyệt hồ sơ và gửi email thông báo' });
  } catch (err) {
    console.error('Error approving application:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server' });
  }
};

// DELETE /api/tutors/applications/:id/reject
export const rejectApplication = async (req, res) => {
  const { id } = req.params;

  try {
    const appResult = await pool.query('SELECT * FROM tutor_applications WHERE id = $1', [id]);
    if (appResult.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy hồ sơ ứng tuyển' });
    }
    const application = appResult.rows[0];

    await pool.query('DELETE FROM tutor_applications WHERE id = $1', [id]);

    let emailHtml = '';
    let emailSubject = '';

    if (application.status === 'approved') {
      emailSubject = 'EduMatch - Thông báo kết quả phỏng vấn Gia Sư';
      emailHtml = `
        <h3>Chào bạn,</h3>
        <p>Cảm ơn bạn đã dành thời gian tham gia buổi phỏng vấn gia sư cùng EduMatch.</p>
        <p>Sau khi đánh giá năng lực và các tiêu chí sư phạm, chúng tôi rất tiếc phải thông báo rằng bạn <strong>chưa đạt yêu cầu</strong> trong đợt tuyển dụng lần này.</p>
        <p>EduMatch đánh giá cao sự nhiệt tình của bạn. Chúng tôi hy vọng sẽ có cơ hội hợp tác với bạn trong tương lai khi bạn đã tích lũy thêm kinh nghiệm.</p>
        <p>Chúc bạn nhiều sức khỏe và thành công!</p>
        <br/>
        <p>Trân trọng,</p>
        <p><strong>Đội ngũ EduMatch</strong></p>
      `;
    } else {
      emailSubject = 'EduMatch - Thông báo kết quả hồ sơ ứng tuyển Gia Sư';
      emailHtml = `
        <h3>Chào bạn,</h3>
        <p>Cảm ơn bạn đã quan tâm và gửi hồ sơ ứng tuyển làm gia sư tại hệ thống EduMatch.</p>
        <p>Sau khi xem xét kỹ lưỡng hồ sơ và năng lực của bạn, chúng tôi rất tiếc phải thông báo rằng hồ sơ của bạn <strong>hiện tại chưa phù hợp</strong> với các tiêu chí tuyển dụng của hệ thống.</p>
        <p>Chúng tôi đã xóa thông tin ứng tuyển của bạn trên hệ thống. Khi có thêm kinh nghiệm hoặc cập nhật CV mới, bạn hoàn toàn có thể nộp lại hồ sơ bất cứ lúc nào.</p>
        <p>Chúc bạn nhiều sức khỏe và thành công trên con đường giảng dạy!</p>
        <br/>
        <p>Trân trọng,</p>
        <p><strong>Đội ngũ EduMatch</strong></p>
      `;
    }

    transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: application.email,
      subject: emailSubject,
      html: emailHtml
    }, (error, info) => {
      if (error) console.error('Error sending rejection email:', error);
      else console.log('Rejection email sent:', info.response);
    });

    res.json({ status: 'ok', message: 'Đã từ chối, gửi email và xóa hồ sơ' });
  } catch (err) {
    console.error('Error rejecting application:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server' });
  }
};

// POST /api/tutors/:id/grant-account
export const grantAccount = async (req, res) => {
  const { id } = req.params;
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp tên tài khoản' });
  }

  try {
    const tutorResult = await pool.query('SELECT * FROM tutors WHERE id = $1', [id]);
    if (tutorResult.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy gia sư' });
    }
    const tutor = tutorResult.rows[0];

    if (!tutor.email) {
      return res.status(400).json({ status: 'error', message: 'Gia sư này chưa có địa chỉ email để nhận tài khoản' });
    }

    const userCheck = await pool.query('SELECT * FROM tutor_accounts WHERE username = $1', [username]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ status: 'error', message: 'Tên tài khoản này đã được sử dụng' });
    }

    const rawPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(rawPassword, 10);

    await pool.query(
      'INSERT INTO tutor_accounts (tutor_id, username, password) VALUES ($1, $2, $3)',
      [id, username, hashedPassword]
    );

    transporter.sendMail({
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
    }, (error, info) => {
      if (error) console.error('Error sending account email:', error);
      else console.log('Account email sent:', info.response);
    });

    res.status(201).json({ status: 'ok', message: 'Đã tạo tài khoản và gửi email thành công' });
  } catch (err) {
    console.error('Error granting account:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server' });
  }
};
