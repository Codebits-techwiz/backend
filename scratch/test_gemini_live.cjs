const http = require('http');

function testChat(message) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ message });
    const req = http.request('http://localhost:3001/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function run() {
  console.log('--- TESTING CHAT ENDPOINT AFTER RATE LIMIT FIX ---\n');
  for (let i = 1; i <= 3; i++) {
    const res = await testChat('What is Campus Coin?');
    console.log(`Request #${i} -> Status: ${res.status}`);
    console.log('Response:', JSON.stringify(res.body, null, 2));
  }
}

run().catch(console.error);
