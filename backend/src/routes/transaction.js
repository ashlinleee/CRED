import express from 'express';
import Transaction from '../models/Transaction.js';
import CreditCard from '../models/CreditCard.js';
import { authenticateToken } from '../middleware/auth.js';
import { cacheMiddleware, clearCache } from '../middleware/cache.js';
import { transactionValidation } from '../middleware/validator.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Get all transactions for a user
router.get('/', authenticateToken, cacheMiddleware(300), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const startDate = req.query.startDate ? new Date(req.query.startDate) : null;
    const endDate = req.query.endDate ? new Date(req.query.endDate) : null;
    const category = req.query.category;
    const type = req.query.type;

    const query = { user: req.user._id };
    
    if (startDate && endDate) {
      query.createdAt = { $gte: startDate, $lte: endDate };
    }
    if (category) {
      query.category = category;
    }
    if (type) {
      query.type = type;
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate('card', 'cardName cardNumber')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Transaction.countDocuments(query)
    ]);

    res.json({
      transactions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    logger.error('Error fetching transactions:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching transactions',
      error: error.message 
    });
  }
});

// Get upcoming payments
router.get('/upcoming', authenticateToken, cacheMiddleware(300), async (req, res) => {
  try {
    const upcomingPayments = await Transaction.find({
      user: req.user._id,
      type: 'PAYMENT',
      status: 'PENDING',
      dueDate: { $gte: new Date() }
    })
    .populate('card', 'cardName cardNumber')
    .sort({ dueDate: 1 });

    res.json({
      success: true,
      payments: upcomingPayments
    });
  } catch (error) {
    logger.error('Error fetching upcoming payments:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error fetching upcoming payments',
      error: error.message 
    });
  }
});

// Make a payment
router.post('/pay', authenticateToken, transactionValidation, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { cardId, amount, description } = req.body;

    // Validate card
    const card = await CreditCard.findOne({ 
      _id: cardId, 
      user: req.user._id 
    }).session(session);

    if (!card) {
      await session.abortTransaction();
      return res.status(404).json({ 
        success: false,
        message: 'Card not found' 
      });
    }

    // Create payment transaction
    const payment = new Transaction({
      user: req.user._id,
      card: cardId,
      amount: -amount, // Negative amount for payments
      type: 'PAYMENT',
      status: 'COMPLETED',
      description,
      category: 'BILL_PAYMENT',
      paymentDate: new Date()
    });

    await payment.save({ session });

    // Update card balance
    card.balance -= amount;
    await card.save({ session });

    await session.commitTransaction();
    await clearCache(`/api/transactions?userId=${req.user._id}`);

    res.status(201).json({
      success: true,
      payment
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error('Error processing payment:', error);
    res.status(400).json({ 
      success: false,
      message: 'Error processing payment',
      error: error.message 
    });
  } finally {
    session.endSession();
  }
});

// Record a purchase
router.post('/purchase', authenticateToken, transactionValidation, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { cardId, amount, merchant, category, description } = req.body;

    // Validate card
    const card = await CreditCard.findOne({ 
      _id: cardId, 
      user: req.user._id 
    }).session(session);

    if (!card) {
      await session.abortTransaction();
      return res.status(404).json({ 
        success: false,
        message: 'Card not found' 
      });
    }

    // Check available credit
    if (card.balance + amount > card.creditLimit) {
      await session.abortTransaction();
      return res.status(400).json({ 
        success: false,
        message: 'Insufficient credit available' 
      });
    }

    // Create purchase transaction
    const purchase = new Transaction({
      user: req.user._id,
      card: cardId,
      amount,
      type: 'PURCHASE',
      status: 'COMPLETED',
      merchant,
      category,
      description,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Due in 30 days
    });

    await purchase.save({ session });

    // Update card balance and rewards
    card.balance += amount;
    card.rewardPoints += purchase.rewardsEarned;
    await card.save({ session });

    await session.commitTransaction();
    await clearCache(`/api/transactions?userId=${req.user._id}`);

    res.status(201).json({
      success: true,
      purchase
    });
  } catch (error) {
    await session.abortTransaction();
    logger.error('Error processing purchase:', error);
    res.status(400).json({ 
      success: false,
      message: 'Error processing purchase',
      error: error.message 
    });
  } finally {
    session.endSession();
  }
});

export default router;
