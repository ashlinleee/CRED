import { getRedisClient, isRedisConnected } from '../config/redis.js';
import logger from '../utils/logger.js';

const DEFAULT_EXPIRATION = 3600; // 1 hour

export const cacheMiddleware = (duration = DEFAULT_EXPIRATION) => {
  return async (req, res, next) => {
    if (!isRedisConnected() || req.method !== 'GET') {
      return next();
    }

    try {
      const redis = getRedisClient();
      const key = `cache:${req.originalUrl || req.url}`;
      const cachedResponse = await redis.get(key);

      if (cachedResponse) {
        logger.debug(`Cache hit for ${key}`);
        return res.json(JSON.parse(cachedResponse));
      }

      // Store the original send
      const originalSend = res.json;

      // Override res.send
      res.json = function (body) {
        try {
          redis.setex(key, duration, JSON.stringify(body));
        } catch (error) {
          logger.error('Error caching response:', error);
        }
        return originalSend.call(this, body);
      };

      next();
    } catch (error) {
      logger.error('Cache middleware error:', error);
      next();
    }
  };
};

export const clearCache = async (pattern) => {
  try {
    const redis = getRedisClient();
    const keys = await redis.keys(`cache:${pattern}`);
    if (keys.length > 0) {
      await redis.del(keys);
      logger.info(`Cleared cache for pattern: ${pattern}`);
    }
  } catch (error) {
    logger.error('Clear cache error:', error);
    throw error;
  }
};

export const invalidateUserCache = async (userId) => {
  try {
    await clearCache(`/api/user/${userId}*`);
    await clearCache(`/api/cards?userId=${userId}`);
    await clearCache(`/api/transactions?userId=${userId}`);
  } catch (error) {
    logger.error('Invalidate user cache error:', error);
    throw error;
  }
};
