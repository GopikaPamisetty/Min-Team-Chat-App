const Message = require("../models/Message");
const Channel = require("../models/Channel");


// exports.getMessages = async (req, res) => {
//   try {
//     const { channelId } = req.params;
    
//     const messages = await Message.find({ channelId })
//       .populate("senderId", "name email")
//       .sort({ createdAt: 1 });

//     res.json(messages);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };


// controllers/messageController.js

exports.getMessages = async (req, res) => {
  try {
    const { channelId } = req.params;

    // Pagination values
    const page = parseInt(req.query.page) || 1;
    const limit = 20; // number of messages per page
    const skip = (page - 1) * limit;

    const messages = await Message.find({ channelId })
      .populate("senderId", "name email")
      .sort({ createdAt: -1 }) // newest first
      .skip(skip)
      .limit(limit);

    return res.json({
      page,
      limit,
      messages: messages.reverse(), // return oldest → newest
      hasMore: messages.length === limit,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



// controllers/messageController.js


exports.createMessage = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { text } = req.body;

    console.log("✉️ Creating message:", { channelId, text, sender: req.userId });

    const message = await Message.create({
      channelId,
      senderId: req.userId,
      text,
    });

    // Populate sender info
    const populated = await message.populate("senderId", "name email");

    // Emit via socket
    const io = req.app.get("io");
    if (io) {
      console.log("📢 Emitting newMessage to room:", channelId);
      io.to(channelId).emit("newMessage", populated);
    } else {
      console.log("⚠️ io not found on app");
    }

    res.status(201).json({ data: populated });
  } catch (err) {
    console.error("🔥 Create message error:", err);
    res.status(500).json({ message: err.message });
  }
};

