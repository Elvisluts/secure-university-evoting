const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const crypto = require("crypto");
const { logAction } = require("../services/auditService");
const authenticate = require("../middleware/authenticate");


// CAST VOTE
router.post("/cast", authenticate, async (req, res) => {

  const { election_id, candidate_id } = req.body;

  try {

    const user_id = req.user.id;

    // 1️⃣ Check if election exists
    const election = await pool.query(
      "SELECT * FROM elections WHERE id = $1",
      [election_id]
    );

    if (election.rows.length === 0) {
      return res.status(404).json({ error: "Election not found" });
    }

    const electionData = election.rows[0];

    // 2️⃣ Check voting window
    const now = new Date();

    if (now < electionData.start_date || now > electionData.end_date) {
      return res.status(400).json({
        error: "Voting window is closed"
      });
    }

    // 3️⃣ Prevent double voting
    const existingVote = await pool.query(
      "SELECT * FROM votes WHERE user_id = $1 AND election_id = $2",
      [user_id, election_id]
    );

    if (existingVote.rows.length > 0) {
      return res.status(400).json({
        error: "You have already voted in this election"
      });
    }

    // 4️⃣ Encrypt vote choice
    const encrypted_choice = crypto
      .createHash("sha256")
      .update(candidate_id.toString())
      .digest("hex");

    // 5️⃣ Get previous vote hash
    const lastVote = await pool.query(
      "SELECT vote_hash FROM votes ORDER BY id DESC LIMIT 1"
    );

    const previous_vote_hash =
      lastVote.rows.length > 0
        ? lastVote.rows[0].vote_hash
        : "GENESIS";

    // 6️⃣ Create vote hash (blockchain style)
    const voteData =
      encrypted_choice + election_id + previous_vote_hash;

    const vote_hash = crypto
      .createHash("sha256")
      .update(voteData)
      .digest("hex");

    // 7️⃣ Insert vote
    const vote = await pool.query(
      `INSERT INTO votes 
      (vote_hash, election_id, encrypted_choice, previous_vote_hash, user_id)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *`,
      [vote_hash, election_id, encrypted_choice, previous_vote_hash, user_id]
    );

    // 8️⃣ Audit log
    await logAction(
      "VOTE_CAST",
      user_id,
      "Vote cast in election " + election_id,
      vote.rows[0].id
    );

    res.json({
      message: "Vote cast successfully",
      vote: vote.rows[0]
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }

});


// GET ALL VOTES
router.get("/", async (req, res) => {

  try {

    const votes = await pool.query(
      "SELECT * FROM votes ORDER BY id DESC"
    );

    res.json(votes.rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }

});


// TALLY RESULTS
router.get("/tally/:election_id", async (req, res) => {

  const { election_id } = req.params;

  try {

    const results = await pool.query(
      `SELECT encrypted_choice, COUNT(*) as total
       FROM votes
       WHERE election_id = $1
       GROUP BY encrypted_choice`,
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
