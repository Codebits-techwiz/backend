import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GROK_API_KEY;
console.log('Testing GROK_API_KEY:', apiKey);

async function testGrok() {
  try {
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'grok-beta',
        messages: [
          { role: 'system', content: 'You are a helpful assistant for Campus Coin.' },
          { role: 'user', content: 'Hello! Are you working?' }
        ],
        temperature: 0.7,
      }),
    });

    console.log('Status Code:', response.status);
    const data = await response.json();
    if (response.ok) {
      console.log('✅ GROK SUCCESS! Reply:', data.choices?.[0]?.message?.content);
    } else {
      console.error('❌ GROK ERROR:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('❌ GROK EXCEPTION:', err);
  }
}

testGrok();
