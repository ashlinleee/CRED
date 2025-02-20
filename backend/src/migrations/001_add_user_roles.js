import { User } from '../models/user.js';
import logger from '../utils/logger.js';

export const up = async () => {
  try {
    // Add role field to all existing users
    await User.updateMany(
      { role: { $exists: false } },
      { $set: { role: 'user' } }
    );

    // Create indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await User.collection.createIndex({ role: 1 });

    logger.info('Migration 001: Successfully added user roles');
  } catch (error) {
    logger.error('Migration 001 failed:', error);
    throw error;
  }
};

export const down = async () => {
  try {
    // Remove role field from all users
    await User.updateMany(
      {},
      { $unset: { role: "" } }
    );

    // Drop indexes
    await User.collection.dropIndex('role_1');

    logger.info('Migration 001: Successfully rolled back user roles');
  } catch (error) {
    logger.error('Migration 001 rollback failed:', error);
    throw error;
  }
};
