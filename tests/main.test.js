import request from 'supertest';
import mongoose from 'mongoose';

// Set up env for testing before importing server
process.env.PORT = '5001';
process.env.JWT_SECRET = 'test_secret';
process.env.NODE_ENV = 'test';
if (!process.env.MONGODB_URI) {
  process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/campus_coin_test';
}

import '../server.js';

const app = 'http://localhost:5001';

describe('Campus Coin API Automated Test Suite', () => {
  let userToken = '';
  let adminToken = '';
  let userId = '';

  beforeAll(async () => {
    // 1. REFUSE to run if not targeting a _test database
    if (!process.env.MONGODB_URI.endsWith('_test')) {
      console.error('FATAL: Tests must run against a database whose name ends with _test');
      process.exit(1);
    }
    
    // Give server a moment to start and connect
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await mongoose.connection.db.dropDatabase();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Auth & Disabled User Handling', () => {
    it('should register a new student', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'John Doe', email: 'john@example.com', password: 'password123' });
      expect(res.statusCode).toBe(201);
      userId = res.body.data._id;
    });

    it('should login and return a token cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'john@example.com', password: 'password123' });
      expect(res.statusCode).toBe(200);
      userToken = res.headers['set-cookie'][0].split(';')[0];
    });

    it('should block login if user is disabled', async () => {
      // Disable user directly in DB
      await mongoose.connection.db.collection('users').updateOne(
        { email: 'john@example.com' },
        { $set: { isActive: false } }
      );

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'john@example.com', password: 'password123' });
      expect(res.statusCode).toBe(401);
    });

    it('should reject already-issued cookie if user is disabled', async () => {
      const res = await request(app)
        .get('/api/users/profile')
        .set('Cookie', userToken);
      expect(res.statusCode).toBe(403);

      // Re-enable for further tests
      await mongoose.connection.db.collection('users').updateOne(
        { email: 'john@example.com' },
        { $set: { isActive: true } }
      );
    });
  });

  describe('Validation & Limits', () => {
    it('should fail with 400 on invalid ObjectId in params', async () => {
      const res = await request(app)
        .get('/api/transactions/invalid-id')
        .set('Cookie', userToken);
      // Fails Mongoose CastError, should be handled as 400
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toBe('Invalid ID format');
    });

    it('should block CSV imports over 1000 rows', async () => {
      // Generate a large CSV
      const rows = ['Date,Type,Amount,Category,Description'];
      for (let i = 0; i < 1001; i++) {
        rows.push(`2026-09-01,expense,10,Food,Item ${i}`);
      }
      const csvBuffer = Buffer.from(rows.join('\n'));

      const res = await request(app)
        .post('/api/transactions/import-csv/preview')
        .set('Cookie', userToken)
        .attach('file', csvBuffer, 'large.csv');
      
      expect(res.statusCode).toBe(400);
      expect(res.body.error).toContain('limit');
    });
  });

  describe('Admin Isolation & Ownership', () => {
    it('should block student from accessing admin routes', async () => {
      const res = await request(app)
        .get('/api/admin/stats')
        .set('Cookie', userToken);
      expect(res.statusCode).toBe(403);
    });

    it('should prevent John from accessing Jane\'s category', async () => {
      // Create Jane
      const janeRes = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Jane', email: 'jane@example.com', password: 'password123' });
      const janeToken = janeRes.headers['set-cookie'][0].split(';')[0];
      
      // Jane creates a category
      const catRes = await request(app)
        .post('/api/categories')
        .set('Cookie', janeToken)
        .send({ name: 'Jane Secret Cat', type: 'expense', icon: '🔒', color: '#000000' });
      const janeCatId = catRes.body.data._id;

      // John tries to create a budget using Jane's category
      const bugRes = await request(app)
        .post('/api/budgets')
        .set('Cookie', userToken)
        .send({ category: janeCatId, limitAmount: 100, month: '2026-09' });
      
      expect(bugRes.statusCode).toBe(400);
      expect(bugRes.body.error).toMatch(/Invalid category ID/);
    });
  });

  describe('Budget Alerts', () => {
    it('should trigger budget alert when spending exceeds 80%', async () => {
      // John creates his own category
      const catRes = await request(app)
        .post('/api/categories')
        .set('Cookie', userToken)
        .send({ name: 'Food', type: 'expense', icon: '🍔', color: '#ff0000' });
      const foodCatId = catRes.body.data._id;

      // John sets a budget of $100
      await request(app)
        .post('/api/budgets')
        .set('Cookie', userToken)
        .send({ category: foodCatId, limitAmount: 100, month: '2026-09' });

      // John spends $85
      await request(app)
        .post('/api/transactions')
        .set('Cookie', userToken)
        .send({ category: foodCatId, type: 'expense', amount: 85, date: '2026-09-15' });

      // Check notifications
      const notifRes = await request(app)
        .get('/api/notifications')
        .set('Cookie', userToken);
      
      expect(notifRes.body.data.notifications.some(n => n.title.includes('80%'))).toBe(true);
    });
  });
});
