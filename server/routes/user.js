const express = require("express");
const { register, login, getUserById } = require("../controllers/user");

const router = express.Router();

// User registration and login
router.post("/signup", register);
router.post("/login", login);

// Get user by ID (for search/invite or displaying user info)
router.get("/:id", getUserById);

// Basic route check
router.get("/", (req, res) => {
  res.send("User route working ✅");
});

module.exports = router;
