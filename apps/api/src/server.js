const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authenticate = require("./middleware/authenticate");

const authRoutes = require("./auth/authRoutes");
const electionRoutes = require("./routes/electionRoutes");
const candidateRoutes = require("./routes/candidateRoutes");
const voteRoutes = require("./routes/voteRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Public Routes
app.use("/api/auth", authRoutes);

// Protected Routes
app.use("/api/elections", authenticate, electionRoutes);
app.use("/api/candidates", authenticate, candidateRoutes);
app.use("/api/votes", authenticate, voteRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("Secure University E-Voting API Running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
