import { z } from 'zod';

export const reportQuerySchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  category: z.string().optional(),
  type: z.enum(['income', 'expense']).optional()
});

export const shareEmailSchema = z.object({
  recipientEmail: z.string().email('Invalid email address').optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in format YYYY-MM').optional()
});
