const router = require("express").Router();
const auth = require("../middleware/auth.middleware");
const controller = require("../controllers/task.controller");

router.post("/", auth, controller.createTask);
router.get("/", auth, controller.getTasks);
router.get("/user", auth, controller.getUserTasks);
router.get("/stats", auth, controller.getTaskStats);
router.get("/priority-suggestion", auth, controller.getPrioritySuggestion);
router.get("/graph-data", auth, controller.getGraphData);
router.get("/admin-stats", auth, controller.getAdminStats);

// Kanban routes
router.get("/kanban", auth, controller.getKanbanTasks);

// Tag routes
router.get("/tags", auth, controller.getTags);
router.get("/tags/:tag", auth, controller.getTasksByTag);

// Overdue tasks
router.get("/overdue", auth, controller.getOverdueTasks);

// Subtask routes
router.post("/:id/subtasks", auth, controller.addSubtask);
router.put("/:id/subtasks/:subtaskId", auth, controller.toggleSubtask);
router.delete("/:id/subtasks/:subtaskId", auth, controller.deleteSubtask);

// Status update route
router.put("/:id/status", auth, controller.updateTaskStatus);

// General task routes
router.put("/batch-update", auth, controller.batchUpdateTasks);
router.put("/:id", auth, controller.updateTask);
router.delete("/:id", auth, controller.deleteTask);

// AI Suggestions
const analyticsController = require("../controllers/analytics.controller");

router.post("/breakdown", auth, controller.generateTaskBreakdown);
router.get("/analytics", auth, analyticsController.getAnalytics);
router.get("/:id/suggestions", auth, controller.getTaskSuggestions);
router.post("/:id/apply-suggestions", auth, controller.applyAISuggestions);

// Time Tracking
router.post("/:id/timer/start", auth, controller.startTimer);
router.post("/:id/timer/stop", auth, controller.stopTimer);
router.get("/timelogs", auth, controller.getTimeLogs);

// Pomodoro
router.post("/pomodoro/start", auth, controller.startPomodoroSession);
router.post("/pomodoro/:sessionId/complete", auth, controller.completePomodoroSession);
router.get("/pomodoro/stats", auth, controller.getPomodoroStats);

// Recurring Tasks
router.post("/:id/recurrence", auth, controller.createRecurringTask);
router.delete("/recurrence/:recurrenceId", auth, controller.stopRecurringTask);

// Dependencies
router.post("/:id/dependencies", auth, controller.addDependency);
router.delete("/:id/dependencies/:dependencyId", auth, controller.removeDependency);

// Reminders
router.put("/:id/reminder-sent", auth, controller.markReminderSent);

// Premium Actions
router.put("/:id/pin", auth, controller.togglePinned);
router.post("/:id/duplicate", auth, controller.duplicateTask);

module.exports = router;

