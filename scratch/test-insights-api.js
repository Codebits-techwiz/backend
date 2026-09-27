async function testInsights() {
  try {
    const login = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student@campuscoin.com',
        password: 'password123'
      })
    });
    
    // get set-cookie properly
    const cookieHeader = login.headers.get('set-cookie');
    const token = cookieHeader ? cookieHeader.split(';')[0] : '';
    
    const res = await fetch('http://localhost:3001/api/ai/monthly-insights', {
      headers: { Cookie: token }
    });
    
    const data = await res.json();
    console.log("=== API RESPONSE ===");
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error:", err.message);
  }
}

testInsights();
