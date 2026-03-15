// src/middleware/authorize.js

function authorize(requiredRole) {
  return (req, res, next) => {
    // req.user is set after login via JWT middleware
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized: No user logged in" });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }

    next(); // User has required role
  };
}

module.exports = authorize;
