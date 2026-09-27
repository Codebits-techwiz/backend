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

async function runTest() {
  console.log('--- TESTING AI CHAT ENDPOINT POST /api/chat ---\n');

  // TEST 1: What is Campus Coin?
  console.log('User Question 1: "What is Campus Coin?"');
  const res1 = await sendChat('What is Campus Coin?');
  console.log('Status Code:', res1.status);
  console.log('AI Reply:', res1.body?.data?.reply || res1.body);
  console.log('Source:', res1.body?.data?.source);
  console.log('--------------------------------------------------\n');

  // TEST 2: Do I need a bank account?
  console.log('User Question 2: "Do I need a bank account?"');
  const res2 = await sendChat('Do I need a bank account?');
  console.log('Status Code:', res2.status);
  console.log('AI Reply:', res2.body?.data?.reply || res2.body);
  console.log('Source:', res2.body?.data?.source);
  console.log('--------------------------------------------------\n');

  // TEST 3: Unrelated question (python script)
  console.log('User Question 3: "Write a python code for binary search"');
  const res3 = await sendChat('Write a python code for binary search');
  console.log('Status Code:', res3.status);
  console.log('AI Reply:', res3.body?.data?.reply || res3.body);
  console.log('Source:', res3.body?.data?.source);
  console.log('--------------------------------------------------\n');
}

runTest().catch(console.error);
