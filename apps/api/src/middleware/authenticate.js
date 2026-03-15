const jwt = require("jsonwebtoken");
const pool = require("../config/db");

async function authenticate(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ error: "No token provided" });

  const token = authHeader.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Invalid token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecretkey");

    // Fetch user info from DB to get role
    const userResult = await pool.query("SELECT id, email, role FROM users WHERE id = $1", [decoded.id]);
    if (userResult.rows.length === 0) return res.status(401).json({ error: "User not found" });

    req.user = userResult.rows[0]; // Attach user to request
    next();
  } catch (err) {
    res.status(401).json({ error: "Token invalid or expired" });
  }
}

module.exports = authenticate;
