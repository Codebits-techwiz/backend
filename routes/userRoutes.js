import express from 'express';
import { getProfile, updateProfile, changePassword } from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { updateProfileSchema, changePasswordSchema } from '../validators/userValidator.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();
router.use(requireAuth);
router.get('/profile', getProfile);
router.put('/profile', validate(updateProfileSchema), updateProfile);
router.put('/change-password', authLimiter, validate(changePasswordSchema), changePassword);

export default router;