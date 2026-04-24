import express from 'express';
import pool from '../config/db.js';

const router = express.Router();

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

export default router;
