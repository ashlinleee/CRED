import express from 'express';
import User from '../models/User.js';
import CreditCard from '../models/CreditCard.js';
import Transaction from '../models/Transaction.js';
import { authenticateToken } from '../middleware/auth.js';
import logger from '../utils/logger.js';
import bcryptjs from 'bcryptjs';

const router = express.Router();

// Protected routes
router.use(authenticateToken);

// Profile routes
router.get('/profile', async (req, res) => {
  try {
    logger.info('Fetching profile for user:', req.user._id);
    
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      logger.warn('User not found:', req.user._id);
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    logger.info('Profile fetched successfully');
    res.json({ 
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        address: user.address || '',
        preferences: user.preferences || {},
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    logger.error('Profile fetch error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching profile'
    });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    logger.info('Updating profile for user:', req.user._id);

    const user = await User.findById(req.user._id);
    if (!user) {
      logger.warn('User not found:', req.user._id);
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update fields if provided
    if (name) user.name = name;
    if (email) user.email = email;
    if (phone) user.phone = phone;
    if (address) user.address = address;

    await user.save();
    logger.info('Profile updated successfully');

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        address: user.address || '',
        preferences: user.preferences || {},
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    logger.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
});

router.put('/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check current password
    const isMatch = await bcryptjs.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Hash new password
    const salt = await bcryptjs.genSalt(10);
    user.password = await bcryptjs.hash(newPassword, salt);
    await user.save();

    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    logger.error('Password change error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password'
    });
  }
});

router.put('/preferences', async (req, res) => {
  try {
    const { theme, notifications, language } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Initialize preferences if not exist
    if (!user.preferences) {
      user.preferences = {};
    }

    // Update preferences if provided
    if (theme) user.preferences.theme = theme;
    if (notifications !== undefined) user.preferences.notifications = notifications;
    if (language) user.preferences.language = language;

    await user.save();
    res.json({
      success: true,
      preferences: user.preferences
    });
  } catch (error) {
    logger.error('Preferences update error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating preferences'
    });
  }
});

router.get('/stats', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Calculate user statistics
    const stats = {
      totalCards: await CreditCard.countDocuments({ user: user._id }),
      totalTransactions: await Transaction.countDocuments({ user: user._id }),
      totalRewards: await CreditCard.aggregate([
        { $match: { user: user._id } },
        { $group: { _id: null, total: { $sum: '$rewardPoints' } } }
      ]).then(result => (result[0]?.total || 0)),
      memberSince: user.createdAt
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Stats fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user stats'
    });
  }
});

export default router;
