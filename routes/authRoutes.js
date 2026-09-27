import express from 'express';
import {
  register,
  verifyOtp,
  resendOtp,
  login,
  verifyLoginOtp,
  resendLoginOtp,
  adminLogin,
  logout,
  forgotPassword,
  resetPassword
} from '../controllers/authController.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import {
  registerSchema,
  verifyOtpSchema,
  resendOtpSchema,
  loginSchema,
  verifyLoginOtpSchema,
  resendLoginOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '../validators/authValidator.js';

const router = express.Router();

router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/verify-otp', authLimiter, validate(verifyOtpSchema), verifyOtp);
router.post('/resend-otp', authLimiter, validate(resendOtpSchema), resendOtp);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/verify-login-otp', authLimiter, validate(verifyLoginOtpSchema), verifyLoginOtp);
router.post('/resend-login-otp', authLimiter, validate(resendLoginOtpSchema), resendLoginOtp);
router.post('/admin-login', authLimiter, validate(loginSchema), adminLogin);
router.post('/logout', authLimiter, logout);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);

export default router;