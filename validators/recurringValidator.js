import { z } from 'zod';

export const createRecurringRuleSchema = z.object({
  category: z.string().min(1, 'Category ID is required'),
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().optional().default(''),
  frequency: z.enum(['weekly', 'monthly']),
  nextRunDate: z.string().optional()
});

export const updateRecurringRuleSchema = z.object({
  category: z.string().optional(),
  type: z.enum(['income', 'expense']).optional(),
  amount: z.number().positive().optional(),
  description: z.string().optional(),
  frequency: z.enum(['weekly', 'monthly']).optional(),
  nextRunDate: z.string().optional(),
  isActive: z.boolean().optional()
});
