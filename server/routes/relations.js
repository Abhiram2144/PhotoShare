
const express = require("express");
const router = express.Router();
const { checkAuth } = require("../middleware/authentication");
const {
  sendFriendRequest,
  acceptFriendRequest,
  rejectFriendRequest,
  getUserRelations,
  getFriends,
  removeFriend,
} = require("../controllers/user");

// All routes below are protected
router.use(checkAuth);

// Get friend-related data for logged-in user
router.get("/all", getUserRelations);

// Send a friend request to another user
router.post("/send-request", sendFriendRequest);

// Accept a friend request
router.post("/accept-request", acceptFriendRequest);

// Reject a friend request
router.post("/reject-request", rejectFriendRequest);
router.delete("/remove/:friendId", checkAuth, removeFriend);
router.get("/friends", getFriends);

module.exports = router;