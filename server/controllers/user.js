const User = require("../models/user.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const imagekit = require("../utils/imagekit");
// ----------------- REGISTER -----------------
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const existingUsername = await User.findOne({ username });
    const existingEmail = await User.findOne({ email });

    if (existingUsername && existingEmail) {
      return res.status(400).json({ success: false, message: "Username and email already taken" });
    } else if (existingUsername) {
      return res.status(400).json({ success: false, message: "Username already taken" });
    } else if (existingEmail) {
      return res.status(400).json({ success: false, message: "Email already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      profileImage: "https://ik.imagekit.io/abhiram/Default_pfp.jpg?updatedAt=1752245852361"
    });

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        profileImage: newUser.profileImage
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Registration failed", error: err.message });
  }
};

// ----------------- LOGIN -----------------
const login = async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    const user = await User.findOne({
      $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }],
    }).select("+password");

    if (!user) {
      return res.status(404).json({ success: false, message: "No account found with this username or email" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.status(200).json({
      success: true,
      message: `Welcome back, ${user.username}`,
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Login failed", error: err.message });
  }
};

// ----------------- GET MY PROFILE -----------------
const getMyProfile = async (req, res) => {
  try {
    // console.log("req.userId: ", req.userId);
    const user = await User.findById(req.userId).select("-password");
    res.status(200).json({ success: true, user: user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error retrieving profile", error: err.message });
  }
};

// ----------------- GET PENDING REQUESTS -----------------
const getPendingRequests = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate({
      path: 'pendingRequests',
      select: 'username email profileImage'  // what info to return per requester
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ pending: user.pendingRequests });
  } catch (err) {
    console.error("Error fetching pending requests:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ----------------- UPDATE PROFILE PICTURE -----------------
const updateProfileImage = async (req, res) => {
  try {
    const userId = req.userId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: "No image provided" });
    }

    const user = await User.findById(userId);

    // Step 1: Delete the old image if it exists
    if (user.profileImageId) {
      try {
        await imagekit.deleteFile(user.profileImageId);
      } catch (err) {
        console.warn("Failed to delete previous image:", err.message);
      }
    }

    // Step 2: Upload new image
    const uploadedImage = await imagekit.upload({
      file: file.buffer,
      fileName: `profile_${userId}_${Date.now()}`,
    });

    // Step 3: Update user with new image and fileId
    user.profileImage = uploadedImage.url;
    user.profileImageId = uploadedImage.fileId;
    await user.save();

    res.status(200).json({ success: true, message: "Profile picture updated", user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Image upload failed", error: err.message });
  }
};

// ----------------- SEARCH USERS BY USERNAME ----------------- 
const searchUser = async (req, res) => {

  try {
    // const { username } = req.query;
    const currentUserId = req.userId; // from middleware

    const username = req.query.username?.trim();

    if (!username || username.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Username query required (min 2 characters)"
      });
    }

    const users = await User.find({
      username: { $regex: new RegExp(username, "i") },
      _id: { $ne: currentUserId } // exclude self
    }).select("username _id email profileImage");

    res.status(200).json({
      success: true,
      users
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Search failed",
      error: err.message
    });
  }
};


// ----------------- ADD FRIEND -----------------
const sendFriendRequest = async (req, res) => {
  try {
    const { friendId } = req.body;
    if (!friendId) return res.status(400).json({ success: false, message: "Friend ID required" });
    if (!mongoose.Types.ObjectId.isValid(friendId)) {
      return res.status(400).json({ success: false, message: "Invalid friend ID" });
    }
    const user = await User.findById(req.userId);
    const friend = await User.findById(friendId);
    if (user._id.equals(friend._id)) return res.status(400).json({ message: "Cannot send request to self" });

    if (!user || !friend) return res.status(404).json({ message: "User not found" });
    if (user.friends.includes(friend._id)) return res.status(400).json({ message: "Already friends" });
    if (user.sentRequests.includes(friend._id)) return res.status(400).json({ message: "Request already sent" });
    if (user.pendingRequests.includes(friend._id)) return res.status(400).json({ message: "They sent you a request. Accept it instead." });

    user.sentRequests.push(friend._id);
    friend.pendingRequests.push(user._id);

    await user.save();
    await friend.save();

    // Emit to receiver's room
    req.io.to(friendId).emit("friend_request_received", {
      _id: user._id,
      username: user.username,
      profileImage: user.profileImage
    });
    // Emit to sender's rooms
    req.io.to(req.userId).emit("friend_request_sent", {
      to: {
        _id: friend._id,
        username: friend.username,
        profileImage: friend.profileImage,
      }
    });
    res.status(200).json({ message: "Friend request sent" });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: "Error sending friend request",
      error: err.message
    });
  }
};

// ----------------- ACCEPT FRIEND REQUEST -----------------
const acceptFriendRequest = async (req, res) => {
  const { requesterId } = req.body;

  const user = await User.findById(req.userId);
  const requester = await User.findById(requesterId);
  if (user === requester) return res.status(400).json({ message: "You cannot accept a friend request from yourself" });

  if (!user || !requester) return res.status(404).json({ message: "User not found" });

  // Remove pending & sent
  user.pendingRequests = user.pendingRequests.filter(id => id.toString() !== requesterId);
  requester.sentRequests = requester.sentRequests.filter(id => id.toString() !== req.userId);

  // Add to friends
  user.friends.push(requester._id);
  requester.friends.push(user._id);

  await user.save();
  await requester.save();
  // Emit to receiver
  req.io.to(requesterId).emit("request_accepted", {
    _id: user._id,
    username: user.username,
    profileImage: user.profileImage
  });
  // Emit to sender
  req.io.to(req.userId).emit("friend_added", {
    friend: {
      _id: requester._id,
      username: requester.username,
      profileImage: requester.profileImage
    }
  });
  res.status(200).json({ message: `You are now friends with ${requester.username}`, friend: requester });
};

// ----------------- REJECT FRIEND REQUEST -----------------
const rejectFriendRequest = async (req, res) => {
  const { requesterId } = req.body;

  const user = await User.findById(req.userId);
  const requester = await User.findById(requesterId);
  if (user === requester) return res.status(400).json({ message: "You cannot reject a friend request from yourself" });

  if (!user || !requester) return res.status(404).json({ message: "User not found" });

  user.pendingRequests = user.pendingRequests.filter(id => id.toString() !== requesterId);
  requester.sentRequests = requester.sentRequests.filter(id => id.toString() !== req.userId);

  await user.save();
  await requester.save();
  req.io.to(requesterId).emit("friend_request_rejected", {
    by: {
      _id: user._id,
      username: user.username
    }
  });
  req.io.to(req.userId).emit("request_rejected_success", {
    rejected: {
      _id: requester._id,
      username: requester.username
    }
  });
  res.status(200).json({ message: "Friend request rejected" });
};

// ----------------- GET USER RELATIONS -----------------
const getUserRelations = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate("friends", "username email _id")
      .populate("sentRequests", "username email _id")
      .populate("pendingRequests", "username email _id");

    res.status(200).json({
      success: true,
      friends: user.friends,
      sentRequests: user.sentRequests,
      pendingRequests: user.pendingRequests,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to get relations", error: err.message });
  }
};

// ----------------- GET USER FRIENDS -----------------
const getFriends = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate("friends", "username email _id profileImage");
    res.status(200).json({ success: true, friends: user.friends });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to get friends", error: err.message });
  }
}
// ----------------- GET USER BY ID -----------------
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID format" });
    }

    const user = await User.findById(id).select("username email friends profileImage");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error retrieving user", error: err.message });
  }
};

