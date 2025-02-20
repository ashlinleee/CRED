import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  phoneNumber: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[0-9]{10}$/.test(v);
      },
      message: props => `${props.value} is not a valid 10-digit phone number!`
    }
  },
  otp: {
    type: String,
    required: true,
    validate: {
      validator: function(v) {
        return /^[0-9]{6}$/.test(v);
      },
      message: props => `${props.value} is not a valid 6-digit OTP!`
    }
  },
  purpose: {
    type: String,
    required: true,
    enum: ['registration', 'login', 'reset_password'],
    default: 'registration'
  },
  verified: {
    type: Boolean,
    default: false
  },
  attempts: {
    type: Number,
    default: 0,
    max: 3 // Maximum 3 verification attempts
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 300 // Document will be automatically deleted after 5 minutes
  },
  lastAttemptAt: {
    type: Date
  }
});

// Add index for faster queries
otpSchema.index({ phoneNumber: 1, purpose: 1 });

// Check if too many attempts have been made
otpSchema.methods.isTooManyAttempts = function() {
  return this.attempts >= 3;
};

// Increment the number of attempts
otpSchema.methods.incrementAttempts = async function() {
  this.attempts += 1;
  this.lastAttemptAt = new Date();
  await this.save();
};

// Verify the OTP
otpSchema.methods.verifyOTP = function(inputOTP) {
  return this.otp === inputOTP;
};

const OTP = mongoose.model('OTP', otpSchema);

export default OTP;
