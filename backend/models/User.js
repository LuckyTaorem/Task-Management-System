const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    // Add these new extended profile fields
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
    portfolio: { type: String, default: '' },
    github: { type: String, default: '' },
    avatar: { type: String, default: '' }, // Add this line
  },
  { timestamps: true }
);

// Mongoose middleware to hash the password before saving a user
userSchema.pre('save', async function () {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return; // Simply return instead of returning next()
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  // No need to call next() at the end, Mongoose handles the async completion automatically
});

// Custom method to compare entered password with the hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);