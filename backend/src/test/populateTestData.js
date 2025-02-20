import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import CreditCard from '../models/CreditCard.js';
import Transaction from '../models/Transaction.js';
import { sampleTransactions, sampleCreditCards } from './testData.js';

dotenv.config();

const populateTestData = async (userId) => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cred');
    console.log('Connected to MongoDB');

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found');
      process.exit(1);
    }

    // Initialize reward points if not exists
    if (!user.rewardPoints) {
      user.rewardPoints = {
        total: 0,
        history: []
      };
    }

    // Add credit cards
    const creditCardPromises = sampleCreditCards.map(async (cardData) => {
      const card = new CreditCard({
        user: user._id,
        ...cardData
      });
      await card.save();
      return card;
    });

    const cards = await Promise.all(creditCardPromises);
    user.creditCards = cards.map(card => card._id);
    await user.save();

    // Add transactions with reward points
    const transactionPromises = sampleTransactions.map(async (txnData, index) => {
      // Calculate reward points based on amount and category
      const basePoints = Math.floor(txnData.amount / 100); // 1 point per 100 spent
      const categoryMultipliers = {
        'DINING': 2,
        'TRAVEL': 3,
        'SHOPPING': 1.5,
        'ENTERTAINMENT': 2,
        'GROCERIES': 1.5,
        'FUEL': 2,
        'UTILITIES': 1,
        'OTHER': 1
      };
      const cardTierMultipliers = {
        'BASIC': 1,
        'GOLD': 1.5,
        'PLATINUM': 2,
        'SIGNATURE': 2.5
      };

      const card = cards[index % cards.length];
      const categoryMultiplier = categoryMultipliers[txnData.category] || 1;
      const tierMultiplier = cardTierMultipliers[card.cardTier] || 1;
      const earnedPoints = Math.floor(basePoints * categoryMultiplier * tierMultiplier);

      // Create transaction with reward points
      const transaction = new Transaction({
        user: user._id,
        creditCard: card._id,
        ...txnData,
        status: 'COMPLETED',
        rewardPoints: {
          earned: earnedPoints,
          multiplier: categoryMultiplier * tierMultiplier,
          category: 'REGULAR',
          description: `Points earned on ${txnData.category.toLowerCase()} transaction`
        }
      });
      await transaction.save();

      // Add points to user's total and history
      user.rewardPoints.total += earnedPoints;
      user.rewardPoints.history.push({
        date: txnData.date,
        points: earnedPoints,
        type: 'EARNED',
        source: 'TRANSACTION',
        description: `Earned ${earnedPoints} points on ${txnData.merchant.name} transaction`,
        metadata: {
          transactionId: transaction._id,
          category: txnData.category,
          merchant: txnData.merchant.name
        }
      });

      return transaction;
    });

    await Promise.all(transactionPromises);
    await user.save();

    console.log('Test data populated successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error populating test data:', error);
    process.exit(1);
  }
};

// Get userId from command line argument
const userId = process.argv[2];
if (!userId) {
  console.error('Please provide a user ID');
  process.exit(1);
}

populateTestData(userId);
