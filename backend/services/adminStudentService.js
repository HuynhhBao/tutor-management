import pool from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

class AdminStudentService {
  async getAllStudents(search) {
    let query = 'SELECT id, email, full_name, phone_number, balance, is_active, avatar_url, created_at FROM users';
    const queryParams = [];

    if (search) {
      query += ' WHERE full_name ILIKE $1 OR email ILIKE $1';
      queryParams.push(`%${search}%`);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, queryParams);
    return result.rows;
  }

  async getStudentById(id) {
    const result = await pool.query(
      'SELECT id, email, full_name, phone_number, balance, is_active, avatar_url, created_at FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      throw new ApiError(404, 'Không tìm thấy học viên');
    }

    return result.rows[0];
  }

  async getStudentBookings(userId) {
    const query = `
      SELECT b.id, b.subject, b.schedule_time, b.status, b.created_at, 
             t.full_name as tutor_name, t.avatar_url as tutor_avatar
      FROM bookings b
      JOIN tutors t ON b.tutor_id = t.id
      WHERE b.user_id = $1
      ORDER BY b.created_at DESC
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  async toggleStudentStatus(id) {
    const userResult = await pool.query('SELECT is_active FROM users WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      throw new ApiError(404, 'Không tìm thấy học viên');
    }

    const currentStatus = userResult.rows[0].is_active;
    const newStatus = !currentStatus;

    const updateResult = await pool.query(
      'UPDATE users SET is_active = $1 WHERE id = $2 RETURNING id, email, full_name, is_active',
      [newStatus, id]
    );

    return updateResult.rows[0];
  }
}

export default new AdminStudentService();
