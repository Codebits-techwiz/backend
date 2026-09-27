import * as chatService from '../services/chatService.js';
import { sendSuccess } from '../utils/response.js';

export const handlePublicChat = async (req, res, next) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message text is required' });
    }

    const result = await chatService.getAiChatResponse(message.trim(), history || []);
    return sendSuccess(res, 'Chat response generated', result);
  } catch (error) {
    next(error);
  }
};
