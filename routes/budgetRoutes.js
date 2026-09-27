import express from 'express';
import * as budgetController from '../controllers/budgetController.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { setBudgetSchema } from '../validators/budgetValidator.js';

const router = express.Router();

router.use(protect);

router.get('/', budgetController.getBudgets);
router.post('/', validate(setBudgetSchema), budgetController.setBudget);
router.delete('/:id', budgetController.deleteBudget);

export default router;
