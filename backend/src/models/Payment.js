import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  creditCard: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CreditCard',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: [0, 'Amount cannot be negative']
  },
  type: {
    type: String,
    required: true,
    enum: ['credit_card_bill', 'emi', 'reward_redemption']
  },
  status: {
    type: String,
    required: true,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  date: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['upi', 'netbanking', 'debit_card', 'auto_debit']
  },
  description: {
    type: String,
    trim: true
  },
  transactionId: {
    type: String,
    unique: true,
    sparse: true
  },
  completedAt: {
    type: Date
  },
  metadata: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

// Add indexes for faster queries
paymentSchema.index({ user: 1, date: -1 });
paymentSchema.index({ creditCard: 1, date: -1 });
paymentSchema.index({ status: 1 });

// Static method to get upcoming payments
paymentSchema.statics.getUpcomingPayments = async function(userId) {
  const currentDate = new Date();
  return this.find({
    user: userId,
    status: 'pending',
    dueDate: { $gt: currentDate }
  })
  .sort({ dueDate: 1 })
  .populate('creditCard', 'cardName cardNumber cardType')
  .exec();
};

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;