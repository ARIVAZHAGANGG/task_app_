const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task"
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    answer: String,
    status: {
      type: String,
      default: "submitted"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Submission", submissionSchema);
