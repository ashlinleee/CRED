import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { getRedisClient } from '../config/redis.js';
import logger from '../utils/logger.js';

const redisClient = getRedisClient();

const createLimiter = (options) => {
  const config = {
    store: redisClient ? new RedisStore({
      sendCommand: (...args) => redisClient.sendCommand(args),
      prefix: options.prefix || 'rl:',
    }) : undefined,
    windowMs: options.windowMs || 15 * 60 * 1000, // 15 minutes by default
    max: options.max || 100, // Limit each IP to 100 requests per windowMs
    message: {
      success: false,
      message: options.message || 'Too many requests, please try again later.',
    },
    keyGenerator: (req) => {
      // Use user ID if available, otherwise fall back to IP
      return req.user ? `${options.prefix}:${req.user.id}` : req.ip;
    },
    skip: (req) => {
      // Skip rate limiting for whitelisted IPs or admin users
      const whitelistedIPs = process.env.RATE_LIMIT_WHITELIST?.split(',') || [];
      if (whitelistedIPs.includes(req.ip)) return true;
      if (req.user?.role === 'admin') return true;
      return false;
    },
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded for ${req.user ? `user ${req.user.id}` : `IP ${req.ip}`}`);
      res.status(429).json({
        success: false,
        message: options.message || 'Too many requests, please try again later.',
      });
    },
    onLimitReached: (req) => {
      logger.warn(`Rate limit reached for ${req.user ? `user ${req.user.id}` : `IP ${req.ip}`}`);
    },
  };

  return rateLimit(config);
};

// General API rate limiter
export const apiLimiter = createLimiter({
  prefix: 'rl:api',
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Increased from 100
  message: 'Too many API requests, please try again later.',
});

// Auth rate limiter
export const authLimiter = createLimiter({
  prefix: 'rl:auth',
  windowMs: 15 * 60 * 1000, // 15 minutes instead of 1 hour
  max: 100, // Increased from 5
  message: 'Too many authentication attempts, please try again later.',
});

// OTP rate limiter (keeping this strict)
export const otpLimiter = createLimiter({
  prefix: 'rl:otp',
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Slightly increased from 3
  message: 'Too many OTP requests, please try again later.',
});

// Card operations rate limiter
export const cardLimiter = createLimiter({
  prefix: 'rl:card',
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50, // Increased from 10
  message: 'Too many card operations, please try again later.',
});

// Transaction rate limiter
export const transactionLimiter = createLimiter({
  prefix: 'rl:transaction',
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 200, // Increased from 50
  message: 'Too many transaction requests, please try again later.',
});

// Analytics rate limiter
export const analyticsLimiter = createLimiter({
  prefix: 'rl:analytics',
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 100, // Increased from 20
  message: 'Too many analytics requests, please try again later.',
});
