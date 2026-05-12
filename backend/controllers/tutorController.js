import pool from '../config/db.js';

// GET /api/tutors/stats
export const getTutorStats = async (req, res) => {
  try {
    const [tutorsResult, pendingResult] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM tutors'),
      pool.query(`
        SELECT COUNT(*) FROM tutor_applications 
        WHERE status = 'pending' 
        AND email NOT IN (SELECT email FROM tutors WHERE email IS NOT NULL)
      `),
    ]);
    res.json({
      status: 'ok',
      data: {
        totalTutors: Number.parseInt(tutorsResult.rows[0].count, 10),
        pendingApplications: Number.parseInt(pendingResult.rows[0].count, 10),
      },
    });
  } catch (err) {
    console.error('Error fetching tutor stats:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server' });
  }
};

// GET /api/tutors
export const getAllTutors = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM tutors ORDER BY created_at DESC');
    res.json({ status: 'ok', data: result.rows });
  } catch (err) {
    console.error('Error fetching tutors:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server' });
  }
};

// POST /api/tutors
export const createTutor = async (req, res) => {
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
};

// PUT /api/tutors/:id
export const updateTutor = async (req, res) => {
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
};

// DELETE /api/tutors/:id
export const deleteTutor = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tutors WHERE id = $1', [id]);
    res.json({ status: 'ok', message: 'Xóa gia sư thành công' });
  } catch (err) {
    console.error('Error deleting tutor:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server' });
  }
};

// PUT /api/tutors/status
export const updateTutorStatus = async (req, res) => {
  const { tutorId, status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE tutors SET status = $1 WHERE id = $2 RETURNING *',
      [status, tutorId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ status: 'error', message: 'Không tìm thấy gia sư' });
    }
    res.json({ status: 'ok', data: result.rows[0] });
  } catch (err) {
    console.error('Error updating tutor status:', err);
    res.status(500).json({ status: 'error', message: 'Lỗi server' });
  }
};
