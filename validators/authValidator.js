import { z } from 'zod';

const ACADEMIC_YEARS = ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Graduate'];

const optionalAcademicYear = z.preprocess(
  (v) => (v === '' || v == null ? undefined : v),
  z.enum(ACADEMIC_YEARS).optional()
);

const optionalNonNegNumber = z.preprocess(
  (v) => (v === '' || v == null ? undefined : v),
  z.coerce.number().min(0).optional()
);

export const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  academicYear: optionalAcademicYear,
  monthlyAllowance: optionalNonNegNumber,
  savingsGoal: optionalNonNegNumber,
  currency: z.string().optional()
});
export const loginSchema = z.object({ email: z.string().email(), password: z.string() });
export const forgotPasswordSchema = z.object({ email: z.string().email() });
export const resetPasswordSchema = z.object({ email: z.string().email(), otp: z.string().length(6), newPassword: z.string().min(8) });
export const verifyOtpSchema = z.object({ email: z.string().email(), otp: z.string().length(6) });
export const resendOtpSchema = z.object({ email: z.string().email() });
export const verifyLoginOtpSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  pendingToken: z.string().min(1)
});
export const resendLoginOtpSchema = z.object({
  email: z.string().email(),
  pendingToken: z.string().min(1)
});
