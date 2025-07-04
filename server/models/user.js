const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },

  password: {
    type: String,
    required: true,
    select: false // Don't return password in queries by default
  },

  friends: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' // References other users
    }
  ],

  pendingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // received
  sentRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],    // sent
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  profileImage: {
    type: String, // Optional — Cloudinary URL
    default: ""
  },
profileImageId: { type: String },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
