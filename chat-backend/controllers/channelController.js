const Channel = require("../models/Channel");


exports.createChannel = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.userId;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Channel name is required" });
    }

    const exists = await Channel.findOne({ name });
    if (exists) {
      return res.status(400).json({ message: "Channel already exists" });
    }

    const channel = await Channel.create({
      name,
      members: [userId],
    });

    res.status(201).json({
      message: "Channel created successfully",
      channel,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllChannels = async (req, res) => {
  try {
    const channels = await Channel.find().populate("members", "name email");
    res.json(channels);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.joinChannel = async (req, res) => {
  try {
    console.log("Incoming Channel ID:", req.params.id);
    const id = req.params.id;

    const channel = await Channel.findById(id);
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    if (channel.members.includes(req.userId)) {
      return res.json({ message: "Already a member" });
    }

    channel.members.push(req.userId);
    await channel.save();

    res.json({ message: "Joined channel", channel });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.leaveChannel = async (req, res) => {
  try {
    console.log("Incoming Channel ID:", req.params.id);
    const id = req.params.id;

    const channel = await Channel.findById(id);
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    channel.members = channel.members.filter(
      (m) => m.toString() !== req.userId
    );

    await channel.save();

    res.json({ message: "Left channel" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

