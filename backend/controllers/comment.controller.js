const Comment = require('../models/Comment');
const Task = require('../models/Task');
const Notification = require('../models/Notification');

// Get comments for a task
exports.getTaskComments = async (req, res) => {
    try {
        const comments = await Comment.find({ taskId: req.params.taskId })
            .populate('userId', 'name email avatar')
            .populate('mentions', 'name email')
            .sort({ createdAt: -1 });

        res.json(comments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Add comment
exports.addComment = async (req, res) => {
    try {
        const { content } = req.body;

        // Verify task exists
        const task = await Task.findById(req.params.taskId);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        const comment = await Comment.create({
            taskId: req.params.taskId,
            userId: req.user.id,
            content
        });

        // Populate user data
        await comment.populate('userId', 'name email avatar');

        // Create notifications for mentions
        if (comment.mentions && comment.mentions.length > 0) {
            const mentionNotifications = comment.mentions.map(userId => ({
                userId,
                type: 'comment_mention',
                title: 'You were mentioned in a comment',
                message: `${req.user.name} mentioned you in a comment on "${task.title}"`,
                link: `/tasks/${task.id}`,
                metadata: {
                    taskId: task._id,
                    commentId: comment._id
                }
            }));

            await Notification.insertMany(mentionNotifications);
        }

        res.status(201).json(comment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update comment
exports.updateComment = async (req, res) => {
    try {
        const { content } = req.body;

        const comment = await Comment.findOne({
            _id: req.params.commentId,
            userId: req.user.id
        });

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found or unauthorized' });
        }

        comment.content = content;
        comment.isEdited = true;
        await comment.save();

        await comment.populate('userId', 'name email avatar');

        res.json(comment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Delete comment
exports.deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findOneAndDelete({
            _id: req.params.commentId,
            userId: req.user.id
        });

        if (!comment) {
            return res.status(404).json({ message: 'Comment not found or unauthorized' });
        }

        res.json({ message: 'Comment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = exports;
