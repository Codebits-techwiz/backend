const http = require('http');

function makeRequest(options, postData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: body
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runRealAuthTest() {
  console.log('=== STEP 1: REAL ADMIN LOGIN ===');
  const loginPayload = JSON.stringify({
    email: 'admin@campuscoin.com',
    password: 'password123'
  });

  const loginRes = await makeRequest({
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/admin-login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(loginPayload)
    }
  }, loginPayload);

  console.log('HTTP Status:', loginRes.statusCode);
  console.log('Set-Cookie Header:', loginRes.headers['set-cookie']);
  console.log('Response Body:', loginRes.body);

  const rawCookie = loginRes.headers['set-cookie'] ? loginRes.headers['set-cookie'][0] : '';
  const cookieValue = rawCookie.split(';')[0]; // Extract 'jwt=...'

  console.log('\n=== STEP 2: GET /api/admin/site-content WITH COOKIE ===');
  const getRes = await makeRequest({
    hostname: 'localhost',
    port: 3001,
    path: '/api/admin/site-content',
    method: 'GET',
    headers: {
      'Cookie': cookieValue
    }
  });

  console.log('HTTP Status:', getRes.statusCode);
  console.log('Response Body:', getRes.body);

  console.log('\n=== STEP 3: PUT /api/admin/site-content/hero WITH COOKIE ===');
  const updatePayload = JSON.stringify({
    badge: '100% Free for College Students',
    headline1: 'Master your campus budget,',
    headline2: 'ditch money stress.',
    subtext: 'Track allowances, canteen runs, and hostel expenses without linking a bank account. Powered by smart AI insights.',
    ctaPrimary: 'Get Started Free',
    ctaSecondary: 'See How It Works'
  });

  const updateRes = await makeRequest({
    hostname: 'localhost',
    port: 3001,
    path: '/api/admin/site-content/hero',
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(updatePayload),
      'Cookie': cookieValue
    }
  }, updatePayload);

  console.log('HTTP Status:', updateRes.statusCode);
  console.log('Response Body:', updateRes.body);
}

runRealAuthTest().catch(console.error);
