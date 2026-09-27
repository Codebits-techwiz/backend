import express from 'express';
import * as recurringController from '../controllers/recurringController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createRecurringRuleSchema,
  updateRecurringRuleSchema
} from '../validators/recurringValidator.js';

const router = express.Router();

router.use(protect);

router.get('/', recurringController.getRecurringRules);
router.post('/', validate(createRecurringRuleSchema), recurringController.createRecurringRule);
router.put('/:id', validate(updateRecurringRuleSchema), recurringController.updateRecurringRule);
router.delete('/:id', recurringController.deleteRecurringRule);

export default router;
