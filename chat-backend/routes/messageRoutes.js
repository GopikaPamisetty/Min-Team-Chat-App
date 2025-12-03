// routes/messageRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/authMiddleware");
const { createMessage, getMessages, updateMessage,
    deleteMessage, } = require("../controllers/messageController");

router.get("/:channelId", auth, getMessages);
router.post("/:channelId", auth, createMessage);
router.put("/edit/:messageId", auth, updateMessage);
router.delete("/delete/:messageId", auth, deleteMessage);

module.exports = router;
