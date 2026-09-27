import express from 'express';
import * as reportController from '../controllers/reportController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { shareEmailSchema } from '../validators/reportValidator.js';

const router = express.Router();

router.use(protect);

router.get('/category-breakdown', reportController.getCategoryBreakdown);
router.get('/trend-6months', reportController.getTrend6Months);
router.get('/daily-weekly', reportController.getDailyWeekly);
router.get('/export-pdf', reportController.exportPdf);
router.post('/share-email', validate(shareEmailSchema), reportController.shareEmail);

export default router;
