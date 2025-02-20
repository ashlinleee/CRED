import mongoose from 'mongoose';
import CreditCard from '../models/CreditCard.js';
import Transaction from '../models/Transaction.js';
import Reward from '../models/Reward.js';
import Support from '../models/Support.js';
import Payment from '../models/Payment.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import bcrypt from 'bcrypt';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from the backend root directory
const envPath = join(__dirname, '../../.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.error('.env file not found at:', envPath);
  process.exit(1);
}

const userId = "67687dd5f42ecb95fa19ccb5";

const generateCreditCards = () => {
  const creditCards = [
    {
      user: userId,
      cardName: "HDFC Diners Club Black",
      cardNumber: "4532111122223333",
      expiryDate: "12/25",
      cvv: "123",
      creditLimit: 500000,
      availableCredit: 350000,
      rewards: 15000,
      isActive: true,
      bank: "HDFC",
      cardType: "DINERS",
      cardNetwork: "DINERS",
      cardColor: "#1a1a1a",
      lastFourDigits: "3333",
      expiryMonth: "12",
      expiryYear: "25",
      cardholderName: "John Doe"
    },
    {
      user: userId,
      cardName: "ICICI Amazon Pay Card",
      cardNumber: "5241444455556666",
      expiryDate: "06/26",
      cvv: "456",
      creditLimit: 200000,
      availableCredit: 180000,
      rewards: 8000,
      isActive: true,
      bank: "ICICI",
      cardType: "VISA",
      cardNetwork: "VISA",
      cardColor: "#2b5797",
      lastFourDigits: "6666",
      expiryMonth: "06",
      expiryYear: "26",
      cardholderName: "John Doe"
    },
    {
      user: userId,
      cardName: "Axis Bank ACE Credit Card",
      cardNumber: "3782888899990000",
      expiryDate: "09/25",
      cvv: "789",
      creditLimit: 300000,
      availableCredit: 250000,
      rewards: 12000,
      isActive: true,
      bank: "AXIS",
      cardType: "VISA",
      cardNetwork: "VISA",
      cardColor: "#8e44ad",
      lastFourDigits: "0000",
      expiryMonth: "09",
      expiryYear: "25",
      cardholderName: "John Doe"
    }
  ];

  return creditCards;
};

const generateTransactions = (card) => {
  const categories = ['shopping', 'dining', 'travel', 'bills', 'entertainment', 'others'];
  const merchants = {
    shopping: ['Amazon', 'Flipkart', 'Myntra', 'Ajio', 'Nykaa'],
    dining: ['Zomato', 'Swiggy', 'EatFit', 'Dominos', 'Pizza Hut'],
    travel: ['MakeMyTrip', 'IRCTC', 'Uber', 'Ola', 'RedBus'],
    bills: ['Tata Power', 'Airtel', 'Jio', 'Mahanagar Gas', 'BEST'],
    entertainment: ['Netflix', 'Amazon Prime', 'Hotstar', 'BookMyShow', 'PVR'],
    others: ['PhonePe', 'Google Pay', 'Paytm', 'FreeCharge', 'MobiKwik']
  };

  const transactions = [];
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());

  // Generate 50-100 transactions per card
  const numTransactions = Math.floor(Math.random() * 51) + 50;

  for (let i = 0; i < numTransactions; i++) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const merchant = merchants[category][Math.floor(Math.random() * merchants[category].length)];
    const amount = Math.floor(Math.random() * 10000) + 500; // Random amount between 500 and 10500
    const date = new Date(sixMonthsAgo.getTime() + Math.random() * (now.getTime() - sixMonthsAgo.getTime()));

    transactions.push({
      user: userId,
      creditCard: card._id,
      amount: amount,
      category: category,
      merchant: merchant,
      description: `Payment to ${merchant}`,
      date: date,
      status: 'completed',
      type: Math.random() > 0.2 ? 'debit' : 'credit', // 80% debit, 20% credit
      rewardsEarned: Math.floor(amount * 0.01), // 1% rewards on spending
      paymentMethod: 'ONLINE',
      location: 'Mumbai, India',
      currency: 'INR'
    });
  }

  return transactions;
};

