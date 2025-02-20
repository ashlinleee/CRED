import mongoose from 'mongoose';

const creditCardSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cardName: {
    type: String,
    required: true
  },
  cardNumber: {
    type: String,
    required: true
  },
  expiryDate: {
    type: String,
    required: true
  },
  cvv: {
    type: String,
    required: true
  },
  bank: {
    type: String,
    required: true
  },
  creditLimit: {
    type: Number,
    required: true
  },
  availableCredit: {
    type: Number,
    default: function() {
      return this.creditLimit;
    }
  },
  rewards: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  transactions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction'
  }]
}, {
  timestamps: true
});

const CreditCard = mongoose.model('CreditCard', creditCardSchema);

export default CreditCard;
