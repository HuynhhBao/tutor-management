import pool from './config/db.js';
async function test() {
  try {
    const res = await pool.query('SELECT id, status, balance_after FROM transactions ORDER BY created_at DESC LIMIT 2');
    console.log(res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}
test();
