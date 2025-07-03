const express = require("express");
const { register, login, getUserById, getMyProfile } = require("../controllers/user");
const { checkAuth } = require("../middleware/authentication");

const router = express.Router();

// 🔓 Public routes
router.post("/signup", register);
router.post("/login", login);

// 🔐 Authenticated routes
router.get("/me", checkAuth, getMyProfile); // Get current logged-in user
router.get("/:id", checkAuth, getUserById); // Get any user by ID (optional)

router.get("/", (req, res) => {
  res.send("User route working ✅");
});

module.exports = router;
