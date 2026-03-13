const express = require("express");
const router = express.Router();
const { getProductivityScore, suggestReminder, handleVoiceCommand } = require("../controllers/ai.controller");
const { handleSupportChat } = require("../controllers/support.controller");
const authMiddleware = require("../middleware/auth.middleware");

// GET /api/ai/productivity/:userId
router.get("/productivity/:userId", authMiddleware, getProductivityScore);

// POST /api/ai/chat (Real dynamic AI chat)
router.post("/chat", authMiddleware, handleSupportChat);

// POST /api/ai/suggest-reminder
router.post("/suggest-reminder", authMiddleware, suggestReminder);

// POST /api/ai/voice-command
router.post("/voice-command", authMiddleware, handleVoiceCommand);

module.exports = router;
