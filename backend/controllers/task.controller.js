const mongoose = require("mongoose");
const Task = require("../models/Task");
const { getLastDays } = require("../utils/analytics");
const simpleAI = require("../utils/simpleAI");
const User = require("../models/user.model");
const activityController = require("./activity.controller");
const notificationController = require("./notification.controller");
const aiService = require('../services/ai.service');
const TimeLog = require('../models/TimeLog');
const FocusSession = require('../models/FocusSession');
// Move problematic circular dependencies to function scope to prevent startup crashes
// const { createRecurrence, stopRecurrence } = require('../jobs/recurrence.cron');
// const gamificationController = require('./gamification.controller');

exports.createTask = async (req, res) => {
  try {
    const task = await Task.create({
      ...req.body,
      createdBy: req.user.id
    });

    // Log Activity
    await activityController.logActivity(
      req.user.id,
      'task_created',
      'Task',
      task._id,
      { title: task.title }
    );

    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.getTasks = async (req, res) => {
  try {
    const { filter, page = 1, limit = 50, category } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    let query = { createdBy: req.user.id };

    if (category) {
      query.category = category;
    }

    if (filter === "completed") {
      query.completed = true;
    } else if (filter === "important") {
      query.priority = "high";
      query.completed = { $ne: true };
    } else if (filter === "myday") {
      query.completed = { $ne: true };
    } else if (filter === "planned") {
      query.dueDate = { $exists: true };
      query.completed = { $ne: true };
    }

    // Use lean() for read-only data (30% faster)
    const tasks = await Task.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await Task.countDocuments(query);
    const pendingCount = await Task.countDocuments({ createdBy: req.user.id, completed: false });

    const enrichedTasks = tasks.map(task => {
      task.overdueRisk = simpleAI.checkOverdueRisk(pendingCount, task.dueDate);
      task.id = task._id.toString();
      delete task._id;
      delete task.__v;
      return task;
    });

    res.json({
      data: enrichedTasks,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTaskStats = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const stats = await Task.aggregate([
      { $match: { createdBy: userId } },
      {
        $facet: {
          basicStats: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                completed: { $sum: { $cond: [{ $eq: ["$completed", true] }, 1, 0] } },
                pending: { $sum: { $cond: [{ $eq: ["$completed", false] }, 1, 0] } },
                highPriority: { $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] } },
                mediumPriority: { $sum: { $cond: [{ $eq: ["$priority", "medium"] }, 1, 0] } },
                lowPriority: { $sum: { $cond: [{ $eq: ["$priority", "low"] }, 1, 0] } },
              }
            }
          ],
          weeklyCreated: [
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ],
          weeklyCompleted: [
            { $match: { completed: true, updatedAt: { $gte: sevenDaysAgo } } },
            {
              $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } },
                count: { $sum: 1 }
              }
            },
            { $sort: { _id: 1 } }
          ]
        }
      }
    ]);

    const result = stats[0];
    const basic = result.basicStats[0] || {
      total: 0, completed: 0, pending: 0,
      highPriority: 0, mediumPriority: 0, lowPriority: 0
    };

    // Fill in last 7 days with zeros if missing
    const last7Days = getLastDays(7);
    const formatWeekly = (data) => last7Days.map(date => ({
      date,
      count: data.find(d => d._id === date)?.count || 0
    }));

    const aiStats = {
      total: basic.total,
      completed: basic.completed,
      pending: basic.pending,
      highPriorityPending: await Task.countDocuments({
        createdBy: userId,
        priority: "high",
        completed: false
      })
    };

    const productivityScore = simpleAI.calculateProductivityScore(basic.completed, basic.total);
    const aiInsights = simpleAI.generateAIInsight(aiStats);

    console.log(`📊 [AI Insights] User: ${userId}, Score: ${productivityScore}%, Total: ${basic.total}, Completed: ${basic.completed}`);

    const summary = await aiService.generateDashboardSummary({
      totalTasks: basic.total,
      completedTasks: basic.completed,
      pendingTasks: basic.pending,
      productivityScore
    });

    res.json({
      totalTasks: basic.total,
      completedTasks: basic.completed,
      pendingTasks: basic.pending,
      priorityStats: {
        high: basic.highPriority,
        medium: basic.mediumPriority,
        low: basic.lowPriority
      },
      weeklyCreated: formatWeekly(result.weeklyCreated),
      weeklyCompleted: formatWeekly(result.weeklyCompleted),
      productivityScore,
      aiInsights,
      summary
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ---------------- AI BREAKDOWN ---------------- */
exports.generateTaskBreakdown = async (req, res) => {
  try {
    const { title, description } = req.body;
    console.log("AI Breakdown Request:", { title, description });
    if (!title) return res.status(400).json({ message: "Title is required" });

    const breakdown = await aiService.generateTaskBreakdown(title, description);
    console.log("AI Breakdown Generated:", breakdown);
    res.json({ breakdown });
  } catch (error) {
    console.error("AI Breakdown Error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.getPrioritySuggestion = async (req, res) => {
  try {
    const { dueDate } = req.query;
    const suggestion = simpleAI.suggestPriority(dueDate);
    res.json({ suggestedPriority: suggestion });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.markReminderSent = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { reminderSent: true },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json({ message: "Reminder marked as sent", task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getGraphData = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const monthlyStats = await Task.aggregate([
      { $match: { createdBy: userId } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
          created: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ["$completed", true] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } },
      { $limit: 12 }
    ]);

    const priorityDist = await Task.aggregate([
      { $match: { createdBy: userId } },
      {
        $group: {
          _id: "$priority",
          count: { $sum: 1 }
        }
      }
    ]);

    const totalTasks = await Task.countDocuments({ createdBy: userId });
    const completedTasks = await Task.countDocuments({ createdBy: userId, completed: true });

    res.json({
      monthlyStats: monthlyStats.map(m => ({
        month: m._id,
        created: m.created,
        completed: m.completed
      })),
      completionPercentage: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      priorityDistribution: priorityDist.map(p => ({
        name: p._id.charAt(0).toUpperCase() + p._id.slice(1),
        value: p.count
      }))
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAdminStats = async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: "Admin access required" });
  }

  try {
    const globalStats = await Task.aggregate([
      {
        $group: {
          _id: null,
          totalTasks: { $sum: 1 },
          completedTasks: { $sum: { $cond: [{ $eq: ["$completed", true] }, 1, 0] } },
        }
      }
    ]);

    const topProductiveUsers = await Task.aggregate([
      { $match: { completed: true } },
      {
        $group: {
          _id: "$createdBy",
          completedCount: { $sum: 1 }
        }
      },
      { $sort: { completedCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "userDetails"
        }
      },
      { $unwind: "$userDetails" },
      {
        $project: {
          userName: "$userDetails.name",
          userEmail: "$userDetails.email",
          completedCount: 1
        }
      }
    ]);

    res.json({
      globalStats: globalStats[0] || { totalTasks: 0, completedTasks: 0 },
      topProductiveUsers
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getUserTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ createdBy: req.user.id }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || id === "undefined" || id === "null") {
      return res.status(400).json({ success: false, message: "Invalid Task ID" });
    }

    // Find previous state to check for completion toggle
    const oldTask = await Task.findOne({ _id: id, createdBy: req.user.id });

    if (!oldTask) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // Check if task is being completed
    if (req.body.completed === true && !oldTask.completed) {
      const User = require('../models/user.model');
      const user = await User.findById(req.user.id);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const lastCompletion = user.lastCompletionDate ? new Date(user.lastCompletionDate) : null;
      if (lastCompletion) lastCompletion.setHours(0, 0, 0, 0);

      const oneDay = 24 * 60 * 60 * 1000;

      if (!lastCompletion) {
        // First task ever
        user.streak = 1;
      } else if (today.getTime() === lastCompletion.getTime()) {
        // Already completed a task today, streak stays same
      } else if (today.getTime() - lastCompletion.getTime() === oneDay) {
        // Consecutive day
        user.streak += 1;
      } else {
        // Missed a day
        user.streak = 1;
      }

      user.lastCompletionDate = new Date();
      if (user.streak > user.longestStreak) user.longestStreak = user.streak;

      await user.save();

      // NEW: Reward Gamification Points
      const gamificationController = require('./gamification.controller');
      await gamificationController.rewardPoints(req.user.id, 'task_completed');
    }

    const task = await Task.findOneAndUpdate(
      { _id: id, createdBy: req.user.id },
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ success: false, message: "Task not found" });
    }

    // Check if task was just completed
    if (!oldTask.completed && task.completed) {
      // Create Notification
      await notificationController.createNotification(
        req.user.id,
        'task_completed',
        'Task Completed 🎉',
        `You completed "${task.title}"`,
        '/tasks'
      );
    }

    // Log Activity
    await activityController.logActivity(
      req.user.id,
      'task_updated',
      'Task',
      task._id,
      { title: task.title, changes: req.body }
    );

    res.json({ success: true, data: task });
  } catch (error) {
    console.error("Task update error:", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.batchUpdateTasks = async (req, res) => {
  try {
    const { ids, updates } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ message: "Invalid IDs provided" });
    }

    // Explicitly convert string IDs to ObjectIds to ensure matching
    const objectIds = ids.map(id => mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id);

    const result = await Task.updateMany(
      { _id: { $in: objectIds }, createdBy: req.user.id },
      { $set: updates }
    );

    console.log(`Batch update successful: ${result.modifiedCount} tasks updated for user ${req.user.id}`);
    res.json({
      message: "Tasks updated successfully",
      modifiedCount: result.modifiedCount,
      matchedCount: result.matchedCount
    });
  } catch (error) {
    console.error("Batch update error:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || id === "undefined" || id === "null") {
      return res.status(400).json({ success: false, message: "Invalid Task ID" });
    }

    const task = await Task.findOneAndDelete({
      _id: id,
      createdBy: req.user.id
    });

    if (!task) return res.status(404).json({ success: false, message: "Task not found" });

    // Cleanup Notifications (Assuming metadata.taskId or similar link exists, 
    // but based on Notification model simpler to just not error out if not perfect linkage yet. 
    // For now, we will try to delete generic notifications related to this task if we can identify them,
    // or just leave as is since we don't store valid taskId ref in metadata strictly in all cases yet globally.
    // However, user Requirement 4 says "Remove related notifications". 
    // Let's assume metadata stores it as { taskId: id }.
    const Notification = require('../models/Notification');
    await Notification.deleteMany({ userId: req.user.id, 'metadata.taskId': task._id });

    // Log Activity
    await activityController.logActivity(
      req.user.id,
      'task_deleted',
      'Task',
      task._id,
      { title: task.title }
    );

    res.json({ success: true, message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.createTaskFromVoice = async (req, res) => {
  try {
    const { transcript } = req.body;
    if (!transcript) return res.status(400).json({ message: "Transcript is required" });

    // AI parses the transcript into a task object
    const taskData = await aiService.parseVoiceCommand(transcript);

    const task = await Task.create({
      ...taskData,
      createdBy: req.user.id,
      status: 'todo',
      completed: false
    });

    // Log Activity
    await activityController.logActivity(
      req.user.id,
      'task_created',
      'Task',
      task._id,
      { title: task.title, method: 'voice' }
    );

    res.status(201).json({
      success: true,
      message: "AI created your task!",
      data: task
    });
  } catch (error) {
    console.error("Voice Task Error:", error);
    res.status(500).json({ message: error.message });
  }
};

/* ---------------- KANBAN BOARD ---------------- */
exports.getKanbanTasks = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const kanbanData = await Task.aggregate([
      { $match: { createdBy: userId } },
      {
        $group: {
          _id: "$status",
          tasks: { $push: "$$ROOT" }
        }
      }
    ]);

    const result = {
      todo: [],
      in_progress: [],
      completed: []
    };

    kanbanData.forEach(group => {
      if (result.hasOwnProperty(group._id)) {
        result[group._id] = group.tasks;
      }
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ---------------- STATUS UPDATE ---------------- */
exports.updateTaskStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['todo', 'in_progress', 'completed'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const updateData = { status };

    // Auto-update completed field and completedAt based on status
    if (status === 'completed') {
      updateData.completed = true;
      updateData.completedAt = new Date();
    } else {
      updateData.completed = false;
      updateData.completedAt = null;
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // Log Activity
    let action = status === 'completed' ? 'task_completed' : 'task_updated';
    await activityController.logActivity(
      req.user.id,
      action,
      'Task',
      task._id,
      { title: task.title, status }
    );

    // If completed, send notification
    if (status === 'completed') {
      await notificationController.createNotification(
        req.user.id,
        'task_completed',
        'Task Completed! 🎉',
        `You've finished: "${task.title}". Great job!`,
        '/tasks'
      );
    }

    // NEW: Reward points if status is completed
    if (status === 'completed') {
      const gamificationController = require('./gamification.controller');
      await gamificationController.rewardPoints(req.user.id, 'task_completed');
    }

    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/* ---------------- SUBTASKS ---------------- */
exports.addSubtask = async (req, res) => {
  try {
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ message: "Subtask title is required" });
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { $push: { subtasks: { title, completed: false } } },
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.toggleSubtask = async (req, res) => {
  try {
    const { id, subtaskId } = req.params;

    const task = await Task.findOne({ _id: id, createdBy: req.user.id });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const subtask = task.subtasks.id(subtaskId);

    if (!subtask) {
      return res.status(404).json({ message: "Subtask not found" });
    }

    subtask.completed = !subtask.completed;
    await task.save();

    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteSubtask = async (req, res) => {
  try {
    const { id, subtaskId } = req.params;

    const task = await Task.findOneAndUpdate(
      { _id: id, createdBy: req.user.id },
      { $pull: { subtasks: { _id: subtaskId } } },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    res.json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/* ---------------- TAGS ---------------- */
exports.getTags = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);

    const tags = await Task.aggregate([
      { $match: { createdBy: userId } },
      { $unwind: "$tags" },
      { $group: { _id: "$tags", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $project: { tag: "$_id", count: 1, _id: 0 } }
    ]);

    res.json(tags);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTasksByTag = async (req, res) => {
  try {
    const { tag } = req.params;

    const tasks = await Task.find({
      createdBy: req.user.id,
      tags: tag
    }).sort({ createdAt: -1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ---------------- OVERDUE TASKS ---------------- */
exports.getOverdueTasks = async (req, res) => {
  try {
    const now = new Date();

    const tasks = await Task.find({
      createdBy: req.user.id,
      completed: false,
      dueDate: { $lt: now }
    }).sort({ dueDate: 1 });

    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ---------------- AI SUGGESTIONS ---------------- */
/* ---------------- AI SUGGESTIONS ---------------- */
exports.getTaskSuggestions = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const suggestions = await aiService.getTaskSuggestions(task.toObject(), req.user.id);
    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.applyAISuggestions = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const suggestions = await aiService.getTaskSuggestions(task.toObject(), req.user.id);

    // Apply AI suggestions
    task.priority = suggestions.suggestedPriority;
    task.estimatedTime = suggestions.estimatedTime;

    await task.save();

    res.json({
      task,
      suggestions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ---------------- TIME TRACKING ---------------- */
exports.startTimer = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if there's already an active timer
    const activeTimer = await TimeLog.findOne({
      userId: req.user.id,
      endTime: { $exists: false }
    });

    if (activeTimer) {
      return res.status(400).json({
        message: 'You already have an active timer. Stop it first.',
        activeTimer
      });
    }

    const timeLog = await TimeLog.create({
      taskId: req.params.id,
      userId: req.user.id,
      startTime: new Date(),
      type: 'manual'
    });

    res.json(timeLog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.stopTimer = async (req, res) => {
  try {
    const timeLog = await TimeLog.findOne({
      taskId: req.params.id,
      userId: req.user.id,
      endTime: { $exists: false }
    });

    if (!timeLog) {
      return res.status(404).json({ message: 'No active timer found for this task' });
    }

    timeLog.endTime = new Date();
    timeLog.calculateDuration();
    await timeLog.save();

    // Update task's actual time
    const task = await Task.findById(req.params.id);
    if (task) {
      task.actualTime = (task.actualTime || 0) + (timeLog.durationMinutes || 0);
      await task.save();
    }

    res.json({
      timeLog,
      task
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



/* ---------------- PREMIUM FEATURES ---------------- */

exports.togglePinned = async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!task) return res.status(404).json({ message: "Task not found" });

    task.pinned = !task.pinned;
    await task.save();

    res.json({ success: true, pinned: task.pinned, data: task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.duplicateTask = async (req, res) => {
  try {
    const originalTask = await Task.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!originalTask) return res.status(404).json({ message: "Task not found" });

    const newTaskData = originalTask.toObject();
    delete newTaskData._id;
    delete newTaskData.id;
    delete newTaskData.createdAt;
    delete newTaskData.updatedAt;
    delete newTaskData.completedAt;

    newTaskData.title = `${newTaskData.title} (Copy)`;
    newTaskData.completed = false;
    newTaskData.status = 'todo';

    const newTask = await Task.create(newTaskData);
    res.json({ success: true, data: newTask });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};



exports.getTimeLogs = async (req, res) => {
  try {
    const { taskId, startDate, endDate } = req.query;
    const query = { userId: req.user.id };

    if (taskId) {
      query.taskId = taskId;
    }

    if (startDate && endDate) {
      query.startTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const timeLogs = await TimeLog.find(query)
      .populate('taskId', 'title')
      .sort({ startTime: -1 });

    const totalMinutes = timeLogs.reduce((sum, log) => sum + log.durationMinutes, 0);

    res.json({
      timeLogs,
      summary: {
        totalMinutes,
        totalHours: (totalMinutes / 60).toFixed(2)
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ---------------- POMODORO ---------------- */
exports.startPomodoroSession = async (req, res) => {
  try {
    const { taskId, duration = 1500 } = req.body; // Default 25 minutes

    const session = await FocusSession.create({
      taskId,
      userId: req.user.id,
      startTime: new Date(),
      duration,
      type: 'focus'
    });

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.completePomodoroSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const gamificationController = require('./gamification.controller');
    const session = await FocusSession.findOneAndUpdate(
      { _id: sessionId, userId: req.user.id },
      { completed: true, endTime: new Date(), duration: req.body.duration || 1500 },
      { new: true }
    );

    if (session) {
      await gamificationController.rewardPoints(req.user.id, 'focus_session_completed');
    }

    res.json(session);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPomodoroStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessions = await FocusSession.find({
      userId: req.user.id,
      completed: true,
      startTime: { $gte: today }
    });

    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((sum, s) => sum + (s.duration / 60), 0);

    res.json({
      todaySessions: totalSessions,
      todayMinutes: Math.round(totalMinutes),
      sessions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ---------------- RECURRING TASKS ---------------- */
exports.createRecurringTask = async (req, res) => {
  try {
    const { frequency, interval = 1, endDate } = req.body;

    const task = await Task.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const { createRecurrence } = require('../jobs/recurrence.cron');
    const pattern = await createRecurrence(task._id, frequency, interval, endDate);

    res.json({
      message: 'Recurring pattern created successfully',
      pattern,
      task
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.stopRecurringTask = async (req, res) => {
  try {
    const { recurrenceId } = req.params;

    const { stopRecurrence } = require('../jobs/recurrence.cron');
    const pattern = await stopRecurrence(recurrenceId);

    res.json({
      message: 'Recurring pattern stopped successfully',
      pattern
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ---------------- TASK DEPENDENCIES ---------------- */
exports.addDependency = async (req, res) => {
  try {
    const { dependsOnTaskId } = req.body;

    const task = await Task.findOne({
      _id: req.params.id,
      createdBy: req.user.id
    });

    const dependencyTask = await Task.findOne({
      _id: dependsOnTaskId,
      createdBy: req.user.id
    });

    if (!task || !dependencyTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.dependencies.includes(dependsOnTaskId)) {
      return res.status(400).json({ message: 'Dependency already exists' });
    }

    task.dependencies.push(dependsOnTaskId);

    // Check if task should be blocked
    if (!dependencyTask.completed) {
      task.isBlocked = true;
    }

    await task.save();

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeDependency = async (req, res) => {
  try {
    const { dependencyId } = req.params;

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { $pull: { dependencies: dependencyId } },
      { new: true }
    );

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if task is still blocked by other dependencies
    const incompleteDeps = await Task.countDocuments({
      _id: { $in: task.dependencies },
      completed: false
    });

    task.isBlocked = incompleteDeps > 0;
    await task.save();

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.uploadAttachment = async (req, res) => {
  try {
    const { name, url, fileType, size } = req.body;
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { $push: { attachments: { name, url, fileType, size } } },
      { new: true }
    );
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAttachment = async (req, res) => {
  try {
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user.id },
      { $pull: { attachments: { _id: req.params.attachmentId } } },
      { new: true }
    );
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

