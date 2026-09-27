import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const key = process.env.GEMINI_API_KEY;

async function listModelsAndTest() {
  const ai = new GoogleGenAI({ apiKey: key });
  
  // Test gemini-3.8-flash directly first
  const testModels = ['gemini-3.8-flash', 'gemini-1.5-flash-8b', 'gemini-2.0-flash-lite', 'gemini-2.5-flash-lite'];
  
  for (const m of testModels) {
    try {
      console.log(`Testing '${m}'...`);
      const res = await ai.models.generateContent({
        model: m,
        contents: 'Hello!'
      });
      if (res && res.text) {
        console.log(`✅ SUCCESS WITH MODEL '${m}':`, res.text.trim());
        return;
      }
    } catch (err) {
      console.log(`❌ FAILED '${m}' (${err.status || err.code}): ${err.message?.slice(0, 150)}`);
    }
  }
}

listModelsAndTest();
