const checkSeededProfile = async () => {
  try {
    const loginRes = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@campuscoin.com', password: 'password123' })
    });
    
    const cookies = loginRes.headers.get('set-cookie');
    
    const profileRes = await fetch('http://localhost:3001/api/users/profile', {
      headers: { 'Cookie': cookies }
    });
    const profile = await profileRes.json();
    console.log('--- GET SEEDED RESPONSE ---');
    console.log(JSON.stringify(profile, null, 2));
  } catch(e) {
    console.error(e);
  }
}
checkSeededProfile();
