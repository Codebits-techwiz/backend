import request from 'supertest';
import app from '../server.js';
import mongoose from 'mongoose';
import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';

const routesWithIdNoValidator = [
  { method: 'patch', path: '/api/admin/users/invalid-id/status' },
  { method: 'post', path: '/api/admin/users/invalid-id/reset-password' },
  { method: 'put', path: '/api/admin/categories/invalid-id' },
  { method: 'delete', path: '/api/admin/categories/invalid-id' },
  { method: 'put', path: '/api/admin/announcements/invalid-id' },
  { method: 'patch', path: '/api/admin/announcements/invalid-id' },
  { method: 'delete', path: '/api/admin/announcements/invalid-id' },
  { method: 'put', path: '/api/admin/tip-templates/invalid-id' },
  { method: 'delete', path: '/api/admin/tip-templates/invalid-id' },
  { method: 'patch', path: '/api/bookmarks/invalid-id' },
  { method: 'delete', path: '/api/bookmarks/invalid-id' },
  { method: 'delete', path: '/api/budgets/invalid-id' },
  { method: 'delete', path: '/api/categories/invalid-id' },
  { method: 'patch', path: '/api/notifications/invalid-id/read' },
  { method: 'delete', path: '/api/recurring/invalid-id' },
  { method: 'get', path: '/api/transactions/invalid-id' },
  { method: 'delete', path: '/api/transactions/invalid-id' },
  { method: 'delete', path: '/api/templates/invalid-id' }
];

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campus_coin_test');
  
  // Seed a fake admin
  const fakeAdmin = new User({ name: 'Admin', email: 'admin_test400@example.com', passwordHash: 'hash', role: 'admin' });
  await fakeAdmin.save({ validateBeforeSave: false });
  const token = jwt.sign({ id: fakeAdmin._id }, process.env.JWT_SECRET || 'testsecret', { expiresIn: '1h' });
  
  let all400 = true;
  for (const route of routesWithIdNoValidator) {
    // using supertest with the imported app, same as main.test.js
    const res = await request(app)[route.method](route.path)
      .set('Cookie', [`jwt=${token}`]);
    
    console.log(`${route.method.toUpperCase()} ${route.path} - Status: ${res.statusCode} - ${res.body.error || res.body.message || ''}`);
    if (res.statusCode !== 400) {
       all400 = false;
    }
  }
  
  await User.deleteOne({ _id: fakeAdmin._id });
  console.log('All 18 routes successfully caught CastError and returned 400?', all400);
  process.exit(0);
}

run().catch(console.error);
