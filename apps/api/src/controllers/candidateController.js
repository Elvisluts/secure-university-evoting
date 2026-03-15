const pool = require("../config/db");

// GET CANDIDATES FOR AN ELECTION
const getCandidatesByElection = async (req, res) => {

  const { election_id } = req.params;

  try {

    const candidates = await pool.query(
      "SELECT * FROM candidates WHERE election_id = $1",
      [election_id]
    );

    res.json(candidates.rows);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

};

module.exports = {
  getCandidatesByElection
};
