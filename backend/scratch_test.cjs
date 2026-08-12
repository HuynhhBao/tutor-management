const { Pool } = require('pg');
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'tutor_management',
  password: '123', // wait, do I know the password? In previous logs, it said "****"
  port: 5432,
});
async function test() {
  const res = await pool.query('SELECT * FROM transactions ORDER BY created_at DESC LIMIT 5');
  console.log(res.rows);
  process.exit();
}
test();
