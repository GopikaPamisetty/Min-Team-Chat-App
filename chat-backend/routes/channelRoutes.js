// routes/channelRoutes.js
const express = require("express");
const router = express.Router();

const auth = require("../middleware/authMiddleware");
const {
  getAllChannels,
  joinChannel,
  leaveChannel,
  createChannel
} = require("../controllers/channelController");




router.post("/", auth, createChannel);
router.get("/", auth, getAllChannels);
router.post("/:id/join", auth, joinChannel);
router.post("/:id/leave", auth, leaveChannel);


module.exports = router;
