import mongoose from 'mongoose';

const rewardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['SHOPPING', 'TRAVEL', 'DINING', 'ENTERTAINMENT', 'UTILITIES', 'OTHER'],
    required: true
  },
  merchant: {
    name: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    logo: String,
    website: String,
    contactEmail: String,
    supportPhone: String
  },
  pointsRequired: {
    type: Number,
    required: true,
    min: 0
  },
  value: {
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    type: {
      type: String,
      enum: ['PERCENTAGE', 'FLAT', 'CASHBACK'],
      required: true
    },
    maxDiscount: Number,
    minPurchase: Number
  },
  validityPeriod: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    },
    redemptionPeriod: {
      type: Number, // days
      default: 30
    }
  },
  availability: {
    totalQuantity: {
      type: Number,
      required: true
    },
    remainingQuantity: {
      type: Number,
      required: true
    },
    perUserLimit: {
      type: Number,
      default: 1
    }
  },
  termsAndConditions: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['ACTIVE', 'PAUSED', 'EXPIRED', 'DEPLETED'],
    default: 'ACTIVE'
  },
  metadata: {
    featured: {
      type: Boolean,
      default: false
    },
    priority: {
      type: Number,
      default: 0
    },
    tags: [String],
    targetAudience: {
      minCreditScore: Number,
      maxCreditScore: Number,
      preferredBanks: [String],
      preferredCards: [String]
    }
  },
  redemptionStats: {
    totalRedemptions: {
      type: Number,
      default: 0
    },
    successfulRedemptions: {
      type: Number,
      default: 0
    },
    failedRedemptions: {
      type: Number,
      default: 0
    },
    averageUserRating: {
      type: Number,
      default: 0
    }
  },
  notifications: {
    lowStock: {
      type: Boolean,
      default: true
    },
    lowStockThreshold: {
      type: Number,
      default: 10
    },
    expiryReminder: {
      type: Boolean,
      default: true
    },
    expiryReminderDays: {
      type: Number,
      default: 7
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for faster queries
rewardSchema.index({ status: 1, 'validityPeriod.endDate': 1 });
rewardSchema.index({ 'merchant.category': 1, pointsRequired: 1 });
rewardSchema.index({ category: 1, status: 1 });
rewardSchema.index({ 'metadata.featured': 1, 'metadata.priority': -1 });
rewardSchema.index({ 'metadata.tags': 1 });

// Virtual for checking if reward is available
rewardSchema.virtual('isAvailable').get(function() {
  const now = new Date();
  return (
    this.status === 'ACTIVE' &&
    this.availability.remainingQuantity > 0 &&
    now >= this.validityPeriod.startDate &&
    now <= this.validityPeriod.endDate
  );
});

// Pre-save middleware to update status
rewardSchema.pre('save', function(next) {
  const now = new Date();
  
  // Update status based on various conditions
  if (this.availability.remainingQuantity <= 0) {
    this.status = 'DEPLETED';
  } else if (now > this.validityPeriod.endDate) {
    this.status = 'EXPIRED';
  }
  
  next();
});

// Method to check if user is eligible
rewardSchema.methods.isUserEligible = function(user) {
  if (!user || !this.metadata.targetAudience) return true;
  
  const { minCreditScore, maxCreditScore, preferredBanks, preferredCards } = this.metadata.targetAudience;
  
  // Check credit score eligibility
  if (minCreditScore && user.creditScore < minCreditScore) return false;
  if (maxCreditScore && user.creditScore > maxCreditScore) return false;
  
  // Check if user has eligible cards
  if (preferredBanks && preferredBanks.length > 0) {
    const userBanks = user.creditCards.map(card => card.bank);
    if (!preferredBanks.some(bank => userBanks.includes(bank))) return false;
  }
  
  return true;
};

// Method to process redemption
rewardSchema.methods.redeem = async function() {
  if (!this.isAvailable) {
    throw new Error('Reward is not available for redemption');
  }
  
  this.availability.remainingQuantity--;
  this.redemptionStats.totalRedemptions++;
  this.redemptionStats.successfulRedemptions++;
  
  if (this.availability.remainingQuantity <= this.notifications.lowStockThreshold) {
    // TODO: Trigger low stock notification
  }
  
  return this.save();
};

// Static method to get featured rewards
rewardSchema.statics.getFeaturedRewards = function() {
  return this.find({
    status: 'ACTIVE',
    'metadata.featured': true,
    'validityPeriod.endDate': { $gt: new Date() },
    'availability.remainingQuantity': { $gt: 0 }
  })
  .sort({ 'metadata.priority': -1 })
  .limit(10);
};

const Reward = mongoose.model('Reward', rewardSchema);

export default Reward;
