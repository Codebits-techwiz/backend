const testProfile = async () => {
  try {
    const loginRes = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'student@campuscoin.com', password: 'password123' })
    });
    
    const cookies = loginRes.headers.get('set-cookie');
    
    console.log('Sending PUT /api/users/profile with 500 (allowance) and 250 (savings)');
    const updateRes = await fetch('http://localhost:3001/api/users/profile', {
      method: 'PUT',
      headers: { 
        'Cookie': cookies,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'John Doe',
        academicYear: 'Sophomore',
        monthlyAllowanceBaseline: 500,
        monthlySavingsGoal: 250
      })
    });
    
    const update = await updateRes.json();
    console.log('--- PUT RESPONSE ---');
    console.log(JSON.stringify(update, null, 2));

    const profileRes = await fetch('http://localhost:3001/api/users/profile', {
      headers: { 'Cookie': cookies }
    });
    const profile = await profileRes.json();
    console.log('--- GET RESPONSE ---');
    console.log(JSON.stringify(profile, null, 2));
  } catch(e) {
    console.error(e);
  }
}

testProfile();
