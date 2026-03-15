const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// REGISTER USER
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Generate student_id from email + timestamp
    const student_id = email.split('@')[0] + Date.now().toString().slice(-4);

    // Check if user exists
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password with bcrypt (10 salt rounds)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with 'voter' role by default
    const newUser = await pool.query(
      `INSERT INTO users (student_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, student_id, name, email, role`,
      [student_id, name, email, hashedPassword, "voter"]
    );

    res.status(201).json({
      message: "User registered successfully",
      user: newUser.rows[0]
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// LOGIN USER
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = userResult.rows[0];

    // Compare password using bcrypt
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    // Return user without password_hash
    const { password_hash, ...userData } = user;

    res.json({
      message: "Login successful",
      token: token,
      user: userData
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
