import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import logger from '../utils/logger.js';

export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Invalid or missing Authorization header');
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid authorization header.'
      });
    }

    const token = authHeader.split(' ')[1];
    
    if (!process.env.JWT_SECRET) {
      logger.error('JWT_SECRET not configured');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error'
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Use decoded.id since that's what we store in the token
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        logger.warn('User not found for token:', decoded);
        return res.status(401).json({
          success: false,
          message: 'Invalid token - user not found'
        });
      }

      req.user = user;
      logger.info('User authenticated successfully', { userId: user._id });
      next();
    } catch (error) {
      logger.error('Token verification failed:', error);
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired'
        });
      }
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication'
    });
  }
};

// Middleware to check if user is admin
export const isAdmin = async (req, res, next) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: 'Access denied. Admin rights required.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Internal server error.' });
  }
};

// Middleware to validate request body
export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }
    next();
  };
};
