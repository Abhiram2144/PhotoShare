const express = require("express");
const router = express.Router();
const multer = require("multer");
const {checkAuth} = require("../middleware/authentication");
const {
  accessChat,
  sendMessage,
  getAllMessages,
  reactToMessage,
  getRecentChats,
  deleteMessage
} = require("../controllers/chat");

// === MULTER SETUP ===
const storage = multer.memoryStorage(); // for buffer uploads
const upload = multer({ storage });

// === ROUTES ===
router.post("/access", checkAuth, accessChat); // create chat or get that
router.post("/message/send", checkAuth, upload.single("image"), sendMessage); // send message
router.get("/message/:chatId", checkAuth, getAllMessages); // get all messages
router.patch("/message/react/:messageId", checkAuth, reactToMessage); // react to message
router.get("/recent", checkAuth, getRecentChats); // get recent chats
router.delete("/message/delete-message/:messageId", checkAuth, deleteMessage);
module.exports = router;
