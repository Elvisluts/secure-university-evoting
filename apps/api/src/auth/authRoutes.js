const authController = require("./authController");

const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// REGISTER - Now accepts custom role
router.post("/register", async (req, res) => {
  const { student_id, name, email, password, role } = req.body;

  try {
    // Check if user exists
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Use provided role or default to "voter"
    const userRole = role || "voter";

    const newUser = await pool.query(
      `INSERT INTO users (student_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, student_id, name, email, role`,
      [student_id, name, email, hashedPassword, userRole]
    );

    res.status(201).json({
      message: "User registered successfully",
      user: newUser.rows[0]
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    const user = userResult.rows[0];
    
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(400).json({ error: "Invalid password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    const { password_hash, ...userData } = user;

    res.json({
      message: "Login successful",
      token: token,
      user: userData
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// CREATE ADMIN (One-time setup endpoint)
router.post("/create-admin", async (req, res) => {
  try {
    const { name, email, password, secret_key } = req.body;

    const ADMIN_SECRET = process.env.ADMIN_SECRET || "setup-admin-2024";
    
    if (secret_key !== ADMIN_SECRET) {
      return res.status(403).json({ error: "Invalid secret key" });
    }

    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length > 0) {
      const updated = await pool.query(
        "UPDATE users SET role = 'admin' WHERE email = $1 RETURNING id, student_id, name, email, role",
        [email]
      );
      return res.json({
        message: "Existing user updated to admin",
        user: updated.rows[0]
      });
    }

    const student_id = "ADMIN" + Date.now().toString().slice(-6);
    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = await pool.query(
      `INSERT INTO users (student_id, name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, student_id, name, email, role`,
      [student_id, name, email, hashedPassword, "admin"]
    );

    res.status(201).json({
      message: "Admin created successfully",
      user: newAdmin.rows[0]
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Use controller functions
router.post("/register", authController.register);
router.post("/login", authController.login);

module.exports = router;
