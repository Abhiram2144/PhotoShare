require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");

const authrouter = require('./routes/user');
const relationRouter = require('./routes/relations');
const chatRouter = require("./routes/chat");

const server = http.createServer(app);

// === SOCKET.IO SETUP ===
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
    credentials: true,
  },
});

const connectedUsers = new Map();


io.on("connection", (socket) => {
  console.log("🟢 New client connected:", socket.id);

  // Log all events
  socket.onAny((event, ...args) => {
    console.log(`⚡️ Received event: ${event}`, args);
  });


  //  In a real-world app, never trust client-sent IDs. Users can impersonate others. Use JWT from client and verify it before joining room:

  // socket.on("register", async (token) => {
  //   try {
  //     const decoded = jwt.verify(token, process.env.JWT_SECRET);
  //     const userId = decoded.id;
  //     socket.join(userId);
  //     connectedUsers.set(userId, socket.id);
  //   } catch (err) {
  //     console.error("⚠️ Invalid token on socket register");
  //     socket.disconnect();
  //   }
  // });
  // Update your client-side to emit the token instead of plain userId.

  // Register socket to userId
  socket.on("register", (userId) => {
    socket.join(userId);
    connectedUsers.set(userId, socket.id);
    console.log(`📥 User ${userId} joined their socket room`);
  });

  // Friend request sent
  socket.on("send_friend_request", ({ to, from }) => {
    io.to(to).emit("friend_request_received", from);  // ✅ matches frontend
  });

  socket.on("accept_friend_request", ({ to, from }) => {
    io.to(to).emit("request_accepted", from); // ✅ now matches frontend
    io.to(from).emit("request_accepted_confirmed", to); // inform the sender
  });

  socket.on("removed_friend", ({ to, from }) => {
    io.to(to).emit("friend_removed", from); // ✅ matches frontend
  });

  // Image send (already in your code)
  socket.on("send_image", ({ to, image }) => {
    // console.log(`📤 Sending image to ${to}`);
    io.to(to).emit("receive_image", { from: socket.id, image });
  });

  // Chat
  socket.on("join_chat", (chatId) => {
    socket.join(chatId);
    console.log(`🧃 Socket ${socket.id} joined chat room ${chatId}`);
  });

  socket.on("send_chat_message", ({ chatId, message }) => {
    io.to(chatId).emit("new_message", message);
  });

  socket.on("react_message", ({ chatId, messageId, emoji, userId }) => {
    io.to(chatId).emit("message_reacted", { messageId, emoji, userId });
  });

  // Disconnect logic
  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
    for (let [uid, sid] of connectedUsers.entries()) {
      if (sid === socket.id) {
        connectedUsers.delete(uid);
        break;
      }
    }
  });
});

// === MIDDLEWARES ===
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// Inject IO to request object for route-level access (already good)
app.use((req, res, next) => {
  req.io = io;
  next();
});
app.set("io", io);

// === ROUTES ===
app.use("/api/auth", authrouter);
app.use("/api/relations", relationRouter);
app.use("/api/chat", chatRouter);

// === ROOT ROUTE ===
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// === DB + SERVER START ===
server.listen(8000, () => {
  // console.log("🚀 Server running on port 8000");
  mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ucc4fkx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));
});
