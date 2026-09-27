import { z } from 'zod';

export const createTransactionSchema = z.object({
  category: z.string().min(1, 'Category ID is required'),
  type: z.enum(['income', 'expense'], { required_error: 'Type must be income or expense' }),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().optional().default(''),
  date: z.string().optional(), // ISO date string
  isRecurring: z.boolean().optional().default(false),
  aiSuggestedCategory: z.string().optional()
});

export const updateTransactionSchema = z.object({
  category: z.string().optional(),
  type: z.enum(['income', 'expense']).optional(),
  amount: z.number().positive().optional(),
  description: z.string().optional(),
  date: z.string().optional(),
  isRecurring: z.boolean().optional()
});

export const transactionFilterSchema = z.object({
  search: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  category: z.string().optional(),
  type: z.enum(['income', 'expense']).optional(),
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20')
});

export const createTemplateSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  category: z.string().min(1, 'Category ID is required'),
  type: z.enum(['income', 'expense'], { required_error: 'Type must be income or expense' }),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().optional().default('')
});

export const updateTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().optional(),
  type: z.enum(['income', 'expense']).optional(),
  amount: z.number().positive().optional(),
  description: z.string().optional()
});
