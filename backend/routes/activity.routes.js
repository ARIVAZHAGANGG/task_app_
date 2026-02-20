const express = require('express');
const router = express.Router();
const {
    getActivities,
    getActivitiesByUser,
    getUserHistory,
    clearActivities
} = require('../controllers/activity.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/', authMiddleware, getActivities);
router.get('/user/:userId', authMiddleware, getUserHistory); // Updated to point to getUserHistory for /api/history mount
router.get('/history/user/:userId', authMiddleware, getUserHistory);
router.get('/log/user/:userId', authMiddleware, getActivitiesByUser);
router.delete('/', authMiddleware, clearActivities);

module.exports = router;
