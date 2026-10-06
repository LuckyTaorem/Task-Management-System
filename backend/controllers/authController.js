const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Helper function to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user (Password is hashed automatically by the pre-save hook in User model)
    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    // Check user existence and match password
    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged-in user profile
// @route   GET /api/auth/profile
const getUserProfile = async (req, res) => {
  try {
    // req.user is set by the protect middleware
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        location: user.location || '',
        portfolio: user.portfolio || '',
        github: user.github || '',
        avatar: user.avatar || '',
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      // Security Check: Prevent email modification
      if (req.body.email && req.body.email !== user.email) {
        return res.status(400).json({ message: 'Email address cannot be changed.' });
      }

      // Update fields if they are provided in the request body
      user.name = req.body.name || user.name;
      user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
      user.location = req.body.location !== undefined ? req.body.location : user.location;
      user.portfolio = req.body.portfolio !== undefined ? req.body.portfolio : user.portfolio;
      user.github = req.body.github !== undefined ? req.body.github : user.github;
      user.avatar = req.body.avatar !== undefined ? req.body.avatar : user.avatar; // Add this line

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        location: updatedUser.location,
        portfolio: updatedUser.portfolio,
        github: updatedUser.github,
        avatar: updatedUser.avatar,
        token: generateToken(updatedUser._id), // Send fresh token
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user password
// @route   PUT /api/auth/password
const updateUserPassword = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      // Verify current password matches before allowing a change
      const isMatch = await user.matchPassword(req.body.currentPassword);
      
      if (!isMatch) {
        return res.status(401).json({ message: 'Incorrect current password' });
      }

      // Update password (the pre-save hook in User.js will automatically hash it)
      user.password = req.body.newPassword;
      await user.save();

      res.json({ message: 'Password updated successfully' });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  updateUserPassword,
};