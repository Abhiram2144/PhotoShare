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

  profileImage: {
    type: String, // Optional — Cloudinary URL
    default: ""
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', userSchema);
