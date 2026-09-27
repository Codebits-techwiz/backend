import express from 'express';
import { getBookmarks, createBookmark, updateBookmark, deleteBookmark } from '../controllers/bookmarkController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

/**
 * @swagger
 * tags:
 *   name: Bookmarks
 *   description: Bookmark saved Tips or Insights for quick access
 *
 * /api/bookmarks:
 *   get:
 *     summary: Get all my bookmarks (with populated tip/insight)
 *     tags: [Bookmarks]
 *     responses:
 *       200:
 *         description: List of bookmarks with embedded ref document
 *
 *   post:
 *     summary: Bookmark a tip or insight
 *     tags: [Bookmarks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refType, refId]
 *             properties:
 *               refType:
 *                 type: string
 *                 enum: [tip, insight]
 *               refId:
 *                 type: string
 *                 description: ObjectId of the tip or insight to bookmark
 *               note:
 *                 type: string
 *                 description: Optional personal note (max 500 chars)
 *     responses:
 *       201:
 *         description: Bookmark created
 *       404:
 *         description: Referenced tip/insight not found or not yours
 *       409:
 *         description: Already bookmarked this item
 *
 * /api/bookmarks/{id}:
 *   patch:
 *     summary: Edit the note on a bookmark
 *     tags: [Bookmarks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [note]
 *             properties:
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bookmark updated
 *       404:
 *         description: Bookmark not found
 *
 *   delete:
 *     summary: Delete a bookmark
 *     tags: [Bookmarks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Bookmark deleted
 *       404:
 *         description: Bookmark not found
 */

router.route('/').get(getBookmarks).post(createBookmark);
router.route('/:id').patch(updateBookmark).delete(deleteBookmark);

export default router;
