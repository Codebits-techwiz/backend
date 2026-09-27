import { z } from 'zod';

export const predictCategorySchema = z.object({
  description: z.string().min(1, 'Description is required')
});

export const feedbackSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  correctedCategoryId: z.string().min(1, 'Corrected category ID is required')
});

export const monthQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in format YYYY-MM').optional()
});

export const tipIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid Tip ID')
});
