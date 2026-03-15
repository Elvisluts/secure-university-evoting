const authorize = require("../middleware/authorize");
const express = require("express");
const router = express.Router();
const pool = require("../config/db");

// CREATE ELECTION (ADMIN)
router.post("/create", authorize("admin"), async (req, res) => {
  const { title, type, start_date, end_date, is_active } = req.body;

  try {
    const election = await pool.query(
      `INSERT INTO elections (title, type, start_date, end_date, is_active)
       VALUES ($1,$2,$3,$4,$5)
       RETURNING *`,
      [title, type, start_date, end_date, is_active !== undefined ? is_active : true]
    );

    res.json({
      message: "Election created successfully",
      election: election.rows[0]
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ALL ELECTIONS (Protected - both admin and students can view)
router.get("/", async (req, res) => {
  try {
    const elections = await pool.query(
      "SELECT * FROM elections ORDER BY id DESC"
    );
    res.json(elections.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ACTIVE ELECTIONS (STUDENTS)
router.get("/active", async (req, res) => {
  try {
    const elections = await pool.query(
      `
      SELECT * FROM elections
      WHERE is_active = true
      AND start_date <= NOW()
      AND end_date >= NOW()
      ORDER BY id DESC
      `
    );
    res.json(elections.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE ELECTION (ADMIN)
router.delete("/:id", authorize("admin"), async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM elections WHERE id = $1", [id]);
    res.json({ message: "Election deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// VIEW RESULTS
router.get("/results/:election_id", async (req, res) => {
  const { election_id } = req.params;

  try {
    const results = await pool.query(
      `
      SELECT 
        c.id,
        c.name,
        COUNT(v.id) AS votes
      FROM candidates c
      LEFT JOIN votes v
      ON v.encrypted_choice = encode(digest(c.id::text, 'sha256'), 'hex')
      WHERE c.election_id = $1
      GROUP BY c.id, c.name
      ORDER BY votes DESC
      `,
      [election_id]
    );

    res.json({
      election_id,
      results: results.rows
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
