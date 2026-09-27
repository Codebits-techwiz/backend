import express from 'express';
import multer from 'multer';
import * as aiController from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';
import { validate, validateParams } from '../middleware/validate.js';
import { predictCategorySchema, feedbackSchema, tipIdParamSchema } from '../validators/aiValidator.js';

const uploadMemory = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const router = express.Router();

router.use(protect);

router.post('/predict-category', validate(predictCategorySchema), aiController.predictCategory);
router.post('/feedback', validate(feedbackSchema), aiController.submitCategoryFeedback);
router.get('/monthly-insights', aiController.getMonthlyInsights);
router.get('/monthly-insights/history', aiController.getInsightsHistory);
router.get('/saving-tips', aiController.getSavingTips);
router.post('/saving-tips/:id/pin', validateParams(tipIdParamSchema), aiController.pinSavingTip);
router.post('/saving-tips/:id/dismiss', validateParams(tipIdParamSchema), aiController.dismissSavingTip);
router.get('/forecast', aiController.getForecast);

export default router;
