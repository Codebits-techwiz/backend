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

async function runFullTest() {
  await mongoose.connect('mongodb://127.0.0.1:27017/campus_coin');
  const db = mongoose.connection.db;

  const testEmail = `moosa_test_${Date.now()}@aptechgdn.net`;
  console.log('--- E2E OTP REGISTRATION TEST ---');
  console.log('1. Target Email:', testEmail);

  // 1. Submit Registration Form
  const regRes = await makeRequest('/api/auth/register', {
    name: 'Moosa Test',
    email: testEmail,
    password: 'Password123!',
    academicYear: 'Year 2',
    monthlyAllowance: 60000,
    savingsGoal: 20000,
    currency: 'PKR'
  });

  console.log('\nStep 1 API Response:', regRes.data);

  // Check database: User should NOT exist in users collection yet!
  const userBeforeVerify = await db.collection('users').findOne({ email: testEmail });
  console.log('Database check (users collection before verify):', userBeforeVerify ? 'EXISTS (FAIL)' : 'NOT FOUND (PASSED - Details not saved yet!)');

  // Check PendingUser collection
  const pendingUser = await db.collection('pendingusers').findOne({ email: testEmail });
  console.log('PendingUser collection check:', pendingUser ? `FOUND with OTP: ${pendingUser.otpCode}` : 'NOT FOUND');

  if (!pendingUser) {
    console.error('Pending user not found!');
    process.exit(1);
  }

  // 2. Verify with correct OTP
  console.log('\n2. Verifying with correct OTP:', pendingUser.otpCode);
  const verifyRes = await makeRequest('/api/auth/verify-otp', {
    email: testEmail,
    otp: pendingUser.otpCode
  });

  console.log('Step 2 API Response:', verifyRes.data);

  // Check database: User SHOULD exist in users collection now!
  const userAfterVerify = await db.collection('users').findOne({ email: testEmail });
  console.log('\nDatabase check (users collection after verify):', userAfterVerify ? `SUCCESSFULLY CREATED (ID: ${userAfterVerify._id})` : 'NOT FOUND (FAIL)');

  // Check PendingUser collection: Should be deleted!
  const pendingUserAfter = await db.collection('pendingusers').findOne({ email: testEmail });
  console.log('PendingUser collection after verify:', pendingUserAfter ? 'STILL EXISTS (FAIL)' : 'CLEANED UP (PASSED)');

  await mongoose.disconnect();
}

runFullTest().catch(console.error);
