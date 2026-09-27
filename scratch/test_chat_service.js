import dotenv from 'dotenv';
dotenv.config();

import { getAiChatResponse } from '../services/chatService.js';

async function testChat() {
  console.log('Testing chatService with user message...');
  const res = await getAiChatResponse('Do I need to connect my bank account?');
  console.log('Chat Result:', res);
}

testChat();
