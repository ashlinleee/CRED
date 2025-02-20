import Redis from 'ioredis';
import logger from '../utils/logger.js';

let redisClient = null;

export const initRedis = () => {
  if (process.env.REDIS_URL) {
    try {
      redisClient = new Redis(process.env.REDIS_URL);
      
      redisClient.on('connect', () => {
        logger.info('Redis client connected');
      });

      redisClient.on('error', (err) => {
        logger.error('Redis Client Error', err);
      });
    } catch (error) {
      logger.error('Redis initialization error:', error);
    }
  } else {
    logger.info('Redis URL not provided, skipping Redis initialization');
  }
};

export const getRedisClient = () => {
  return redisClient;
};

export const isRedisConnected = () => {
  return redisClient && redisClient.status === 'ready';
};
