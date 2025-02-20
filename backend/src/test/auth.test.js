import request from 'supertest';
import app from '../app.js';
import { User } from '../models/user.js';
import { 
  createTestUser, 
  createAuthenticatedUser,
  expectSuccessResponse,
  expectErrorResponse
} from './helpers.js';

describe('Auth Routes', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user with valid data', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'Password123!',
          name: 'New User'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', 'newuser@example.com');
      
      // Verify user was created in database
      const user = await User.findOne({ email: 'newuser@example.com' });
      expect(user).toBeTruthy();
    });

    it('should not register user with invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
          name: 'New User'
        });

      expectErrorResponse(response);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'email'
        })
      );
    });

    it('should not register user with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'valid@example.com',
          password: 'weak',
          name: 'New User'
        });

      expectErrorResponse(response);
      expect(response.body.errors).toContainEqual(
        expect.objectContaining({
          field: 'password'
        })
      );
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await createTestUser();
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'Password123!'
        });

      expectSuccessResponse(response);
      expect(response.body).toHaveProperty('token');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
    });

    it('should not login with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expectErrorResponse(response, 401);
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should get user profile with valid token', async () => {
      const { user, token } = await createAuthenticatedUser();

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expectSuccessResponse(response);
      expect(response.body.user).toHaveProperty('email', user.email);
    });

    it('should not get profile without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile');

      expectErrorResponse(response, 401);
    });
  });

  describe('PUT /api/auth/profile', () => {
    it('should update user profile', async () => {
      const { token } = await createAuthenticatedUser();
      const newName = 'Updated Name';

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: newName });

      expectSuccessResponse(response);
      expect(response.body.user).toHaveProperty('name', newName);
    });
  });

  describe('PUT /api/auth/change-password', () => {
    it('should change password with valid current password', async () => {
      const { token } = await createAuthenticatedUser();
      const newPassword = 'NewPassword123!';

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'Password123!',
          newPassword
        });

      expectSuccessResponse(response);
    });

    it('should not change password with invalid current password', async () => {
      const { token } = await createAuthenticatedUser();

      const response = await request(app)
        .put('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'WrongPassword',
          newPassword: 'NewPassword123!'
        });

      expectErrorResponse(response, 401);
    });
  });
});
