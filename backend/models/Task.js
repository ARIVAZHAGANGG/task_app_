const mongoose = require("mongoose");

const subtaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false }
}, { _id: true });

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    dueDate: Date,
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },
    status: {
      type: String,
      enum: ["todo", "in_progress", "completed"],
      default: "todo"
    },
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date,
    tags: [{ type: String, trim: true }],
    subtasks: [subtaskSchema],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true
    },
    pinned: {
      type: Boolean,
      default: false
    },
    category: {
      type: String,
      default: "Personal", // Work, Personal, Study, Fitness, etc.
      index: true
    },
    // Smart Features
    estimatedTime: {
      type: Number, // in minutes
      default: 60
    },
    actualTime: {
      type: Number, // in minutes
      default: 0
    },
    recurrenceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RecurrencePattern"
    },
    dependencies: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task"
    }],
    isBlocked: {
      type: Boolean,
      default: false
    },
    // Reminders
    reminderDate: Date,
    reminderEnabled: {
      type: Boolean,
      default: false
    },
    reminderSent: {
      type: Boolean,
      default: false,
    },
    // Advanced Notifications & Recurrence
    recurrence: {
      type: String,
      enum: ["none", "daily", "weekly", "monthly"],
      default: "none",
    },
    recurrenceInterval: {
      type: Number,
      default: 1,
    },
    phoneNumber: String, // For SMS reminders
    smsEnabled: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Indexes for efficient queries
taskSchema.index({ createdBy: 1, completed: 1 });
taskSchema.index({ createdBy: 1, priority: 1 });
taskSchema.index({ createdBy: 1, status: 1 });
// Compound indexes for optimal query performance
taskSchema.index({ createdBy: 1, completed: 1 }); // Filter by user and completion
taskSchema.index({ createdBy: 1, priority: 1, completed: 1 }); // Important tasks filter
taskSchema.index({ createdBy: 1, dueDate: 1 }); // Due date sorting
taskSchema.index({ createdBy: 1, status: 1 }); // Status filtering
taskSchema.index({ createdBy: 1, category: 1 }); // Category filtering
taskSchema.index({ createdBy: 1, createdAt: -1 }); // Default sorting (newest first)
taskSchema.index({ tags: 1 }); // Tag search
taskSchema.index({ assignedTo: 1, completed: 1 }); // Team tasks

// Virtual for subtask progress
taskSchema.virtual('subtaskProgress').get(function () {
  if (!this.subtasks || this.subtasks.length === 0) return 0;
  const completedCount = this.subtasks.filter(st => st.completed).length;
  return Math.round((completedCount / this.subtasks.length) * 100);
});

// Auto-update completedAt when task is marked complete
taskSchema.pre('save', function (next) {
  if (this.isModified('completed')) {
    if (this.completed && !this.completedAt) {
      this.completedAt = new Date();
      this.status = 'completed';
    } else if (!this.completed) {
      this.completedAt = null;
    }
  }
  next();
});

taskSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
  }
});

module.exports = mongoose.model("Task", taskSchema);

