import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Register user
export const register = async (req, res) => {
  try {
    console.log('Register request body:', req.body);
    const { name, email, phone, password } = req.body;

    // Validate input
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        message: 'Please provide all required fields'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists with this email'
      });
    }

    // Create user
    const user = new User({
      name,
      email,
      phone,
      password,
      isVerified: false,
      creditScore: {
        score: 0
      },
      rewardPoints: {
        total: 0,
        history: []
      }
    });

    await user.save();
    console.log('User saved successfully:', user);

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      message: error.message || 'Error registering user'
    });
  }
};

// Login user
export const login = async (req, res) => {
  try {
    console.log('Login request body:', req.body);
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        message: 'Please provide email and password'
      });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        message: 'Invalid credentials'
      });
    }

    // Check password
    const validPassword = await user.comparePassword(password);
    if (!validPassword) {
      return res.status(400).json({
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      message: error.message || 'Error logging in'
    });
  }
};

// Get user profile
export const getProfile = async (req, res) => {
  try {
    console.log('Getting profile for user:', req.user._id);
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('cards');
      
    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      message: error.message || 'Error fetching profile'
    });
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    console.log('Update profile request:', req.body);
    const { name, email, phone, address } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    await user.save();
    
    const updatedUser = await User.findById(user._id)
      .select('-password')
      .populate('cards');

    res.json(updatedUser);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(400).json({
      message: error.message || 'Error updating profile'
    });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    console.log('Change password request for user:', req.user._id);
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        message: 'User not found'
      });
    }

    // Verify current password
    const validPassword = await user.comparePassword(currentPassword);
    if (!validPassword) {
      return res.status(400).json({
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(400).json({
      message: error.message || 'Error changing password'
    });
  }
};