// GET /auth/all
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.userId } }).select("username _id email profileImage");
    res.status(200).json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to get users", error: err.message });
  }
};


// ----------------- UPDATE USER -----------------
const updateUser = async (req, res) => {
  try {
    const id = req.userId;

    const allowedFields = ["username", "email", "profileImage"];
    const updates = Object.keys(req.body);

    const isValidUpdate = updates.every((field) => allowedFields.includes(field));
    if (!isValidUpdate) {
      return res.status(400).json({ success: false, message: "Invalid update fields" });
    }

    const username = req.body.username;
    if (username) {
      const existingUser = await User.findOne({ username });
      if (existingUser && existingUser._id.toString() !== id) {
        return res.status(400).json({ success: false, message: "Username already exists" });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(id, req.body, { new: true }).select("-password");
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.status(200).json({ success: true, user: updatedUser });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error updating user", error: err.message });
  }
};

const removeFriend = async (req, res) => {
  try {
    const { friendId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(friendId)) {
      return res.status(400).json({ success: false, message: "Invalid friend ID" });
    }
    const user = await User.findById(req.userId);
    const friend = await User.findById(friendId);
    if (!user || !friend) return res.status(404).json({
      success: false,
      message: "User or friend not found"
    });
    if (user.friends.includes(friendId)) {
      user.friends = user.friends.filter(friend =>
        friend.toString() !== friendId
      );
      await user.save();
      friend.friends = friend.friends.filter(friend =>
        friend.toString() !== req.userId
      );
      await friend.save();
      const io = req.app.get("io");
      io.to(friendId).emit("friend_removed", {
        by: {
          _id: user._id,
          username: user.username
        }
      });
      io.to(req.userId).emit("friend_removed", {
        by: {
          _id: friend._id,
          username: friend.username
        }
      });
      res.status(200).json({ success: true, message: "Friend removed" });
    } else {
      res.status(400).json({ success: false, message: "Friend not found in user friends list" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: "Error removing friend", error: err.message });
  }

}
// ----------------- EXPORT ALL -----------------
module.exports = {
  register,
  login,
  getMyProfile,
  searchUser,
  getUserById,
  updateUser,
  rejectFriendRequest,
  acceptFriendRequest,
  sendFriendRequest,
  getUserRelations,
  getFriends,
  updateProfileImage,
  removeFriend,
  getAllUsers,
  getPendingRequests
};
