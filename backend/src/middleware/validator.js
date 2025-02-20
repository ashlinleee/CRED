import { body, validationResult } from 'express-validator';
import logger from '../utils/logger.js';

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false, 
      errors: errors.array().map(err => ({
        field: err.param,
        message: err.msg
      }))
    });
  }
  next();
};

export const validateRegistration = (req, res, next) => {
  const { name, email, phone, password } = req.body;

  // Validate name
  if (!name || name.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Name must be at least 2 characters long'
    });
  }

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
  }

  // Validate phone
  const phoneRegex = /^\d{10}$/;
  if (!phone || !phoneRegex.test(phone)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid 10-digit phone number'
    });
  }

  // Validate password
  if (!password || password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters long'
    });
  }

  // Password strength check
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      success: false,
      message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    });
  }

  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid email address'
    });
  }

  // Validate password
  if (!password || password.length < 8) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters long'
    });
  }

  next();
};

export const registerValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[^a-zA-Z0-9])/)
    .withMessage('Password must include one lowercase, uppercase, number and special character'),
  body('name').trim().notEmpty().withMessage('Name is required'),
  validate
];

export const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required'),
  validate
];

export const cardValidation = [
  body('cardNumber')
    .matches(/^[0-9]{16}$/)
    .withMessage('Invalid card number'),
  body('expiryDate')
    .matches(/^(0[1-9]|1[0-2])\/([0-9]{2})$/)
    .withMessage('Invalid expiry date format (MM/YY)'),
  body('cvv')
    .matches(/^[0-9]{3,4}$/)
    .withMessage('Invalid CVV'),
  validate
];

export const transactionValidation = [
  body('cardId')
    .isMongoId()
    .withMessage('Invalid card ID'),
  body('amount')
    .isFloat({ min: 0.01 })
    .withMessage('Amount must be greater than 0'),
  body('type')
    .optional()
    .isIn(['PAYMENT', 'PURCHASE'])
    .withMessage('Invalid transaction type'),
  body('merchant')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Merchant name is required for purchases'),
  body('category')
    .optional()
    .isIn([
      'SHOPPING',
      'DINING',
      'TRAVEL',
      'ENTERTAINMENT',
      'GROCERIES',
      'UTILITIES',
      'BILL_PAYMENT',
      'OTHER'
    ])
    .withMessage('Invalid transaction category'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Description must not exceed 200 characters'),
  validate
];
