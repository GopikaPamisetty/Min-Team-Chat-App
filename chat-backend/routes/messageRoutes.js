// routes/messageRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { createMessage, getMessages } = require("../controllers/messageController");

router.get("/:channelId", auth, getMessages);
router.post("/:channelId", auth, createMessage);

module.exports = router;
