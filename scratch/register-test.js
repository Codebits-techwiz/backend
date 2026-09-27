async function test() {
  try {
    const res = await fetch('http://127.0.0.1:3001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test PKR User',
        email: 'testpkr2@example.com',
        password: 'password123',
        academicYear: '1st Year'
      })
    });
    const data = await res.json();
    console.log('Registered User:', data.data.user);
    if (data.data.user.currency === 'PKR') {
      console.log('SUCCESS: Default currency is PKR!');
    } else {
      console.error('FAIL: Currency is not PKR:', data.data.user.currency);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
