const Task = require("../models/Task");
const { startOfDay, isBefore } = require("date-fns");

/**
 * Calculate and return AI Productivity Score
 * GET /api/ai/productivity/:userId
 */
exports.getProductivityScore = async (req, res) => {
    try {
        const userId = req.user.id;
        const tasks = await Task.find({ createdBy: userId });

        const now = new Date();
        const todayStart = startOfDay(now);

        let totalTasks = tasks.length;
        let completedTasks = 0;
        let completedToday = 0;
        let overdueTasks = 0;
        let highPriorityTasks = 0;
        let highPriorityPending = 0;

        tasks.forEach(task => {
            if (task.completed) {
                completedTasks++;
                if (task.completedAt >= todayStart) {
                    completedToday++;
                }
            } else {
                // Pending
                if (task.dueDate && isBefore(new Date(task.dueDate), now)) {
                    overdueTasks++;
                }
                if (task.priority === 'high') {
                    highPriorityPending++;
                }
            }

            if (task.priority === 'high') {
                highPriorityTasks++;
            }
        });

        // --- SCORING RULES ---
        let score = 50; // Base Score

        score += (completedToday * 10);      // +10 per completed task today
        score -= (overdueTasks * 5);         // -5 per overdue task

        // +5 points if all high priority tasks are completed (and there were some)
        if (highPriorityTasks > 0 && highPriorityPending === 0) {
            score += 5;
        }

        // -10 points if more than 3 high priority tasks are pending
        if (highPriorityPending > 3) {
            score -= 10;
        }

        // +5 bonus if completion rate > 80%
        const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) : 0;
        if (completionRate > 0.8) {
            score += 5;
        }

        // Clamp between 0 and 100
        score = Math.max(0, Math.min(100, score));


        // --- INSIGHTS GENERATION ---
        const insights = [];

        if (score > 80) {
            insights.push({ type: 'success', message: "Excellent productivity! Keep your momentum." });
        } else if (score >= 50) {
            insights.push({ type: 'info', message: "You're doing good. Focus on clearing high priority tasks." });
        } else {
            insights.push({ type: 'warning', message: "Productivity is low. Start with one small task." });
        }

        if (overdueTasks > 0) {
            insights.push({ type: 'warning', message: "You have overdue tasks. Clear them first." });
        }

        if (highPriorityPending > 2) {
            insights.push({ type: 'warning', message: "Too many high priority tasks pending." });
        }

        res.json({
            success: true,
            data: {
                score,
                stats: {
                    totalTasks,
                    completedTasks,
                    pendingTasks: totalTasks - completedTasks,
                    overdueTasks,
                    highPriorityPending
                },
                insights
            }
        });

    } catch (error) {
        console.error("AI Score Error:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
