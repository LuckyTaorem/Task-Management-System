const express = require('express');
const router = express.Router();
const {
  getTasks,
  createTask,
  getTaskById,
  updateTask,
  deleteTask,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

// --- Custom Anti-Spam Middleware ---
const requestTimes = new Map();

const spamBlocker = (req, res, next) => {
  const userId = req.user._id.toString();
  const now = Date.now();
  const lastRequest = requestTimes.get(userId) || 0;

  // Enforce a strict 500-millisecond cooldown between write operations
  if (now - lastRequest < 500) {
    return res.status(429).json({ message: 'Whoa, slow down! You are clicking too fast.' });
  }

  requestTimes.set(userId, now);
  next();
};

// --- Routes ---
// GET requests don't need spam blocking because they are cached on the frontend
router.route('/')
  .get(protect, getTasks)
  .post(protect, spamBlocker, createTask);

router.route('/:id')
  .get(protect, getTaskById)
  .put(protect, spamBlocker, updateTask)
  .delete(protect, spamBlocker, deleteTask);

module.exports = router;