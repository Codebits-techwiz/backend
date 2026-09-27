const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../app');

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus_coin_test');
  console.log('--- STARTING 5 ENDPOINT AUDITS ---');

  // 1. Auth (Register)
  console.log('\\n1. POST /api/auth/register (Auth)');
  let res = await request(app).post('/api/auth/register').send({ name: 'Audit Student', email: 'audit@campuscoin.com', password: 'password123' });
  console.log('Status:', res.status);
  console.log('Body:', JSON.stringify(res.body));

  // Get token for protected routes
  res = await request(app).post('/api/auth/login').send({ email: 'student@campuscoin.com', password: 'password123' });
  let studentCookie = res.headers['set-cookie'];

  // 2. Transactions (GET)
  console.log('\\n2. GET /api/transactions (Transactions)');
  res = await request(app).get('/api/transactions').set('Cookie', studentCookie);
  console.log('Status:', res.status);
  console.log('Body:', JSON.stringify(res.body).substring(0, 100) + '...');

  // 3. Budgets (GET)
  console.log('\\n3. GET /api/budgets (Budgets)');
  res = await request(app).get('/api/budgets').set('Cookie', studentCookie);
  console.log('Status:', res.status);
  console.log('Body:', JSON.stringify(res.body).substring(0, 100) + '...');

  // 4. Admin (Stats)
  console.log('\\n4. GET /api/admin/stats (Admin)');
  res = await request(app).post('/api/auth/admin-login').send({ email: 'admin@campuscoin.com', password: 'password123' });
  let adminCookie = res.headers['set-cookie'];
  res = await request(app).get('/api/admin/stats').set('Cookie', adminCookie);
  console.log('Status:', res.status);
  console.log('Body:', JSON.stringify(res.body));

  // 5. AI (Predict Category)
  console.log('\\n5. POST /api/ai/predict-category (AI)');
  res = await request(app).post('/api/ai/predict-category')
    .set('Cookie', studentCookie)
    .send({ description: 'Uber ride to campus' });
  console.log('Status:', res.status);
  console.log('Body:', JSON.stringify(res.body));

  await mongoose.disconnect();
}
run().catch(console.error);
