const pool = require("../config/db");

// Create User
const createUser = async (student_id, name, email, password_hash, role) => {
  const result = await pool.query(
    `INSERT INTO users (student_id, name, email, password_hash, role)
     VALUES ($1,$2,$3,$4,$5)
     RETURNING *`,
    [student_id, name, email, password_hash, role]
  );

  return result.rows[0];
};

// Find user by email
const findUserByEmail = async (email) => {
  const result = await pool.query(
    "SELECT * FROM users WHERE email=$1",
    [email]
  );

  return result.rows[0];
};

module.exports = {
  createUser,
  findUserByEmail,
};