const generatePayments = (cardId) => {
  const payments = [];
  const numberOfPayments = Math.floor(Math.random() * 3) + 2; // 2-4 payments per card
  const paymentMethods = ['upi', 'netbanking', 'debit_card', 'auto_debit'];

  // Past payments
  for (let i = 0; i < numberOfPayments; i++) {
    const amount = Math.floor(Math.random() * 50000) + 10000; // Payments between 10000-60000
    const daysAgo = Math.floor(Math.random() * 90); // Payments within last 90 days
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);

    payments.push({
      user: userId,
      creditCard: cardId,
      amount: amount,
      type: 'credit_card_bill',
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      status: 'completed',
      description: 'Credit Card Bill Payment',
      transactionId: `PAY${Date.now()}${Math.floor(Math.random() * 1000)}`,
      date: date,
      dueDate: date // For completed payments, dueDate is same as date
    });
  }

  // Upcoming payments (1-2 per card)
  const numberOfUpcomingPayments = Math.floor(Math.random() * 2) + 1;
  for (let i = 0; i < numberOfUpcomingPayments; i++) {
    const amount = Math.floor(Math.random() * 50000) + 10000;
    const daysAhead = Math.floor(Math.random() * 30) + 1; // Due within next 30 days
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + daysAhead);

    payments.push({
      user: userId,
      creditCard: cardId,
      amount: amount,
      type: 'credit_card_bill',
      paymentMethod: 'upi',
      status: 'pending',
      description: 'Upcoming Credit Card Bill',
      date: new Date(),
      dueDate: dueDate
    });
  }

  return payments;
};

const generateUpcomingPayments = async (userId, cards) => {
  const payments = [];
  const now = new Date();

  for (const card of cards) {
    // Generate 2-4 upcoming payments per card
    const numPayments = Math.floor(Math.random() * 3) + 2;

    for (let i = 0; i < numPayments; i++) {
      const dueDate = new Date(now.getTime() + (i + 1) * 7 * 24 * 60 * 60 * 1000); // Due in next few weeks
      const amount = Math.floor(Math.random() * 20000) + 5000;

      payments.push({
        user: userId,
        creditCard: card._id,
        amount: amount,
        dueDate: dueDate,
        status: 'pending',
        type: Math.random() > 0.3 ? 'credit_card_bill' : 'emi',
        description: `${card.bank} Credit Card Payment`,
        paymentMethod: 'auto_debit',
        date: new Date(),
        billCycle: {
          startDate: new Date(dueDate.getTime() - 30 * 24 * 60 * 60 * 1000),
          endDate: dueDate
        }
      });
    }
  }

  return payments;
};

