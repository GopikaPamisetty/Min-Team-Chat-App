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

// MODELS
const Message = require("./models/Message");
const Channel = require("./models/Channel");

// INIT APP
const app = express();
const server = http.createServer(app);

// CONNECT DB
connectDB();

// MIDDLEWARES
app.use(express.json());
app.use(cookieParser());

// CORS
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://min-team-chat-app.vercel.app",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

// TEST ROUTE
app.get("/", (req, res) => {
  res.json({ message: "Chat API running " });
});

// ----------------------
// ROUTES
// ----------------------
app.use("/api/auth", authRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api/messages", messageRoutes);

// SOCKET.IO INIT
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://min-team-chat-app.vercel.app",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Make io available inside controllers
app.set("io", io);

// ----------------------
// ONLINE USERS + LAST SEEN
// ----------------------
const onlineUsers = new Map();  // socket.id -> { userId, name }
const lastSeen = new Map();     // userId -> timestamp

// ----------------------
// SOCKET EVENTS
// ----------------------
io.on("connection", (socket) => {
  console.log(" Connected:", socket.id);

  // USER ONLINE
  socket.on("userOnline", ({ userId, name }) => {
    onlineUsers.set(socket.id, { userId, name });

    // If user is online → remove lastSeen entry
    lastSeen.delete(userId);

    io.emit("onlineUsers", Object.fromEntries(onlineUsers));
  });

  // TYPING INDICATORS
  socket.on("typing", ({ channelId, userName }) => {
    socket.to(channelId).emit("showTyping", { userName });
  });

  socket.on("stopTyping", ({ channelId }) => {
    socket.to(channelId).emit("hideTyping");
  });

  // JOIN CHANNEL
  socket.on("joinChannel", async (channelId) => {
    socket.join(channelId);
    console.log(` ${socket.id} joined channel`, channelId);
  });

  // NEW MESSAGE → Delivered check
  socket.on("newMessage", async (msg) => {
    const { channelId, senderId } = msg;

    // Get all online users
    const onlineUserValues = Object.values(Object.fromEntries(onlineUsers));

    // Load channel members
    const channel = await Channel.findById(channelId).populate("members", "_id");

    const memberIds = channel.members.map((m) => m._id.toString());
    const receiverIds = memberIds.filter((id) => id !== senderId);

    // Check if any receiver is online
    let receiverOnline = false;

    for (let user of onlineUserValues) {
      if (receiverIds.includes(user.userId.toString())) {
        receiverOnline = true;
        break;
      }
    }

    // Mark message as delivered
    if (receiverOnline) {
      await Message.findByIdAndUpdate(msg._id, { delivered: true });
    }

    // SEND updated delivered state to clients
    const updatedMessages = await Message.find({ channelId })
      .populate("senderId", "name email");

    io.to(channelId).emit("messagesDelivered", updatedMessages);
  });

  // SEEN (blue tick)
  socket.on("messagesSeen", async ({ channelId, userId }) => {
    await Message.updateMany(
      { channelId, senderId: { $ne: userId }, seen: false },
      { seen: true }
    );

    const seenMessages = await Message.find({ channelId })
      .populate("senderId", "name email");

    io.to(channelId).emit("messagesSeenUpdate", seenMessages);
  });

  // LEAVE CHANNEL
  socket.on("leaveChannel", (channelId) => {
    socket.leave(channelId);
  });

  // DISCONNECT
  socket.on("disconnect", () => {
    const user = onlineUsers.get(socket.id);

    if (user) {
      const { userId } = user;

      // Save last seen
      lastSeen.set(userId, Date.now());

      // Remove from online list
      onlineUsers.delete(socket.id);

      // Broadcast updates
      io.emit("onlineUsers", Object.fromEntries(onlineUsers));

      io.emit("lastSeenUpdate", {
        userId,
        lastSeen: lastSeen.get(userId),
      });
    }

    console.log(" Disconnected:", socket.id);
  });
});

// RUN SERVER
const PORT = process.env.PORT || 5000;
server.listen(PORT, () =>
  console.log(` Server running on port ${PORT}`)
);
