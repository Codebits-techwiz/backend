import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required').max(50),
  type: z.enum(['income', 'expense'], { required_error: 'Type must be income or expense' }),
  icon: z.string().optional().default('tag'),
  color: z.string().optional().default('#4F46E5')
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  type: z.enum(['income', 'expense']).optional(),
  icon: z.string().optional(),
  color: z.string().optional()
});
