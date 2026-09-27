import express from 'express';
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from '../controllers/transactionTemplateController.js';
import { requireAuth } from '../middleware/auth.js';

const router = express.Router();

router.use(requireAuth);

import { validate } from '../middleware/validate.js';
import { createTemplateSchema, updateTemplateSchema } from '../validators/transactionValidator.js';

/**
 * @swagger
 * tags:
 *   name: Transaction Templates
 *   description: Quick-entry reusable transaction templates (extra feature)
 *
 * /api/templates:
 *   get:
 *     summary: Get all my quick-entry templates
 *     tags: [Transaction Templates]
 *   post:
 *     summary: Create a quick-entry template
 *     tags: [Transaction Templates]
 *
 * /api/templates/{id}:
 *   put:
 *     summary: Update a template
 *     tags: [Transaction Templates]
 *   delete:
 *     summary: Delete a template
 *     tags: [Transaction Templates]
 */
router.route('/').get(getTemplates).post(validate(createTemplateSchema), createTemplate);
router.route('/:id').put(validate(updateTemplateSchema), updateTemplate).delete(deleteTemplate);

export default router;
