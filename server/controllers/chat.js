const Chat = require("../models/chat");
const Message = require("../models/message");
const User = require("../models/user");
const imagekit = require("../utils/imagekit");

// === 1. Access or Create Chat ===
const accessChat = async (req, res) => {
  const { userId } = req.body; // ID of the other user
  const currentUserId = req.userId;

  if (!userId) {
    return res.status(400).json({ success: false, message: "User ID required" });
  }

  let chat = await Chat.findOne({
    participants: { $all: [currentUserId, userId], $size: 2 },
  }).populate("participants", "username profileImage");

  if (!chat) {
    chat = await Chat.create({ participants: [currentUserId, userId] });
    chat = await chat.populate("participants", "username profileImage");
  }

  res.status(200).json({ success: true, chat });
};

// === 2. Send Message (image + caption) ===
const sendMessage = async (req, res) => {
  try {
    const { chatId, caption } = req.body;
    const sender = req.userId;
    const file = req.file;

    if (!chatId || !file) {
      return res.status(400).json({ success: false, message: "chatId and image file are required" });
    }

    const uploadedImage = await imagekit.upload({
      file: file.buffer,
      fileName: `chat_${sender}_${Date.now()}`,
    });

    const newMessage = await Message.create({
      chat: chatId,
      sender,
      imageUrl: uploadedImage.url,
      imageId: uploadedImage.fileId,
      caption,
    });

    const populatedMessage = await newMessage
      .populate("sender", "username profileImage")
      .execPopulate?.(); // older Mongoose; newer returns promise

    // Emit to chat room
    req.io.to(chatId).emit("new_message", populatedMessage || newMessage);

    res.status(201).json({ success: true, message: populatedMessage || newMessage });
  } catch (err) {
    console.error("❌ Error sending message:", err);
    res.status(500).json({ success: false, message: "Failed to send message", error: err.message });
  }
};

// === 3. Get All Messages in a Chat ===
const getAllMessages = async (req, res) => {
  const { chatId } = req.params;

  try {
    const messages = await Message.find({ chat: chatId })
      .populate("sender", "username profileImage")
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to get messages", error: err.message });
  }
};

// === 4. React to a Message ===
const reactToMessage = async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const userId = req.userId;

  try {
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ success: false, message: "Message not found" });

    const existing = message.reactions.find(r => r.user.toString() === userId);
    if (existing) {
      existing.emoji = emoji; // update reaction
    } else {
      message.reactions.push({ user: userId, emoji });
    }

    await message.save();

    req.io.to(message.chat.toString()).emit("message_reacted", {
      messageId,
      emoji,
      userId,
    });

    res.status(200).json({ success: true, message: "Reaction updated" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to react", error: err.message });
  }
};

// In chatController.js
const getRecentChats = async (req, res) => {
  const chats = await Chat.find({ participants: req.userId })
    .populate("participants", "username profileImage")
    .populate({
      path: "latestMessage",
      populate: { path: "sender", select: "username profileImage" }
    })
    .sort({ updatedAt: -1 });

  const filtered = chats.map(chat => {
    const other = chat.participants.find(p => p._id.toString() !== req.userId);
    return {
      _id: chat._id,
      friend: other,
      latestMessage: chat.latestMessage,
      updatedAt: chat.updatedAt
    };
  });

  res.status(200).json({ success: true, chats: filtered });
};


module.exports = {
  accessChat,
  sendMessage,
  getAllMessages,
  reactToMessage,
  getRecentChats
};
