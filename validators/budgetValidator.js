import { z } from 'zod';

export const setBudgetSchema = z.object({
  category: z.string().min(1, 'Category ID is required'),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in format YYYY-MM (e.g., 2026-09)'),
  limitAmount: z.number().positive('Limit amount must be greater than 0')
});

export const budgetQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in format YYYY-MM').optional()
});
