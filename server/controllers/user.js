const User = require("../models/user.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

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
    const user = await User.findById(req.userId).select("username email _id friends");
    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error retrieving profile", error: err.message });
  }
};

// ----------------- SEARCH USERS BY USERNAME -----------------
const searchUser = async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) return res.status(400).json({ success: false, message: "Username query required" });

    const users = await User.find({
      username: { $regex: new RegExp(username, "i") },
      _id: { $ne: req.userId },
    }).select("username _id email");

    res.status(200).json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: "Search failed", error: err.message });
  }
};

// ----------------- ADD FRIEND -----------------
const addFriend = async (req, res) => {
  try {
    const { friendUsername } = req.body;

    if (!friendUsername) {
      return res.status(400).json({ success: false, message: "Friend username is required" });
    }

    const user = await User.findById(req.userId);
    const friend = await User.findOne({ username: friendUsername.toLowerCase().trim() });

    if (!user || !friend) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user._id.equals(friend._id)) {
      return res.status(400).json({ success: false, message: "You can't add yourself as a friend" });
    }

    if (user.friends.includes(friend._id)) {
      return res.status(400).json({ success: false, message: "Already connected" });
    }

    user.friends.push(friend._id);
    friend.friends.push(user._id);

    await user.save();
    await friend.save();

    res.status(200).json({ success: true, message: `You are now friends with ${friend.username}` });

  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to add friend", error: err.message });
  }
};

// ----------------- GET USER BY ID -----------------
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid user ID format" });
    }

    const user = await User.findById(id).select("username email _id");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.status(200).json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error retrieving user", error: err.message });
  }
};

// ----------------- UPDATE USER -----------------
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    const allowedFields = ["username", "email", "profilePicture"];
    const updates = Object.keys(req.body);

    const isValidUpdate = updates.every((field) => allowedFields.includes(field));
    if (!isValidUpdate) {
      return res.status(400).json({ success: false, message: "Invalid update fields" });
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

// ----------------- EXPORT ALL -----------------
module.exports = {
  register,
  login,
  getMyProfile,
  searchUser,
  addFriend,
  getUserById,
  updateUser,
};
