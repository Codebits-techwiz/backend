import express from 'express';
import { getPublicSiteContent } from '../controllers/siteContentController.js';

const router = express.Router();

/**
 * @swagger
 * /api/site-content:
 *   get:
 *     summary: Public landing page site content
 *     tags: [SiteContent]
 */
router.get('/', getPublicSiteContent);

export default router;
