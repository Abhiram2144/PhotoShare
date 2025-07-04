const express = require("express");
const { register, login, getUserById, getMyProfile, updateProfileImage, updateUser, searchUser, getAllUsers } = require("../controllers/user");
const { checkAuth } = require("../middleware/authentication");
const upload = require("../middleware/multer");

const router = express.Router();

// 🔓 Public routes
router.post("/signup", register);
router.post("/login", login);
// 🔐 Authenticated routes
router.post("/update-profile-image", checkAuth, upload.single("image"),  updateProfileImage);
router.get("/me", checkAuth, getMyProfile); // Get current logged-in user
router.get("/user/:id", checkAuth, getUserById); // Get any user by ID (optional)
router.put("/update", checkAuth, updateUser);
router.get("/user/searchFriend/search", checkAuth, searchUser);
router.get("/all",checkAuth, getAllUsers);
router.get("/", (req, res) => {
  res.send("User route working ✅");
});

module.exports = router;
