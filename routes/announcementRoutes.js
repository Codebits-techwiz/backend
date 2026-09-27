import express from 'express';
import { getActiveAnnouncements } from '../controllers/announcementController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

// Get active announcements for students
router.get('/', getActiveAnnouncements);

export default router;
