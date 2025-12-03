const Message = require("../models/Message");
const Channel = require("../models/Channel");

exports.getMessages = async (req, res) => {
  try {
    const { channelId } = req.params;

    // Pagination values
    const page = parseInt(req.query.page) || 1;
    const limit = 20; // number of messages per page
    const skip = (page - 1) * limit;

    const messages = await Message.find({ channelId })
      .populate("senderId", "name email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    return res.json({
      page,
      limit,
      messages: messages.reverse(),
      hasMore: messages.length === limit,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.createMessage = async (req, res) => {
  try {
    const { channelId } = req.params;
    const { text } = req.body;

    console.log(" Creating message:", { channelId, text, sender: req.userId });


    const message = await Message.create({
      channelId,
      senderId: req.userId,
      text,
    });

    const io = req.app.get("io");

    const populated = await message.populate("senderId", "name email");
    populated.senderId = populated.senderId._id;
    io.to(channelId).emit("newMessage", populated);

    res.status(201).json({ data: populated });
  } catch (err) {
    console.error(" Create message error:", err);
    res.status(500).json({ message: err.message });
  }
};


exports.updateMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { text } = req.body;
    const userId = req.userId;

    console.log(" Updating message:", { messageId, text, userId });

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (String(message.senderId) !== String(userId)) {
      return res.status(403).json({ message: "Not allowed to edit this message" });
    }

    if (message.isDeleted) {
      return res.status(400).json({ message: "Cannot edit a deleted message" });
    }

    message.text = text;
    message.isEdited = true;

    await message.save();
    const populated = await message.populate("senderId", "name email");

    const io = req.app.get("io");
    if (io) {
      console.log(" Emitting messageUpdated to room:", message.channelId.toString());
      io.to(message.channelId.toString()).emit("messageUpdated", populated);
    }

    res.json({ data: populated });
  } catch (err) {
    console.error(" Update message error:", err);
    res.status(500).json({ message: err.message });
  }
};


exports.deleteMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;

    console.log("🗑️ Deleting message:", { messageId, userId });

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: "Message not found" });
    }

    if (String(message.senderId) !== String(userId)) {
      return res.status(403).json({ message: "Not allowed to delete this message" });
    }


    if (message.isDeleted) {
      return res.json({ data: message });
    }

    message.text = "This message was deleted";
    message.isDeleted = true;
    message.isEdited = false;

    await message.save();
    const populated = await message.populate("senderId", "name email");

    const io = req.app.get("io");
    if (io) {
      console.log(" Emitting messageDeleted to room:", message.channelId.toString());
      io.to(message.channelId.toString()).emit("messageDeleted", populated);
    }

    res.json({ data: populated });
  } catch (err) {
    console.error(" Delete message error:", err);
    res.status(500).json({ message: err.message });
  }
};