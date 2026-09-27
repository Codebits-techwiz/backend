import express from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  getStats, getUsers, updateUserStatus, resetUserPassword,
  createSystemCategory, updateSystemCategory, deleteSystemCategory,
  createAnnouncement, getAdminAnnouncements, updateAnnouncement, toggleAnnouncement, deleteAnnouncement,
  getTipTemplates, createTipTemplate, updateTipTemplate, deleteTipTemplate,
} from '../controllers/adminController.js';

// Guard: only admin role can access any route in this file
const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  res.status(403).json({ success: false, error: 'Forbidden: Admin access required' });
};

const router = express.Router();
router.use(requireAuth);
router.use(requireAdmin);

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only management endpoints
 *
 * /api/admin/stats:
 *   get:
 *     summary: Platform-wide stats (active users, volume, top categories)
 *     tags: [Admin]
 *
 * /api/admin/users:
 *   get:
 *     summary: List all student accounts (no transaction data)
 *     tags: [Admin]
 *
 * /api/admin/users/{id}/status:
 *   patch:
 *     summary: Enable or disable a student account
 *     tags: [Admin]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [isActive]
 *             properties:
 *               isActive: { type: boolean }
 *
 * /api/admin/users/{id}/reset-password:
 *   post:
 *     summary: Generate a one-time temporary password for a student
 *     tags: [Admin]
 *     description: Returns the plain temp password ONCE. Never returns a hash.
 *
 * /api/admin/categories:
 *   post:
 *     summary: Create a new system-default category
 *     tags: [Admin]
 *
 * /api/admin/categories/{id}:
 *   put:
 *     summary: Update a system-default category
 *     tags: [Admin]
 *   delete:
 *     summary: Delete a system-default category
 *     tags: [Admin]
 *     parameters:
 *       - in: query
 *         name: reassignTo
 *         schema: { type: string }
 *         description: Category ID to migrate existing transactions to before deleting
 *
 * /api/admin/announcements:
 *   get:
 *     summary: List all announcements (admin sees inactive ones too)
 *     tags: [Admin]
 *   post:
 *     summary: Create announcement
 *     tags: [Admin]
 *
 * /api/admin/announcements/{id}:
 *   put:
 *     summary: Full update of an announcement
 *     tags: [Admin]
 *   patch:
 *     summary: Toggle isActive on an announcement
 *     tags: [Admin]
 *   delete:
 *     summary: Delete an announcement
 *     tags: [Admin]
 *
 * /api/admin/tip-templates:
 *   get:
 *     summary: List all tip templates
 *     tags: [Admin]
 *   post:
 *     summary: Create a tip template
 *     tags: [Admin]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [ruleType, template]
 *             properties:
 *               ruleType:
 *                 type: string
 *                 enum: [spending_spike, budget_warning, savings_goal_at_risk]
 *               template:
 *                 type: string
 *                 description: "Use {category}, {excess}, {remaining}, {deficit} as placeholders"
 *               isActive: { type: boolean }
 *
 * /api/admin/tip-templates/{id}:
 *   put:
 *     summary: Update a tip template
 *     tags: [Admin]
 *   delete:
 *     summary: Delete a tip template
 *     tags: [Admin]
 */

import { getAdminSiteContent, updateAdminSiteContent } from '../controllers/siteContentController.js';

// Platform stats
router.get('/stats', getStats);

// Users
router.get('/users', getUsers);
router.patch('/users/:id/status', updateUserStatus);
router.post('/users/:id/reset-password', resetUserPassword);

// System Categories
router.post('/categories', createSystemCategory);
router.put('/categories/:id', updateSystemCategory);
router.delete('/categories/:id', deleteSystemCategory);

// Announcements
router.get('/announcements', getAdminAnnouncements);
router.post('/announcements', createAnnouncement);
router.put('/announcements/:id', updateAnnouncement);
router.patch('/announcements/:id', toggleAnnouncement);   // toggle isActive only
router.delete('/announcements/:id', deleteAnnouncement);

// Tip Templates
router.get('/tip-templates', getTipTemplates);
router.post('/tip-templates', createTipTemplate);
router.put('/tip-templates/:id', updateTipTemplate);
router.delete('/tip-templates/:id', deleteTipTemplate);

// Site Content (Landing page CMS)
router.get('/site-content', getAdminSiteContent);
router.put('/site-content/:section', updateAdminSiteContent);

export default router;
