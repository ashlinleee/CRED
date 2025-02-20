// Error handling middleware
import logger from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
  logger.error('Error:', err);

  // Default error
  let error = {
    success: false,
    message: 'Server Error',
    statusCode: 500
  };

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    error.message = Object.values(err.errors).map(val => val.message).join(', ');
    error.statusCode = 400;
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    error.message = 'Duplicate field value entered';
    error.statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.statusCode = 401;
  }

  // Send error response
  res.status(error.statusCode).json({
    success: error.success,
    message: error.message
  });
};

// 404 handler
export const notFound = (req, res) => {
  res.status(404).json({
    success: false,
    message: `Not Found - ${req.originalUrl}`
  });
};
