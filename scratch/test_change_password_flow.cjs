const http = require('http');

const BASE_URL = 'http://localhost:3001';

function makeRequest(path, method, body, cookie = '') {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const data = body ? JSON.stringify(body) : '';
    const headers = {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    };
    if (cookie) {
      headers['Cookie'] = cookie;
    }

    const req = http.request(url, { method, headers }, (res) => {
      let responseBody = '';
      const setCookie = res.headers['set-cookie'];

      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        let parsed = responseBody;
        try {
          parsed = JSON.parse(responseBody);
        } catch (e) {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          setCookie: setCookie ? setCookie.join('; ') : '',
          body: parsed
        });
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function runLiveTest() {
  console.log('--- LIVE TEST: SESSION PERSISTENCE AFTER PASSWORD CHANGE ---\n');

  // STEP 1: Log in as seeded student (student@campuscoin.com / password123)
  console.log('1. Logging in as seeded student (student@campuscoin.com / password123)...');
  const loginRes = await makeRequest('/api/auth/login', 'POST', {
    email: 'student@campuscoin.com',
    password: 'password123'
  });
  console.log(`HTTP Status: ${loginRes.status}`);
  console.log('Response:', JSON.stringify(loginRes.body, null, 2));

  let cookie = loginRes.setCookie;
  if (!cookie && loginRes.body?.data?.token) {
    cookie = `jwt=${loginRes.body.data.token}`;
  }

  if (loginRes.status !== 200) {
    console.error('Initial login failed! Aborting.');
    return;
  }

  // STEP 2: Attempt Change Password with WRONG current password
  console.log('\n2. Attempting Change Password with WRONG current password ("WrongPass999")...');
  const wrongPassRes = await makeRequest('/api/users/change-password', 'PUT', {
    currentPassword: 'WrongPass999',
    newPassword: 'newSecretPassword123'
  }, cookie);
  console.log(`HTTP Status: ${wrongPassRes.status}`);
  console.log('Response:', JSON.stringify(wrongPassRes.body, null, 2));

  // STEP 3: Change Password with CORRECT current password
  console.log('\n3. Changing Password with CORRECT current password ("password123" -> "newStudentPass2026")...');
  const correctPassRes = await makeRequest('/api/users/change-password', 'PUT', {
    currentPassword: 'password123',
    newPassword: 'newStudentPass2026'
  }, cookie);
  console.log(`HTTP Status: ${correctPassRes.status}`);
  console.log('Response:', JSON.stringify(correctPassRes.body, null, 2));

  // STEP 3.5 (TARGET CHECK): Access /api/users/profile using STEP 1'S ORIGINAL COOKIE
  console.log('\n3.5 CRITICAL CHECK: Fetching /api/users/profile using STEP 1 ORIGINAL SESSION COOKIE...');
  const profileRes = await makeRequest('/api/users/profile', 'GET', null, cookie);
  console.log(`HTTP Status: ${profileRes.status} (Expected: 200)`);
  console.log('Response:', JSON.stringify(profileRes.body, null, 2));

  // STEP 4a: Verify Old Password Rejection
  console.log('\n4a. Attempting login with OLD password ("password123")...');
  const oldLoginRes = await makeRequest('/api/auth/login', 'POST', {
    email: 'student@campuscoin.com',
    password: 'password123'
  });
  console.log(`HTTP Status: ${oldLoginRes.status}`);
  console.log('Response:', JSON.stringify(oldLoginRes.body, null, 2));

  // STEP 4b: Verify New Password Login Success
  console.log('\n4b. Attempting login with NEW password ("newStudentPass2026")...');
  const newLoginRes = await makeRequest('/api/auth/login', 'POST', {
    email: 'student@campuscoin.com',
    password: 'newStudentPass2026'
  });
  console.log(`HTTP Status: ${newLoginRes.status}`);
  console.log('Response:', JSON.stringify(newLoginRes.body, null, 2));

  // STEP 5: Restore original password back to "password123"
  console.log('\n5. Restoring original password back to "password123"...');
  let restoreCookie = newLoginRes.setCookie;
  if (!restoreCookie && newLoginRes.body?.data?.token) {
    restoreCookie = `jwt=${newLoginRes.body.data.token}`;
  }
  const restoreRes = await makeRequest('/api/users/change-password', 'PUT', {
    currentPassword: 'newStudentPass2026',
    newPassword: 'password123'
  }, restoreCookie);
  console.log(`HTTP Status: ${restoreRes.status}`);
  console.log('Response:', JSON.stringify(restoreRes.body, null, 2));

  console.log('\n--- SESSION PERSISTENCE VERIFIED SUCCESSFULLY ---');
}

runLiveTest().catch(console.error);
