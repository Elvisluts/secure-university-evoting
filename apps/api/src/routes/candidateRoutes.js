const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authorize = require("../middleware/authorize");

// REGISTER CANDIDATE (Admin only)
router.post("/register", authorize("admin"), async (req, res) => {
  const { name, manifesto, photo_url, election_id } = req.body;

  try {
    // Check if election exists
    const electionExists = await pool.query(
      "SELECT * FROM elections WHERE id = $1",
      [election_id]
    );

    if (electionExists.rows.length === 0) {
      return res.status(404).json({ error: "Election not found" });
    }

    const newCandidate = await pool.query(
      `INSERT INTO candidates (name, manifesto, photo_url, election_id)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [name, manifesto, photo_url || null, election_id]
    );

    res.json({
      message: "Candidate added successfully",
      candidate: newCandidate.rows[0]
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ALL CANDIDATES
router.get("/", async (req, res) => {
  try {
    const candidates = await pool.query("SELECT * FROM candidates");
    res.json(candidates.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET CANDIDATES BY ELECTION
router.get("/:election_id", async (req, res) => {
  const { election_id } = req.params;

  try {
    const candidates = await pool.query(
      "SELECT * FROM candidates WHERE election_id = $1",
      [election_id]
    );
    res.json(candidates.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE CANDIDATE (Admin only)
router.delete("/:id", authorize("admin"), async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query("DELETE FROM candidates WHERE id = $1", [id]);
    res.json({ message: "Candidate deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
