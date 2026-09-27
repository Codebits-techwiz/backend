import express from 'express';
import { getRecent } from '../controllers/activityController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   name: Activity
 *   description: Recently viewed and edited transactions
 *
 * /api/activity/recent:
 *   get:
 *     summary: Last 10 distinct transactions the user viewed, created, or edited
 *     tags: [Activity]
 *     description: >
 *       Deduplicates by entityId (only the most recent action per transaction),
 *       newest first. Soft-deleted transactions are silently omitted.
 *     responses:
 *       200:
 *         description: Array of activity items with populated transaction details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       logId: { type: string }
 *                       action:
 *                         type: string
 *                         enum: [view, create, edit]
 *                       at: { type: string, format: date-time }
 *                       transaction:
 *                         type: object
 *                         description: Full transaction document with populated category
 */
router.get('/recent', getRecent);

export default router;
