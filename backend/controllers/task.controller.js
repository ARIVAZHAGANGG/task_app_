const Task = require("../models/Task");
const Submission = require("../models/Submission");

exports.createTask = async (req, res) => {
  const task = await Task.create({
    ...req.body,
    createdBy: req.user.id
  });
  res.json(task);
};

exports.getTasks = async (req, res) => {
  const tasks = await Task.find().sort({ createdAt: -1 });
  res.json(tasks);
};

exports.submitTask = async (req, res) => {
  const submission = await Submission.create({
    taskId: req.body.taskId,
    submittedBy: req.user.id,
    answer: req.body.answer
  });
  res.json(submission);
};
