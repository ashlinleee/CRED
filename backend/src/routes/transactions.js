import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import Transaction from '../models/Transaction.js';
import CreditCard from '../models/CreditCard.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Protected routes
router.use(authenticateToken);

// Get all transactions for the user
router.get('/', async (req, res) => {
  try {
    logger.info('Fetching transactions for user:', req.user._id);
    
    const transactions = await Transaction.find({ user: req.user._id })
      .populate('creditCard', 'bank cardNumber cardholderName')
      .sort({ date: -1 })
      .lean();

    // Format transactions for frontend
    const formattedTransactions = transactions.map(transaction => ({
      id: transaction._id,
      amount: transaction.amount,
      type: transaction.type,
      description: transaction.description,
      category: transaction.category,
      status: transaction.status,
      date: transaction.date,
      bank: transaction.creditCard?.bank || 'Unknown Bank',
      cardNumber: transaction.creditCard?.cardNumber || '****',
      cardholderName: transaction.creditCard?.cardholderName || 'Unknown'
    }));

    logger.info(`Found ${formattedTransactions.length} transactions`);
    
    res.json({
      success: true,
      transactions: formattedTransactions
    });
  } catch (error) {
    logger.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transactions',
      error: error.message
    });
  }
});

// Create a new transaction
router.post('/', async (req, res) => {
  try {
    const { creditCardId, amount, type, description, category } = req.body;

    // Validate input
    if (!creditCardId || !amount || !type || !description) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Find the credit card
    const creditCard = await CreditCard.findOne({
      _id: creditCardId,
      user: req.user._id
    });

    if (!creditCard) {
      return res.status(404).json({
        success: false,
        message: 'Credit card not found'
      });
    }

    // Create transaction
    const transaction = new Transaction({
      user: req.user._id,
      creditCard: creditCardId,
      amount,
      type,
      description,
      category: category || 'other',
      status: 'completed',
      date: new Date()
    });

    await transaction.save();

    // Populate credit card details
    await transaction.populate('creditCard', 'bank cardNumber cardholderName');

    res.status(201).json({
      success: true,
      transaction: {
        id: transaction._id,
        amount: transaction.amount,
        type: transaction.type,
        description: transaction.description,
        category: transaction.category,
        status: transaction.status,
        date: transaction.date,
        bank: transaction.creditCard?.bank || 'Unknown Bank',
        cardNumber: transaction.creditCard?.cardNumber || '****',
        cardholderName: transaction.creditCard?.cardholderName || 'Unknown'
      }
    });
  } catch (error) {
    logger.error('Create transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create transaction',
      error: error.message
    });
  }
});

// Get transaction by ID
router.get('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      user: req.user._id
    }).populate('creditCard', 'bank cardNumber cardholderName');

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    res.json({
      success: true,
      transaction: {
        id: transaction._id,
        amount: transaction.amount,
        type: transaction.type,
        description: transaction.description,
        category: transaction.category,
        status: transaction.status,
        date: transaction.date,
        bank: transaction.creditCard?.bank || 'Unknown Bank',
        cardNumber: transaction.creditCard?.cardNumber || '****',
        cardholderName: transaction.creditCard?.cardholderName || 'Unknown'
      }
    });
  } catch (error) {
    logger.error('Get transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transaction',
      error: error.message
    });
  }
});

// Get transaction statistics
router.get('/stats', async (req, res) => {
  try {
    const transactions = await Transaction.find({
      user: req.user._id,
      status: 'completed'
    });

    const stats = {
      totalSpent: 0,
      totalPayments: 0,
      recentTransactions: [],
      spendingByCategory: {}
    };

    transactions.forEach(transaction => {
      if (transaction.type === 'purchase') {
        stats.totalSpent += transaction.amount;
        stats.spendingByCategory[transaction.category] = 
          (stats.spendingByCategory[transaction.category] || 0) + transaction.amount;
      } else if (transaction.type === 'payment') {
        stats.totalPayments += transaction.amount;
      }
    });

    // Get recent transactions
    stats.recentTransactions = await Transaction.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('creditCard', 'bank cardNumber cardholderName')
      .lean();

    // Format recent transactions
    stats.recentTransactions = stats.recentTransactions.map(transaction => ({
      id: transaction._id,
      amount: transaction.amount,
      type: transaction.type,
      description: transaction.description,
      category: transaction.category,
      status: transaction.status,
      date: transaction.date,
      bank: transaction.creditCard?.bank || 'Unknown Bank',
      cardNumber: transaction.creditCard?.cardNumber || '****',
      cardholderName: transaction.creditCard?.cardholderName || 'Unknown'
    }));

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('Get transaction stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get transaction statistics',
      error: error.message
    });
  }
});

export default router;
