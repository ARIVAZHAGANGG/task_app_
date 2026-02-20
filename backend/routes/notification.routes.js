const express = require('express');
const router = express.Router();
const {
    getNotifications,
    getNotificationsByUser,
    markAllAsRead,
    markAllAsReadByUser,
    markAsReadById,
    deleteNotification,
    clearNotifications,
    clearNotificationsByUser
} = require('../controllers/notification.controller');
const authMiddleware = require('../middleware/auth.middleware');

router.get('/', authMiddleware, getNotifications);
router.get('/user/:userId', authMiddleware, getNotificationsByUser);
router.put('/read-all', authMiddleware, markAllAsRead);
router.put('/read-all/:userId', authMiddleware, markAllAsReadByUser);
router.put('/read/:id', authMiddleware, markAsReadById);
router.delete('/clear', authMiddleware, clearNotifications);
router.delete('/:id', authMiddleware, deleteNotification);
router.delete('/user/:userId', authMiddleware, clearNotificationsByUser);

module.exports = router;
