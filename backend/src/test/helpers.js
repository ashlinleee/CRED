import jwt from 'jsonwebtoken';
import { User } from '../models/user.js';

export const createTestUser = async (overrides = {}) => {
  const user = await User.create({
    email: 'test@example.com',
    password: 'Password123!',
    name: 'Test User',
    ...overrides
  });
  return user;
};

export const generateTestToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

export const createAuthenticatedUser = async (overrides = {}) => {
  const user = await createTestUser(overrides);
  const token = generateTestToken(user._id);
  return { user, token };
};

export const expectSuccessResponse = (response) => {
  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('success', true);
};

export const expectErrorResponse = (response, status = 400) => {
  expect(response.status).toBe(status);
  expect(response.body).toHaveProperty('success', false);
  expect(response.body).toHaveProperty('message');
};
