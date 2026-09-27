const http = require('http');

const BASE_URL = 'http://localhost:3001';

function sendChat(message, history = []) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ message, history });
    const req = http.request(`${BASE_URL}/api/chat`, {
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

async function runLiveVerification() {
  console.log('--- LIVE TEST: PUBLIC AI CHAT API (POST /api/chat) ---\n');

  console.log('1. User asks: "What is Campus Coin?"');
  const res1 = await sendChat('What is Campus Coin?');
  console.log(`HTTP Status: ${res1.status}`);
  console.log('API Response:', JSON.stringify(res1.body, null, 2));

  console.log('\n2. User asks: "Do I need a bank account?"');
  const res2 = await sendChat('Do I need a bank account?');
  console.log(`HTTP Status: ${res2.status}`);
  console.log('API Response:', JSON.stringify(res2.body, null, 2));

  console.log('\n3. User asks unrelated question: "What is the capital of France?"');
  const res3 = await sendChat('What is the capital of France?');
  console.log(`HTTP Status: ${res3.status}`);
  console.log('API Response:', JSON.stringify(res3.body, null, 2));

  console.log('\n--- VERIFICATION COMPLETE ---');
}

runLiveVerification().catch(console.error);
