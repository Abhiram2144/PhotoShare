const express = require("express");
const { register, login, getUserById, getMyProfile, updateProfileImage } = require("../controllers/user");
const { checkAuth } = require("../middleware/authentication");
const upload = require("../middleware/multer");

const router = express.Router();

// 🔓 Public routes
router.post("/signup", register);
router.post("/login", login);
// 🔐 Authenticated routes
router.post("/update-profile-image", checkAuth, upload.single("image"),  updateProfileImage);
router.get("/me", checkAuth, getMyProfile); // Get current logged-in user
router.get("/:id", checkAuth, getUserById); // Get any user by ID (optional)


router.get("/", (req, res) => {
  res.send("User route working ✅");
});

module.exports = router;
