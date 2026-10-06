const Task = require('../models/Task');

// @desc    Create a new task
// @route   POST /api/tasks
const createTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate } = req.body;

    const task = await Task.create({
      user: req.user._id, // Attached by the auth middleware
      title,
      description,
      status,
      priority,
      dueDate,
    });

    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all tasks for a user (with filtering, search, and pagination)
// @route   GET /api/tasks
const getTasks = async (req, res) => {
  try {
    // 1. Extract query parameters with defaults for pagination
    const { search, status, priority, page = 1, limit = 10 } = req.query;

    // 2. Build the MongoDB filter query
    const query = { user: req.user._id };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    if (status) query.status = status;
    if (priority) query.priority = priority;

    // 3. Calculate math for pagination
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const skipAmount = (pageNumber - 1) * limitNumber;

    // 4. Run database queries in parallel for maximum performance
    const [tasks, totalTasks] = await Promise.all([
      Task.find(query)
        .sort({ createdAt: -1 }) // Newest tasks first
        .skip(skipAmount)
        .limit(limitNumber),
      Task.countDocuments(query) // Get total count matching the filters
    ]);

    // 5. Send structured response
    res.json({
      tasks,
      page: pageNumber,
      totalPages: Math.ceil(totalTasks / limitNumber),
      totalTasks
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
const getTaskById = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Security check: Ensure the task belongs to the user requesting it
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to view this task' });
    }

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Security check: Ensure the task belongs to the user requesting the update
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to update this task' });
    }

    const updatedTask = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true } // Return updated doc & run schema validations
    );

    res.json(updatedTask);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Security check: Ensure the task belongs to the user requesting the deletion
    if (task.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized to delete this task' });
    }

    await task.deleteOne();

    res.json({ message: 'Task removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
};