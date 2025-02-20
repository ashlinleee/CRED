import User from '../models/User.js';
import CreditCard from '../models/CreditCard.js';
import Transaction from '../models/Transaction.js';

// Helper function to handle errors
const handleError = (res, error) => {
  console.error(error);
  res.status(500).json({
    success: false,
    message: error.message || 'Error occurred'
  });
};

// Get user profile with related data
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate('cards')
      .populate({
        path: 'transactions',
        options: { sort: { date: -1 }, limit: 10 }
      })
      .select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const profile = {
      id: user._id,
      name: user.name || '',
      email: user.email || '',
      phone: user.phone,
      isVerified: user.isVerified,
      cards: user.cards || [],
      recentTransactions: user.transactions || [],
      rewardPoints: {
        total: user.rewardPoints?.total || 0,
        history: user.rewardPoints?.history || [],
        byCategory: user.rewardPoints?.byCategory || new Map()
      },
      creditScore: {
        score: user.creditScore?.score || 0,
        history: user.creditScore?.history || []
      },
      preferences: user.preferences || {
        notifications: {
          email: true,
          sms: true,
          push: true
        },
        theme: 'SYSTEM'
      }
    };

    res.json({
      success: true,
      user: profile
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Update user profile
export const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, email },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      user
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Get user's credit cards
export const getCreditCards = async (req, res) => {
  try {
    const user = await User.findOne({ name: req.user.name })
      .populate('cards');

    res.json({
      success: true,
      cards: user.cards || []
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Get card statistics
export const getCardStats = async (req, res) => {
  try {
    const user = await User.findOne({ name: req.user.name })
      .populate('cards');

    // Calculate total credit limit
    const totalCreditLimit = user.cards.reduce((total, card) => total + card.creditLimit, 0);
    
    // Calculate total balance
    const totalBalance = user.cards.reduce((total, card) => total + card.currentBalance, 0);
    
    // Calculate credit utilization
    const creditUtilization = totalCreditLimit > 0 
      ? (totalBalance / totalCreditLimit) * 100 
      : 0;

    // Calculate rewards earned
    const totalRewards = user.cards.reduce((total, card) => total + (card.rewardPoints || 0), 0);

    res.json({
      success: true,
      stats: {
        totalCards: user.cards.length,
        totalCreditLimit,
        totalBalance,
        availableCredit: totalCreditLimit - totalBalance,
        creditUtilization,
        totalRewards
      }
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Add a new credit card
export const addCreditCard = async (req, res) => {
  try {
    const { cardNumber, cardName, expiryDate, cvv, creditLimit } = req.body;

    // Create new card
    const card = await CreditCard.create({
      cardNumber,
      cardName,
      expiryDate,
      cvv,
      creditLimit,
      currentBalance: 0,
      availableLimit: creditLimit,
      rewardPoints: 0
    });

    // Add card to user's cards array
    await User.findOneAndUpdate(
      { name: req.user.name },
      { $push: { cards: card._id } }
    );

    res.status(201).json({
      success: true,
      message: 'Credit card added successfully',
      card
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Remove a credit card
export const removeCreditCard = async (req, res) => {
  try {
    const { cardId } = req.params;

    // Remove card from user's cards array
    await User.findOneAndUpdate(
      { name: req.user.name },
      { $pull: { cards: cardId } }
    );

    // Delete the card document
    await CreditCard.findByIdAndDelete(cardId);

    res.json({
      success: true,
      message: 'Credit card removed successfully'
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Get user's transactions
export const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 10, type, category } = req.query;
    const query = { user: req.user._id };

    if (type) query.type = type;
    if (category) query.category = category;

    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('creditCard', 'cardNumber bank cardType');

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Add new transaction
export const addTransaction = async (req, res) => {
  try {
    const { creditCardId, amount, type, category, merchant, description } = req.body;

    // Validate credit card
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
    const transaction = await Transaction.create({
      user: req.user._id,
      creditCard: creditCardId,
      amount,
      type,
      category,
      merchant,
      description
    });

    // Update credit card available limit if it's a purchase
    if (type === 'PURCHASE') {
      creditCard.availableLimit -= amount;
      await creditCard.save();
    }

    res.json({
      success: true,
      transaction
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Get financial analysis
export const getFinancialAnalysis = async (req, res) => {
  try {
    const user = await User.findOne({ name: req.user.name })
      .populate('cards')
      .populate('transactions');

    // Calculate total credit limit
    const totalCreditLimit = user.cards.reduce((total, card) => total + card.creditLimit, 0);
    
    // Calculate total balance
    const totalBalance = user.cards.reduce((total, card) => total + card.currentBalance, 0);
    
    // Calculate credit utilization
    const creditUtilization = totalCreditLimit > 0 
      ? (totalBalance / totalCreditLimit) * 100 
      : 0;

    // Get recent transactions
    const recentTransactions = user.transactions
      .sort((a, b) => b.date - a.date)
      .slice(0, 5);

    res.json({
      success: true,
      analysis: {
        totalCreditLimit,
        totalBalance,
        creditUtilization,
        creditScore: user.creditScore.score,
        rewardPoints: user.rewardPoints.total,
        recentTransactions
      }
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Get user settings
export const getSettings = async (req, res) => {
  try {
    const user = await User.findOne({ name: req.user.name });
    res.json({
      success: true,
      settings: user.settings || {}
    });
  } catch (error) {
    handleError(res, error);
  }
};

// Update user settings
export const updateSettings = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { name: req.user.name },
      { $set: { settings: req.body } },
      { new: true }
    );
    res.json({
      success: true,
      settings: user.settings
    });
  } catch (error) {
    handleError(res, error);
  }
};
