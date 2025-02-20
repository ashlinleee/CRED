import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import logger from '../utils/logger.js';

// Get user's reward points and redemption options
export const getPoints = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('rewardPoints');
    
    // Get all completed purchase transactions to calculate points
    const transactions = await Transaction.find({
      user: req.user._id,
      type: 'debit',
      status: 'completed'
    }).sort({ date: -1 }); // Sort by date descending for latest first

    // Calculate total points (1 point per ₹100 spent)
    const totalPoints = transactions.reduce((sum, transaction) => {
      return sum + Math.floor(transaction.amount / 100);
    }, 0);

    // Calculate points by category and month
    const pointsByCategory = {};
    const monthlyPoints = {};
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date.toISOString().slice(0, 7); // YYYY-MM format
    }).reverse();

    transactions.forEach(transaction => {
      // Points by category
      const category = transaction.category || 'Others';
      const points = Math.floor(transaction.amount / 100);
      pointsByCategory[category] = (pointsByCategory[category] || 0) + points;

      // Points by month
      const month = transaction.createdAt.toISOString().slice(0, 7);
      monthlyPoints[month] = (monthlyPoints[month] || 0) + points;
    });

    // Format monthly data for the graph
    const graphData = last6Months.map(month => ({
      month: new Date(month + '-01').toLocaleString('default', { month: 'short' }),
      points: monthlyPoints[month] || 0
    }));

    // Format category data for the pie chart
    const categoryData = Object.entries(pointsByCategory).map(([category, points]) => ({
      category,
      points,
      percentage: Math.round((points / totalPoints) * 100)
    }));

    // Available redemption options
    const redemptionOptions = [
      {
        id: 'cashback',
        name: 'Cashback',
        pointsRequired: 1000,
        value: '₹100'
      },
      {
        id: 'voucher',
        name: 'Shopping Voucher',
        pointsRequired: 2000,
        value: '₹250'
      },
      {
        id: 'travel',
        name: 'Travel Miles',
        pointsRequired: 5000,
        value: '1000 Miles'
      }
    ];

    res.json({
      success: true,
      points: {
        current: user.rewardPoints || 0,
        earned: totalPoints,
        redeemed: totalPoints - (user.rewardPoints || 0)
      },
      redemptionOptions,
      graphData,
      categoryData
    });
  } catch (error) {
    logger.error('Get points error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reward points'
    });
  }
};

// Redeem points
export const redeemPoints = async (req, res) => {
  try {
    const { optionId, points } = req.body;

    if (!optionId || !points) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if ((user.rewardPoints || 0) < points) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient points'
      });
    }

    // Deduct points
    user.rewardPoints = (user.rewardPoints || 0) - points;
    await user.save();

    res.json({
      success: true,
      message: 'Points redeemed successfully',
      remainingPoints: user.rewardPoints
    });
  } catch (error) {
    logger.error('Redeem points error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to redeem points'
    });
  }
};
