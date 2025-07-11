require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");

const authrouter = require('./routes/user');
const relationRouter = require('./routes/relations');

const server = http.createServer(app);

// === SOCKET.IO SETUP ===
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

const connectedUsers = new Map();

io.on("connection", (socket) => {
  console.log("🟢 New client connected:", socket.id);

  io.on("connection", (socket) => {
  socket.onAny((event, ...args) => {
    console.log(`⚡️ Received event: ${event}`, args);
  });
});
  // Register socket to userId
  socket.on("register", (userId) => {
    socket.join(userId);
    connectedUsers.set(userId, socket.id);
    console.log(`📥 User ${userId} joined their socket room`);
  });

  // Friend request sent
  socket.on("send_friend_request", ({ to, from }) => {
  io.to(to).emit("friendRequestReceived", from);  // ✅ matches frontend
});

socket.on("accept_friend_request", ({ to, from }) => {
  io.to(to).emit("requestAccepted", from); // ✅ now matches frontend
});

socket.on("removed_friend", ({ to, from }) => {
  io.to(to).emit("friendRemoved", from); // ✅ matches frontend
});

  // Image send (already in your code)
  socket.on("sendImage", ({ to, image }) => {
    console.log(`📤 Sending image to ${to}`);
    io.to(to).emit("receiveImage", { from: socket.id, image });
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

// === ROOT ROUTE ===
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// === DB + SERVER START ===
server.listen(8000, () => {
  console.log("🚀 Server running on port 8000");
  mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ucc4fkx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));
});
