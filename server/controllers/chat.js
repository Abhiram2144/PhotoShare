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

    let newMessage = await Message.create({
      chat: chatId,
      sender,
      content: uploadedImage.url,
      caption,
      imageId: uploadedImage.fileId, // getting stored fine
    });

    newMessage = await newMessage.populate("sender", "username profileImage");

    // Emit to all users in chat room
    req.app.get("io").to(chatId).emit("new_message", newMessage);

    res.status(201).json({ success: true, message: newMessage });
  } catch (err) {
    console.error("❌ Error sending message:", err);
    res.status(500).json({ success: false, message: "Failed to send message", error: err.message });
  }
};

// delete a message
const deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }
    // console.log("Came till here")
    if (message.sender.toString() !== userId) {
      return res.status(403).json({ message: "You can only delete your own messages" });
    }

    if (message.imageId) {
      await imagekit.deleteFile(message.imageId);
      console.log("Deleted image:", message.imageId);
    }

    await Message.findByIdAndDelete(messageId);

    // Optional: Notify the other user via socket (if you track chat rooms/users)
    const io = req.app.get("io");
    io.to(message.chat.toString()).emit("message_deleted", {
      messageId,
      chatId: message.chat.toString(),
    });

    res.json({ message: "Message deleted successfully" });

  } catch (err) {
    console.error("💥 Error deleting message", err);
    res.status(500).json({ message: "Failed to delete message", error: err.message });
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

  if (!emoji || !messageId) {
    return res.status(400).json({ error: "Missing emoji or messageId" });
  }

  try {
    const message = await Message.findById(messageId);
    if (!message) return res.status(404).json({ error: "Message not found" });

    // Replace existing reaction from the user
    const existingIndex = message.reactions.findIndex(r => r.userId.toString() === userId);
    if (existingIndex !== -1) {
      message.reactions[existingIndex].emoji = emoji;
    } else {
      message.reactions.push({ userId, emoji });
    }

    await message.save();

    // Emit update to chat room
    const io = req.app.get("io");
    io.to(message.chat.toString()).emit("message_reacted", { message });

    res.json({ message });
  } catch (err) {
    console.error("💥 Error reacting to message", err);
    res.status(500).json({ message: "Failed to react", error: err.message });
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
  getRecentChats,
  deleteMessage
};
