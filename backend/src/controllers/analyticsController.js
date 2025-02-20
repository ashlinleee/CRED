import Transaction from '../models/Transaction.js';
import CreditCard from '../models/CreditCard.js';
import logger from '../utils/logger.js';

// Get spending insights
export const getSpendingInsights = async (userId, period = 'month') => {
  const today = new Date();
  let startDate;

  switch (period) {
    case 'week':
      startDate = new Date(today.setDate(today.getDate() - 7));
      break;
    case 'month':
      startDate = new Date(today.setMonth(today.getMonth() - 1));
      break;
    case 'year':
      startDate = new Date(today.setFullYear(today.getFullYear() - 1));
      break;
    default:
      startDate = new Date(today.setMonth(today.getMonth() - 1));
  }

  const transactions = await Transaction.find({
    user: userId,
    date: { $gte: startDate },
    type: 'PURCHASE',
    status: 'COMPLETED'
  });

  return transactions;
};

// Get credit utilization
export const getCreditUtilization = async (userId) => {
  const cards = await CreditCard.find({ user: userId });
  
  let totalLimit = 0;
  let totalUsed = 0;

  cards.forEach(card => {
    totalLimit += card.creditLimit;
    totalUsed += (card.creditLimit - card.availableLimit);
  });

  const utilization = totalLimit > 0 ? ((totalUsed / totalLimit) * 100).toFixed(2) : 0;

  return {
    totalLimit,
    totalUsed,
    utilization,
    cardCount: cards.length,
    status: utilization > 80 ? 'HIGH' : utilization > 30 ? 'MODERATE' : 'GOOD'
  };
};

// Get reward points analysis
export const getRewardPointsAnalysis = async (userId) => {
  const transactions = await Transaction.find({
    user: userId,
    'rewardPoints.earned': { $gt: 0 }
  }).sort('-date').limit(100);

  const pointsByCategory = {};
  let totalPoints = 0;

  transactions.forEach(transaction => {
    const category = transaction.category;
    if (!pointsByCategory[category]) {
      pointsByCategory[category] = 0;
    }
    pointsByCategory[category] += transaction.rewardPoints.earned;
    totalPoints += transaction.rewardPoints.earned;
  });

  return {
    totalPoints,
    pointsByCategory,
    recentTransactions: transactions.slice(0, 5).map(t => ({
      date: t.date,
      merchant: t.merchant.name,
      points: t.rewardPoints.earned,
      multiplier: t.rewardPoints.multiplier
    }))
  };
};

// Get bill payment reminders
export const getBillReminders = async (userId) => {
  const today = new Date();
  const nextMonth = new Date(today.setMonth(today.getMonth() + 1));
  
  const cards = await CreditCard.find({
    user: userId,
    status: 'ACTIVE'
  });

  return cards.map(card => {
    const dueDate = new Date(card.billing.nextDueDate);
    const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
    
    return {
      cardId: card._id,
      cardNumber: card.cardNumber.slice(-4),
      bank: card.bank,
      dueDate: card.billing.nextDueDate,
      minimumDue: card.billing.minimumDue,
      totalDue: card.billing.totalDue,
      daysUntilDue,
      status: daysUntilDue <= 3 ? 'URGENT' : daysUntilDue <= 7 ? 'UPCOMING' : 'NORMAL'
    };
  });
};

export const getSpendingAnalytics = async (userId, timeframe = '6m') => {
  try {
    logger.info('Fetching spending analytics', { userId, timeframe });

    // For testing, return sample data
    return {
      spending: {
        total: 150000,
        average: 25000,
        trend: 15,
        monthly: [
          { month: 'Jul', amount: 20000 },
          { month: 'Aug', amount: 22000 },
          { month: 'Sep', amount: 25000 },
          { month: 'Oct', amount: 23000 },
          { month: 'Nov', amount: 28000 },
          { month: 'Dec', amount: 32000 }
        ],
        categories: [
          { category: 'Shopping', percentage: 35 },
          { category: 'Dining', percentage: 25 },
          { category: 'Travel', percentage: 20 },
          { category: 'Bills', percentage: 15 },
          { category: 'Entertainment', percentage: 5 }
        ]
      },
      rewards: {
        total: 1500,
        multiplier: 1
      },
      creditScore: {
        current: 750,
        change: 5
      },
      cards: {
        active: 3,
        total: 3,
        usage: [
          { name: 'HDFC Diners Club', spent: 80000, percentage: 53 },
          { name: 'ICICI Amazon Pay', spent: 45000, percentage: 30 },
          { name: 'Axis Flipkart', spent: 25000, percentage: 17 }
        ]
      }
    };
  } catch (error) {
    logger.error('Error in getSpendingAnalytics:', error);
    throw error;
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const timeframe = req.query.timeframe || '6m';
    const analytics = await getSpendingAnalytics(req.user._id, timeframe);
    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    logger.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics data'
    });
  }
};
