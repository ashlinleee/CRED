import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import OTP from '../models/OTP.js';
import { authenticateToken } from '../middleware/auth.js';
import logger from '../utils/logger.js';
import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const router = express.Router();
const TWO_FACTOR_API_KEY = process.env.TWO_FACTOR_API_KEY;

// Log middleware for debugging
router.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl}`, {
    body: req.body,
    query: req.query,
    params: req.params,
  });
  next();
});

// Send OTP using 2Factor.in API
const sendOTP = async (phoneNumber, purpose = 'registration') => {
  try {
    // Format phone number (remove +91 if present)
    const formattedPhone = phoneNumber.startsWith('+91') 
      ? phoneNumber.slice(3) 
      : phoneNumber;

    if (!/^[0-9]{10}$/.test(formattedPhone)) {
      throw new Error('Invalid phone number format. Please enter a 10-digit number.');
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    logger.info('Generated OTP:', otp, 'for phone:', formattedPhone);

    // Send OTP via 2Factor.in API
    const apiKey = process.env.TWO_FACTOR_API_KEY;
    if (!apiKey) {
      throw new Error('TWO_FACTOR_API_KEY is not configured');
    }

    // Construct the API URL
    const url = `https://2factor.in/API/V1/${apiKey}/SMS/${formattedPhone}/${otp}/OTP1`;
    logger.info('Sending OTP request to 2Factor.in');

    const response = await axios.get(url);
    logger.info('2Factor.in API response:', response.data);

    if (response.data.Status !== 'Success') {
      throw new Error(response.data.Details || 'Failed to send OTP');
    }

    // Delete any existing OTP for this phone and purpose
    await OTP.deleteOne({ phoneNumber: formattedPhone, purpose });

    // Store new OTP in database
    const otpDoc = await OTP.create({
      phoneNumber: formattedPhone,
      otp,
      purpose,
      createdAt: new Date(),
      verified: false,
      attempts: 0
    });

    logger.info('OTP stored successfully with ID:', otpDoc._id);
    return true;
  } catch (error) {
    logger.error('OTP sending error:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
};

// Verify OTP
const verifyOTP = async (phoneNumber, userOtp, purpose = 'registration') => {
  try {
    // Get stored OTP
    const formattedPhone = phoneNumber.startsWith('+91') ? phoneNumber.slice(3) : phoneNumber;
    const otpDoc = await OTP.findOne({ 
      phoneNumber: formattedPhone,
      purpose,
      verified: false
    });

    if (!otpDoc) {
      console.error('No OTP found for:', phoneNumber);
      return { success: false, message: 'No active OTP found. Please request a new one.' };
    }

    if (otpDoc.isTooManyAttempts()) {
      await OTP.deleteOne({ _id: otpDoc._id });
      return { success: false, message: 'Too many failed attempts. Please request a new OTP.' };
    }

    // Verify OTP
    const isValid = otpDoc.verifyOTP(userOtp);
    
    if (isValid) {
      otpDoc.verified = true;
      await otpDoc.save();
      return { success: true };
    } else {
      await otpDoc.incrementAttempts();
      const remainingAttempts = 3 - otpDoc.attempts;
      return { 
        success: false, 
        message: `Invalid OTP. ${remainingAttempts} attempts remaining.`
      };
    }
  } catch (error) {
    console.error('OTP verification error:', error);
    return { success: false, message: 'Verification failed. Please try again.' };
  }
};

// Send OTP
router.post('/send-otp', async (req, res) => {
  try {
    const { phoneNumber, name, email } = req.body;
    logger.info('Received request to send OTP:', { phoneNumber, name, email });

    // Validate phone number format
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
    }

    // Validate email if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please enter a valid email address',
      });
    }

    // Check if user already exists
    const formattedPhone = phoneNumber.startsWith('+91') ? phoneNumber.slice(3) : phoneNumber;
    const existingUser = await User.findOne({ 
      $or: [
        { email: email || '' }, 
        { phoneNumber: formattedPhone }
      ] 
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this phone number or email',
      });
    }

    // Send OTP
    await sendOTP(phoneNumber, 'registration');

    logger.info('OTP sent successfully to:', phoneNumber);
    res.json({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (error) {
    logger.error('Registration OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send OTP',
    });
  }
});

// Registration: Verify OTP
router.post('/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, otp, name, email } = req.body;
    logger.info('Received request to verify OTP:', { phoneNumber, name, email });

    if (!phoneNumber || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone number and OTP are required'
      });
    }

    // Verify OTP
    const verifyResult = await verifyOTP(phoneNumber, otp, 'registration');
    if (!verifyResult.success) {
      return res.status(400).json({
        success: false,
        message: verifyResult.message
      });
    }

    // Format phone number
    const formattedPhone = phoneNumber.startsWith('+91') ? phoneNumber.slice(3) : phoneNumber;

    // Check if user already exists
    let user = await User.findOne({ phoneNumber: formattedPhone });
    
    if (user) {
      // Generate token for existing user
      const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '30d' }
      );

      return res.status(200).json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          phoneNumber: user.phoneNumber
        }
      });
    }

    // Create new user
    user = await User.create({
      name: name || `User${formattedPhone.slice(-4)}`,
      email: email || undefined, // Use undefined instead of null to avoid unique index issues
      phoneNumber: formattedPhone,
      isVerified: true
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber
      }
    });
  } catch (error) {
    logger.error('Registration verification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify OTP and register user'
    });
  }
});

// Login: Send OTP
router.post('/login/send-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    logger.info('Received login OTP request:', { phoneNumber });

    // Validate phone number format
    if (!phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Phone number is required',
      });
    }

    // Check if user exists
    const formattedPhone = phoneNumber.startsWith('+91') ? phoneNumber.slice(3) : phoneNumber;
    const user = await User.findOne({ phoneNumber: formattedPhone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this phone number. Please register first.',
      });
    }

    // Send OTP
    await sendOTP(phoneNumber, 'login');

    logger.info('Login OTP sent successfully to:', phoneNumber);
    res.json({
      success: true,
      message: 'OTP sent successfully',
    });
  } catch (error) {
    logger.error('Login OTP error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send OTP',
    });
  }
});

// Login: Verify OTP
router.post('/login/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;
    logger.info('Verifying login OTP:', { phoneNumber });

    // Verify OTP
    const verifyResult = await verifyOTP(phoneNumber, otp, 'login');
    if (!verifyResult.success) {
      return res.status(400).json({
        success: false,
        message: verifyResult.message,
      });
    }

    // Get user
    const formattedPhone = phoneNumber.startsWith('+91') ? phoneNumber.slice(3) : phoneNumber;
    const user = await User.findOne({ phoneNumber: formattedPhone });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    logger.info('Login successful for user:', user._id);
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    logger.error('Login verification error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Login failed',
    });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
      },
    });
  } catch (error) {
    logger.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
    });
  }
});

export default router;
