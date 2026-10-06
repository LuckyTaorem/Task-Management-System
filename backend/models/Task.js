const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User', // Creates a relationship with the User model
    },
    title: { 
      type: String, 
      required: true 
    },
    description: { 
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed'],
      default: 'Pending',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    dueDate: { 
      type: Date,
      required: true
    },
  },
  { timestamps: true } // Fulfills the "Created Date" requirement natively
);

module.exports = mongoose.model('Task', taskSchema);