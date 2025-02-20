import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, getMigrationCollection } from './config.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getMigrationFiles = async () => {
  const files = await fs.readdir(__dirname);
  return files
    .filter(f => f.match(/^\d{3,}_.*\.js$/))
    .sort();
};

export const runMigrations = async (direction = 'up') => {
  const conn = await connectDB();
  const migrations = await getMigrationCollection();
  
  try {
    const migrationFiles = await getMigrationFiles();
    
    for (const file of (direction === 'up' ? migrationFiles : migrationFiles.reverse())) {
      const migrationName = file.replace('.js', '');
      
      // Check if migration has been run
      const migrationDoc = await migrations.findOne({ name: migrationName });
      
      if (direction === 'up' && migrationDoc) {
        logger.info(`Migration ${migrationName} already applied`);
        continue;
      }
      
      if (direction === 'down' && !migrationDoc) {
        logger.info(`Migration ${migrationName} hasn't been applied`);
        continue;
      }
      
      // Import and run migration
      const migration = await import(`./${file}`);
      
      logger.info(`Running ${direction} migration: ${migrationName}`);
      
      await migration[direction]();
      
      if (direction === 'up') {
        await migrations.insertOne({
          name: migrationName,
          appliedAt: new Date()
        });
      } else {
        await migrations.deleteOne({ name: migrationName });
      }
      
      logger.info(`Completed ${direction} migration: ${migrationName}`);
    }
  } catch (error) {
    logger.error('Migration failed:', error);
    throw error;
  } finally {
    await conn.close();
  }
};

// Run migrations if this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const direction = process.argv[2] === 'down' ? 'down' : 'up';
  runMigrations(direction)
    .then(() => {
      logger.info('Migrations completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration failed:', error);
      process.exit(1);
    });
}
