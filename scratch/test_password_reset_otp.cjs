const http = require('http');
const mongoose = require('mongoose');

function makeRequest(path, data) {
  return new Promise((resolve, reject) => {
    const bodyText = JSON.stringify(data);
    const req = http.request({
      hostname: 'localhost',
      port: 3001,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(bodyText)
      }
    }, (res) => {
      let resBody = '';
      res.on('data', chunk => resBody += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(resBody) });
        } catch(e) {
          resolve({ status: res.statusCode, body: resBody });
        }
      });
    });
    req.on('error', reject);
    req.write(bodyText);
    req.end();
  });
}

async function testPasswordResetOtp() {
  await mongoose.connect('mongodb://127.0.0.1:27017/campus_coin');
  const db = mongoose.connection.db;

  const testEmail = `moosa_reset_${Date.now()}@aptechgdn.net`;
  const initialPassword = 'InitialPassword123!';
  const newPassword = 'NewPassword456!';

  console.log('--- PASSWORD RESET OTP TEST ---');
  console.log('1. Registering verified user:', testEmail);

  // Directly insert user into users collection
  const crypto = require('crypto');
  const bcrypt = require('bcryptjs');
  const passwordHash = await bcrypt.hash(initialPassword, 10);

  await db.collection('users').insertOne({
    name: 'Reset Test User',
    email: testEmail,
    passwordHash,
    role: 'student',
    academicYear: 'Year 1',
    monthlyAllowanceBaseline: 0,
    monthlySavingsGoal: 0,
    currency: 'PKR',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // 2. Request Forgot Password OTP
  console.log('\n2. Requesting Forgot Password OTP for:', testEmail);
  const forgotRes = await makeRequest('/api/auth/forgot-password', { email: testEmail });
  console.log('Forgot Password API Response:', forgotRes.data);

  // 3. Fetch OTP from DB
  const user = await db.collection('users').findOne({ email: testEmail });
  console.log('\n3. Database check - Generated Reset OTP Code:', user ? user.resetOtpCode : 'NOT FOUND');

  if (!user || !user.resetOtpCode) {
    console.error('Reset OTP code was not saved in DB!');
    process.exit(1);
  }

  // 4. Try Reset Password with invalid OTP
  console.log('\n4. Testing Invalid OTP Reset (Should fail)...');
  const invalidReset = await makeRequest('/api/auth/reset-password', {
    email: testEmail,
    otp: '999999',
    newPassword
  });
  console.log('Invalid Reset Response:', invalidReset.data);

  // 5. Reset Password with VALID OTP
  console.log('\n5. Resetting Password with VALID OTP:', user.resetOtpCode);
  const validReset = await makeRequest('/api/auth/reset-password', {
    email: testEmail,
    otp: user.resetOtpCode,
    newPassword
  });
  console.log('Valid Reset Response:', validReset.data);

  // 6. Verify login with NEW password
  console.log('\n6. Verifying login with NEW password...');
  const loginRes = await makeRequest('/api/auth/login', {
    email: testEmail,
    password: newPassword
  });
  console.log('Login with New Password Response:', loginRes.data.success ? 'SUCCESS (LOGGED IN!)' : loginRes.data);

  await mongoose.disconnect();
}

testPasswordResetOtp().catch(console.error);
