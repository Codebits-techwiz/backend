import { GoogleGenAI } from '@google/genai';
import Groq from 'groq-sdk';

const SYSTEM_PROMPT = `You are Campus Coin AI Assistant, a friendly and intelligent virtual assistant for Campus Coin — a 100% free student budget and expense tracking web application.

Key Information about Campus Coin:
- 100% free for college & university students.
- Helps students track allowances, daily expenses, canteen runs, hostel rent, subscriptions, and sports.
- NO bank account linking required (100% privacy with manual & CSV input).
- Supports PKR (Pakistani Rupee), USD, EUR, and GBP currencies.
- Features AI auto-categorization of expenses, monthly spending insights, budget alerts, and saving tips.
- Designed specifically for student lifestyle and simple expense management.

STRICT RULES:
1. ONLY answer questions related to Campus Coin, student budgeting, expense tracking, and application features.
2. If the user asks about unrelated topics (e.g. programming, world politics, general science, entertainment, history, physics), politely decline: "I am Campus Coin AI Assistant and can only answer questions about Campus Coin and student expense tracking."
3. Keep your answers concise, friendly, and under 2-3 sentences.`;

// Intelligent Student Budgeting Knowledge Base for instant high-quality fallback
const KNOWLEDGE_FALLBACKS = [
  {
    keywords: ['bank', 'account', 'connect', 'link', 'privacy', 'secure', 'safe'],
    reply: "Campus Coin is 100% bank-free! You never need to connect your bank account. You can log expenses manually or import CSV files, keeping your financial credentials 100% safe and private."
  },
  {
    keywords: ['budget', 'category', 'limit', 'overspend', 'alert', 'cap'],
    reply: "You can easily set monthly category spending limits in PKR (e.g., PKR 12,000 for Food). Our visual progress bars will turn amber at 80% and alert you before you overspend!"
  },
  {
    keywords: ['urdu', 'language', 'pakistan', 'pkr', 'currency', 'rupee'],
    reply: "Campus Coin fully supports PKR (Pakistani Rupee) and seamless bilingual switching between English and Urdu (اردو) anytime from the top navigation bar."
  },
  {
    keywords: ['ocr', 'receipt', 'scan', 'bill', 'canteen'],
    reply: "Simply upload or snap a photo of your canteen or mess receipt, and our AI will automatically extract the vendor, total amount, and suggest the best spending category!"
  },
  {
    keywords: ['free', 'cost', 'pricing', 'charge', 'money'],
    reply: "Campus Coin is 100% free forever for students! There are zero hidden fees or subscription charges."
  },
  {
    keywords: ['admin', 'panel', 'login', 'manage'],
    reply: "The Admin Panel allows site managers to update student category templates, publish announcements, and review overall site usage stats."
  }
];

function getKnowledgeFallback(query) {
  const lower = query.toLowerCase();
  for (const item of KNOWLEDGE_FALLBACKS) {
    if (item.keywords.some((kw) => lower.includes(kw))) {
      return item.reply;
    }
  }
  return "Welcome to Campus Coin! I am your student AI budget assistant. Ask me about setting PKR allowance baselines, tracking canteen expenses, or creating category budgets!";
}

/**
 * Handle AI public chat requests trying Groq API first, then Gemini API, then Smart Knowledge Fallback.
 */
export const getAiChatResponse = async (userMessage, history = []) => {
  const groqKey = process.env.GROQ_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  // 1. TRY GROQ API FIRST IF KEY PRESENT
  if (groqKey && groqKey.trim() !== '') {
    const candidateGroqModels = [
      process.env.GROQ_MODEL,
      'openai/gpt-oss-120b',
      'openai/gpt-oss-20b',
      'qwen/qwen3.8-27b'
    ].filter(Boolean);

    const groqClient = new Groq({ apiKey: groqKey.trim() });

    // Build messages array with history
    const messages = [{ role: 'system', content: SYSTEM_PROMPT }];
    if (Array.isArray(history) && history.length > 0) {
      history.slice(-6).forEach((msg) => {
        messages.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.text || msg.content || ''
        });
      });
    }
    messages.push({ role: 'user', content: userMessage });

    for (const modelName of candidateGroqModels) {
      try {
        const chatCompletion = await groqClient.chat.completions.create({
          messages: messages,
          model: modelName,
          temperature: 0.7,
        });

        const replyText = chatCompletion?.choices?.[0]?.message?.content?.trim();
        if (replyText) {
          console.log(`[Chat Service] Successfully generated response using Groq SDK (${modelName}).`);
          return { reply: replyText, source: 'groq' };
        }
      } catch (groqErr) {
        console.warn(`[Chat Service Groq SDK Exception] Model '${modelName}':`, groqErr.message);
      }
    }
  }

  // 2. TRY GOOGLE GEMINI API SECOND IF KEY PRESENT
  if (geminiKey && geminiKey.trim() !== '') {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey.trim() });
      
      let formattedContext = SYSTEM_PROMPT + '\n\nRecent Conversation Context:\n';
      if (Array.isArray(history) && history.length > 0) {
        const recentHistory = history.slice(-4);
        recentHistory.forEach((msg) => {
          const roleName = msg.role === 'user' ? 'User' : 'Assistant';
          formattedContext += `${roleName}: ${msg.text}\n`;
        });
      }

      formattedContext += `User: ${userMessage}\nAssistant:`;

      const candidateModels = [
        process.env.GEMINI_MODEL,
        'gemini-3.8-flash',
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash'
      ].filter(Boolean);

      for (const modelName of candidateModels) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: formattedContext
          });
          if (response && response.text) {
            console.log(`[Chat Service] Successfully generated response using Gemini model: ${modelName}`);
            return { reply: response.text.trim(), source: 'gemini' };
          }
        } catch (err) {
          console.warn(`[Chat Service Gemini Warning] Model '${modelName}' failed (${err.status || err.code}): ${err.message?.slice(0, 150)}`);
        }
      }
    } catch (geminiErr) {
      console.warn('[Chat Service Gemini Exception]:', geminiErr.message);
    }
  }

  // 3. SMART KNOWLEDGE BASE FALLBACK
  const smartReply = getKnowledgeFallback(userMessage);
  return { reply: smartReply, source: 'knowledge_base' };
};

