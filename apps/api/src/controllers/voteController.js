const pool = require("../config/db");
const crypto = require("crypto");
const { logAction } = require("../services/auditService");


// CAST A VOTE
const castVote = async (req, res) => {

  const { election_id, encrypted_choice } = req.body;

  try {

    // get previous vote hash
    const lastVote = await pool.query(
      "SELECT vote_hash FROM votes ORDER BY id DESC LIMIT 1"
    );

    let previous_vote_hash = "GENESIS";

    if (lastVote.rows.length > 0) {
      previous_vote_hash = lastVote.rows[0].vote_hash;
    }

    // create vote hash
    const vote_hash = crypto
      .createHash("sha256")
      .update(encrypted_choice + election_id + previous_vote_hash)
      .digest("hex");

    // insert vote
    const vote = await pool.query(
      `INSERT INTO votes 
       (vote_hash, election_id, encrypted_choice, previous_vote_hash)
       VALUES ($1,$2,$3,$4)
       RETURNING *`,
      [vote_hash, election_id, encrypted_choice, previous_vote_hash]
    );

    // audit log
    await logAction(
      "VOTE_CAST",
      "anonymous_voter",
      "Vote cast in election " + election_id,
      vote.rows[0].id
    );

    res.json({
      message: "Vote successfully cast",
      vote_hash: vote_hash
    });

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

};



// GET ALL VOTES
const getVotes = async (req, res) => {

  try {

    const votes = await pool.query(
      "SELECT * FROM votes ORDER BY id DESC"
    );

    res.json(votes.rows);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

};



// TALLY RESULTS
const tallyVotes = async (req, res) => {

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

    res.status(500).json({
      error: err.message
    });

  }

};



module.exports = {
  castVote,
  getVotes,
  tallyVotes
};
