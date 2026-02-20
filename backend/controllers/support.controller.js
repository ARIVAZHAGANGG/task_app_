const SupportMessage = require('../models/SupportMessage');
const aiService = require('../services/ai.service');

/**
 * Handle support chat and get AI response
 */
exports.handleSupportChat = async (req, res) => {
    try {
        const { message, context } = req.body;
        const userId = req.user.id;

        // Save user message
        const userMsg = new SupportMessage({
            userId,
            message,
            role: 'user',
            context
        });
        await userMsg.save();

        // Get AI response
        const aiResponse = await aiService.getChatResponse(userId, message);

        // Save AI message
        const aiMsg = new SupportMessage({
            userId,
            message: aiResponse,
            role: 'ai',
            context
        });
        await aiMsg.save();

        res.status(200).json({
            success: true,
            message: aiResponse, // Standardized key
            history: [userMsg, aiMsg]
        });
    } catch (error) {
        console.error('❌ Support Chat Error:', error);
        console.error('❌ Error Stack:', error.stack);
        res.status(500).json({ success: false, message: 'Failed to process support request', error: error.message });
    }
};

/**
 * Get support chat history
 */
exports.getSupportHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const history = await SupportMessage.find({ userId })
            .sort({ timestamp: 1 })
            .limit(50);

        res.status(200).json({
            success: true,
            history
        });
    } catch (error) {
        console.error('Support History Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch support history' });
    }
};
