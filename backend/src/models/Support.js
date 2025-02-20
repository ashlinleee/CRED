import mongoose from 'mongoose';

const supportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ticketNumber: {
    type: String,
    required: true,
    unique: true
  },
  subject: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  category: {
    type: String,
    enum: ['general', 'technical', 'billing', 'card_activation', 'dispute', 'rewards'],
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  resolvedAt: {
    type: Date
  },
  comments: [{
    text: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
});

// Create a compound index for user and ticketNumber
supportSchema.index({ user: 1, ticketNumber: 1 }, { unique: true });

// Auto-generate ticket number before saving
supportSchema.pre('save', function(next) {
  if (!this.ticketNumber) {
    // Generate a random 6-digit number
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    this.ticketNumber = `TKT${randomNum}`;
  }
  next();
});

const Support = mongoose.model('Support', supportSchema);

export default Support;
