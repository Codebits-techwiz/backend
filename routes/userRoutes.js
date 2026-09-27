import express from 'express';
import { getProfile, updateProfile, changePassword, uploadAvatar, updateTwoFactor } from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema, changePasswordSchema, twoFactorSchema } from '../validators/userValidator.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { handleAvatarUpload } from '../middleware/upload.js';

const router = express.Router();
router.use(requireAuth);
router.get('/profile', getProfile);
router.put('/profile', validate(updateProfileSchema), updateProfile);
router.post('/profile/avatar', handleAvatarUpload, uploadAvatar);
router.put('/change-password', authLimiter, validate(changePasswordSchema), changePassword);
router.put('/two-factor', validate(twoFactorSchema), updateTwoFactor);

export default router;