const generateRewards = () => {
  const rewards = [
    {
      title: "50% Off on Dining",
      description: "Get 50% off up to ₹200 at selected restaurants",
      category: "DINING",
      merchant: {
        name: "Zomato",
        category: "Food Delivery",
        logo: "https://b.zmtcdn.com/images/logo/zomato_logo_2017.png",
        website: "https://www.zomato.com",
        contactEmail: "support@zomato.com",
        supportPhone: "1800-123-4567"
      },
      pointsRequired: 2000,
      value: {
        amount: 50,
        type: "PERCENTAGE",
        maxDiscount: 200
      },
      validityPeriod: {
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 3))
      },
      termsAndConditions: [
        "Valid only on dine-in orders",
        "Not valid on weekends and holidays",
        "Cannot be clubbed with other offers"
      ],
      availability: {
        totalQuantity: 1000,
        remainingQuantity: 850,
        perUserLimit: 2
      },
      user: userId,
      status: "ACTIVE"
    },
    {
      title: "Flat ₹500 Off on Flights",
      description: "Book domestic flights and get flat ₹500 off",
      category: "TRAVEL",
      merchant: {
        name: "MakeMyTrip",
        category: "Travel",
        logo: "https://imgak.mmtcdn.com/pwa_v3/pwa_hotel_assets/header/logo@2x.png",
        website: "https://www.makemytrip.com",
        contactEmail: "support@makemytrip.com",
        supportPhone: "1800-123-5555"
      },
      pointsRequired: 5000,
      value: {
        amount: 500,
        type: "FLAT",
        maxDiscount: 500
      },
      validityPeriod: {
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 2))
      },
      termsAndConditions: [
        "Valid on domestic flights only",
        "Minimum booking amount ₹3000",
        "One voucher per transaction"
      ],
      availability: {
        totalQuantity: 500,
        remainingQuantity: 450,
        perUserLimit: 1
      },
      user: userId,
      status: "ACTIVE"
    },
    {
      title: "15% Cashback on Shopping",
      description: "Get 15% cashback on all purchases at Amazon",
      category: "SHOPPING",
      merchant: {
        name: "Amazon",
        category: "E-commerce",
        logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/1200px-Amazon_logo.svg.png",
        website: "https://www.amazon.in",
        contactEmail: "support@amazon.in",
        supportPhone: "1800-123-4444"
      },
      pointsRequired: 3000,
      value: {
        amount: 15,
        type: "CASHBACK",
        maxDiscount: 1000
      },
      validityPeriod: {
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
      },
      termsAndConditions: [
        "Valid on all products",
        "Maximum cashback ₹1000",
        "Cashback will be credited within 7 days"
      ],
      availability: {
        totalQuantity: 2000,
        remainingQuantity: 1800,
        perUserLimit: 3
      },
      user: userId,
      status: "ACTIVE"
    },
    {
      title: "Buy 1 Get 1 on Movie Tickets",
      description: "Get a free movie ticket on booking one",
      category: "ENTERTAINMENT",
      merchant: {
        name: "BookMyShow",
        category: "Entertainment",
        logo: "https://in.bmscdn.com/webin/common/icons/logo.svg",
        website: "https://www.bookmyshow.com",
        contactEmail: "support@bookmyshow.com",
        supportPhone: "1800-123-3333"
      },
      pointsRequired: 4000,
      value: {
        amount: 100,
        type: "PERCENTAGE",
        maxDiscount: null
      },
      validityPeriod: {
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 2))
      },
      termsAndConditions: [
        "Valid on all movies",
        "Not valid on premium seats",
        "Valid only on weekdays"
      ],
      availability: {
        totalQuantity: 1000,
        remainingQuantity: 900,
        perUserLimit: 2
      },
      user: userId,
      status: "ACTIVE"
    },
    {
      title: "20% Off on Utility Bills",
      description: "Pay your utility bills and get 20% cashback",
      category: "UTILITIES",
      merchant: {
        name: "CRED",
        category: "Bill Payments",
        logo: "https://cred.club/assets/images/cred-logo.png",
        website: "https://cred.club",
        contactEmail: "support@cred.club",
        supportPhone: "1800-123-2222"
      },
      pointsRequired: 2500,
      value: {
        amount: 20,
        type: "PERCENTAGE",
        maxDiscount: 500
      },
      validityPeriod: {
        startDate: new Date(),
        endDate: new Date(new Date().setMonth(new Date().getMonth() + 3))
      },
      termsAndConditions: [
        "Valid on electricity, water, and gas bills",
        "Maximum cashback ₹500",
        "Valid once per bill type per month"
      ],
      availability: {
        totalQuantity: 5000,
        remainingQuantity: 4800,
        perUserLimit: 5
      },
      user: userId,
      status: "ACTIVE"
    }
  ];

  return rewards;
};

const supports = [
  {
    user: userId,
    ticketNumber: 'TKT001',
    subject: 'Card activation request',
    description: 'Need help activating my new credit card',
    status: 'open',
    priority: 'high',
    category: 'card_activation',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
  },
  {
    user: userId,
    ticketNumber: 'TKT002',
    subject: 'Transaction dispute',
    description: 'Unknown transaction on my card',
    status: 'in_progress',
    priority: 'high',
    category: 'dispute',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
  },
  {
    user: userId,
    ticketNumber: 'TKT003',
    subject: 'Reward points inquiry',
    description: 'Points not credited for recent purchase',
    status: 'resolved',
    priority: 'medium',
    category: 'rewards',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
    resolvedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000)
  }
];

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data for the user
    await CreditCard.deleteMany({ user: userId });
    await Transaction.deleteMany({ user: userId });
    await Payment.deleteMany({ user: userId });
    await Reward.deleteMany({ user: userId });

    // Generate and insert credit cards
    const cardData = generateCreditCards();
    const insertedCards = await CreditCard.insertMany(cardData);
    console.log('Credit cards seeded');

    // Generate and create transactions for each card
    for (const card of insertedCards) {
      const transactions = generateTransactions(card);
      await Transaction.insertMany(transactions);
      console.log(`Transactions seeded for card ${card.cardName}`);
      
      // Generate and create payments for each card
      const payments = generatePayments(card._id);
      await Payment.insertMany(payments);
      console.log(`Payments seeded for card ${card.cardName}`);
    }

    // Add specific upcoming payments
    const upcomingPayments = await generateUpcomingPayments(userId, insertedCards);
    await Payment.insertMany(upcomingPayments);
    console.log('Upcoming payments seeded');

    // Generate and create rewards
    const rewards = generateRewards();
    await Reward.insertMany(rewards);
    console.log('Rewards seeded');

    console.log('All data seeded successfully!');
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  }
};

seedData();
