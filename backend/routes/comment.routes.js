const router = require('express').Router();
const auth = require('../middleware/auth.middleware');
const controller = require('../controllers/comment.controller');

// Get comments for a task
router.get('/:taskId', auth, controller.getTaskComments);

// Add comment to a task
router.post('/:taskId', auth, controller.addComment);

// Update comment
router.put('/:commentId', auth, controller.updateComment);

// Delete comment
router.delete('/:commentId', auth, controller.deleteComment);

module.exports = router;
