// server.js
require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const channelRoutes = require("./routes/channelRoutes");
const messageRoutes = require("./routes/messageRoutes");

const app = express();
const server = http.createServer(app);

connectDB();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.json({ message: "Chat API running 🚀" });
});

// -------------------------
// SOCKET.IO
// -------------------------
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

// 🟣 ONLINE USERS STORAGE
const onlineUsers = new Map(); 
// socket.id → { userId, name }

io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);

  // USER CAME ONLINE
  socket.on("userOnline", ({ userId, name }) => {
    onlineUsers.set(socket.id, { userId, name });

    io.emit("onlineUsers", Object.fromEntries(onlineUsers));
  });

  // JOIN CHANNEL
  socket.on("joinChannel", (channelId) => {
    socket.join(channelId);
  });

  // LEAVE CHANNEL
  socket.on("leaveChannel", (channelId) => {
    socket.leave(channelId);
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    onlineUsers.delete(socket.id);

    io.emit("onlineUsers", Object.fromEntries(onlineUsers));
  });
});

// -------------------------
// ROUTES
// -------------------------
app.use("/api/auth", authRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/messages", messageRoutes);

// -------------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
