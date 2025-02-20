// Sample transaction data for testing rewards
export const sampleTransactions = [
  {
    amount: 5000,
    type: 'PURCHASE',
    category: 'SHOPPING',
    merchant: {
      name: 'Amazon',
      category: 'E-commerce',
      location: 'Online'
    },
    date: new Date()
  },
  {
    amount: 2000,
    type: 'PURCHASE',
    category: 'DINING',
    merchant: {
      name: 'Pizza Hut',
      category: 'Restaurant',
      location: 'Mumbai'
    },
    date: new Date()
  },
  {
    amount: 10000,
    type: 'PURCHASE',
    category: 'TRAVEL',
    merchant: {
      name: 'MakeMyTrip',
      category: 'Travel',
      location: 'Online'
    },
    date: new Date()
  }
];

// Sample credit card data
export const sampleCreditCards = [
  {
    cardNumber: '4111111111111111',
    cardHolder: 'John Doe',
    expiryDate: '12/25',
    cvv: '123',
    bank: 'HDFC Bank',
    cardType: 'VISA',
    cardTier: 'PLATINUM',
    creditLimit: 100000,
    availableLimit: 85000,
    statementDate: 1, // 1st of every month
    dueDate: 18, // 18 days after statement
    rewardRate: 2 // 2 points per ₹100
  },
  {
    cardNumber: '5111111111111118',
    cardHolder: 'John Doe',
    expiryDate: '11/25',
    cvv: '456',
    bank: 'ICICI Bank',
    cardType: 'MASTERCARD',
    cardTier: 'SIGNATURE',
    creditLimit: 150000,
    availableLimit: 120000,
    statementDate: 5, // 5th of every month
    dueDate: 20, // 20 days after statement
    rewardRate: 2.5 // 2.5 points per ₹100
  }
];
