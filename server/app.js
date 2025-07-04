require("dotenv").config();
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");

const authrouter = require('./routes/user');
const relationRouter = require('./routes/relations');

const server = http.createServer(app); // for Socket.IO

// === SOCKET.IO SETUP ===
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Global socket map (optional for tracking)
const connectedUsers = new Map();

io.on("connection", (socket) => {
  console.log("🟢 New client connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
    connectedUsers.set(userId, socket.id);
    console.log(`User ${userId} joined their room`);
  });

  socket.on("sendImage", ({ to, image }) => {
    console.log(`📤 Sending image to ${to}`);
    io.to(to).emit("receiveImage", { from: socket.id, image });
  });

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
    for (let [uid, sid] of connectedUsers) {
      if (sid === socket.id) connectedUsers.delete(uid);
    }
  });
});

// === MIDDLEWARES ===
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// === ROUTES ===
app.use("/api/auth", authrouter);
app.use("/api/relations", relationRouter);

// === ROOT ROUTE ===
app.get("/", (req, res) => {
  res.send("Hello World!");
});

// === DATABASE + SERVER START ===
server.listen(8000, () => {
  console.log("🚀 Server running on port 8000");
  mongoose.connect(`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ucc4fkx.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`)
    .then(() => console.log("✅ Connected to MongoDB"))
    .catch((err) => console.error("❌ MongoDB connection error:", err));
});
