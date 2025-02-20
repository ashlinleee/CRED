import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

let mongo;

// Setup before all tests
beforeAll(async () => {
  // Create in-memory MongoDB instance
  mongo = await MongoMemoryServer.create();
  const mongoUri = mongo.getUri();

  await mongoose.connect(mongoUri);
});

// Clear all collections before each test
beforeEach(async () => {
  const collections = await mongoose.connection.db.collections();
  
  for (let collection of collections) {
    await collection.deleteMany({});
  }
});

// Cleanup after all tests
afterAll(async () => {
  await mongoose.connection.close();
  await mongo.stop();
});
