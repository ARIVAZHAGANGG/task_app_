const express = require('express');
const router = express.Router();
const supportController = require('../controllers/support.controller');
const authMiddleware = require('../middleware/auth.middleware');

// All support routes are protected
router.use(authMiddleware);

router.post('/chat', supportController.handleSupportChat);
router.get('/history', supportController.getSupportHistory);
router.delete('/history', supportController.clearSupportHistory);


module.exports = router;
