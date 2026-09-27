import express from 'express';
import { handlePublicChat } from '../controllers/chatController.js';
import { chatLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/', chatLimiter, handlePublicChat);

export default router;
