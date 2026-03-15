const pool = require("../config/db");

// GET ACTIVE ELECTIONS
const getActiveElections = async (req, res) => {

  try {

    const elections = await pool.query(
      "SELECT * FROM elections WHERE is_active = true"
    );

    res.json(elections.rows);

  } catch (err) {

    res.status(500).json({
      error: err.message
    });

  }

};

module.exports = {
  getActiveElections
};
