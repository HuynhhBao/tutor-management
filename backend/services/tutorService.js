import pool from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

class TutorService {
  async getTutorStats() {
    const [tutorsResult, pendingResult] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM tutors'),
      pool.query(`
        SELECT COUNT(*) FROM tutor_applications 
        WHERE status = 'pending' 
        AND email NOT IN (SELECT email FROM tutors WHERE email IS NOT NULL)
      `),
    ]);

    return {
      totalTutors: Number.parseInt(tutorsResult.rows[0].count, 10),
      pendingApplications: Number.parseInt(pendingResult.rows[0].count, 10),
    };
  }

  async getAllTutors() {
    const result = await pool.query('SELECT * FROM tutors ORDER BY created_at DESC');
    return result.rows;
  }

  async createTutor({ fullName, email, gender, age, subject, qualification, gradeLevels }) {
    try {
      const cleanEmail = (email && email.trim() !== '') ? email.trim() : null;
      if (cleanEmail) {
        const existing = await pool.query('SELECT 1 FROM tutors WHERE email = $1', [cleanEmail]);
        if (existing.rows.length > 0) {
          throw new ApiError(409, 'Email này đã tồn tại trong hệ thống!');
        }
      }
      const result = await pool.query(
        'INSERT INTO tutors (full_name, email, gender, age, subjects, qualification, grade_levels) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
        [fullName, cleanEmail, gender, age, subject, qualification, gradeLevels || '']
      );
      return result.rows[0];
    } catch (err) {
      if (err.code === '23505') {
        throw new ApiError(409, 'Email này đã tồn tại trong hệ thống!');
      }
      throw err;
    }
  }

  async updateTutor(id, { fullName, email, gender, age, subject, qualification, gradeLevels }) {
    try {
      const cleanEmail = (email && email.trim() !== '') ? email.trim() : null;
      const result = await pool.query(
        'UPDATE tutors SET full_name = $1, email = $2, gender = $3, age = $4, subjects = $5, qualification = $6, grade_levels = $7 WHERE id = $8 RETURNING *',
        [fullName, cleanEmail, gender, age, subject, qualification, gradeLevels || '', id]
      );
      
      if (result.rows.length === 0) {
        throw new ApiError(404, 'Không tìm thấy gia sư');
      }
      return result.rows[0];
    } catch (err) {
      if (err.code === '23505') {
        throw new ApiError(400, 'Email này đã tồn tại trong hệ thống!');
      }
      throw err;
    }
  }

  async deleteTutor(id) {
    await pool.query('DELETE FROM tutors WHERE id = $1', [id]);
    return true;
  }

  async updateTutorStatus({ tutorId, status }) {
    const result = await pool.query(
      'UPDATE tutors SET status = $1 WHERE id = $2 RETURNING *',
      [status, tutorId]
    );
    
    if (result.rows.length === 0) {
      throw new ApiError(404, 'Không tìm thấy gia sư');
    }
    return result.rows[0];
  }

  async getRecommendedTutors(limit = 2) {
    // Lấy ngẫu nhiên gia sư bằng RANDOM()
    const result = await pool.query(
      'SELECT * FROM tutors ORDER BY RANDOM() LIMIT $1',
      [limit]
    );
    return result.rows;
  }
}

export default new TutorService();
