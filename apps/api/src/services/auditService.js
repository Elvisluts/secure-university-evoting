const pool = require("../config/db");

const logAction = async (action_type, actor, details, vote_id = null) => {

  try {

    await pool.query(
      `INSERT INTO audit_logs
       (action_type, actor, details, vote_id)
       VALUES ($1,$2,$3,$4)`,
      [action_type, actor, details, vote_id]
    );

  } catch (err) {
    console.error("Audit log error:", err.message);
  }

};

module.exports = { logAction };
