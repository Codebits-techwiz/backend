import { z } from 'zod';
import { CURRENCIES } from '../config/constants.js';

// Update User Profile Schema
export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50).optional(),
  academicYear: z.string().optional(),
  monthlyAllowanceBaseline: z.number().min(0, 'Allowance cannot be negative').optional(),
  monthlySavingsGoal: z.number().min(0, 'Savings goal cannot be negative').optional(),
  currency: z.enum([CURRENCIES.USD, CURRENCIES.PKR, CURRENCIES.GBP, CURRENCIES.EUR]).optional()
});

// Change Password Schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters')
});

export const twoFactorSchema = z.object({
  enabled: z.boolean()
});
