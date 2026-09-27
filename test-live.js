const loginAndFetch = async () => {
  try {
    const loginRes = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@campuscoin.com', password: 'password123' })
    });
    
    // Node.js fetch might return multiple cookies, extract the jwt cookie
    const cookies = loginRes.headers.get('set-cookie');
    
    const summaryRes = await fetch('http://localhost:3001/api/dashboard/summary', {
      headers: { 'Cookie': cookies }
    });
    const summary = await summaryRes.json();
    console.log('--- DASHBOARD SUMMARY ---');
    console.log(JSON.stringify(summary, null, 2));
  
    const profileRes = await fetch('http://localhost:3001/api/users/profile', {
      headers: { 'Cookie': cookies }
    });
    const profile = await profileRes.json();
    console.log('--- USER PROFILE ---');
    console.log(JSON.stringify(profile, null, 2));
  
    const trendRes = await fetch('http://localhost:3001/api/reports/trend-6months', {
      headers: { 'Cookie': cookies }
    });
    const trend = await trendRes.json();
    console.log('--- TREND 6 MONTHS ---');
    console.log(JSON.stringify(trend, null, 2));
  } catch(e) {
    console.error(e);
  }
}

loginAndFetch();
