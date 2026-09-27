import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const loginRes = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student@campuscoin.com', password: 'password123' })
  });
  const cookie = loginRes.headers.get('set-cookie');

  const res = await fetch('http://localhost:3001/api/transactions', {
    headers: {
      'Cookie': cookie
    }
  });
  const json = await res.json();
  console.log(json.data.transactions[0]);

  process.exit();
}
run();
