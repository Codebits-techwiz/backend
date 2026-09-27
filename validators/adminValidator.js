import { z } from 'zod';

// ─── Category ────────────────────────────────────────────────────────────────
export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['income', 'expense']),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

export const deleteCategorySchema = z.object({
  // Optional: reassign transactions to this category before deleting
  reassignTo: z.string().optional(),
});

// ─── Announcement ────────────────────────────────────────────────────────────
export const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  isActive: z.boolean().optional().default(true),
});

export const updateAnnouncementSchema = createAnnouncementSchema.partial();

export const toggleAnnouncementSchema = z.object({
  isActive: z.boolean({ required_error: 'isActive (boolean) is required' }),
});

// ─── User ─────────────────────────────────────────────────────────────────────
export const userStatusSchema = z.object({
  isActive: z.boolean({ required_error: 'isActive (boolean) is required' }),
});

// ─── Tip Template ─────────────────────────────────────────────────────────────
export const createTipTemplateSchema = z.object({
  ruleType: z.enum(['spending_spike', 'budget_warning', 'savings_goal_at_risk']),
  template: z.string().min(1, 'Template text is required'),
  isActive: z.boolean().optional().default(true),
});

export const updateTipTemplateSchema = createTipTemplateSchema.partial();
