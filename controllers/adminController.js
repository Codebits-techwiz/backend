import * as adminService from '../services/adminService.js';
import { sendSuccess, sendError } from '../utils/response.js';
import {
  createCategorySchema, updateCategorySchema, deleteCategorySchema,
  createAnnouncementSchema, updateAnnouncementSchema, toggleAnnouncementSchema,
  userStatusSchema,
  createTipTemplateSchema, updateTipTemplateSchema,
} from '../validators/adminValidator.js';

// ─── Stats ────────────────────────────────────────────────────────────────────
export const getStats = async (req, res) => {
  try {
    sendSuccess(res, 'System stats retrieved', await adminService.getSystemStats());
  } catch (e) { sendError(res, 500, e.message); }
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const getUsers = async (req, res) => {
  try {
    sendSuccess(res, 'Users retrieved', await adminService.getUsers());
  } catch (e) { sendError(res, 500, e.message); }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = userStatusSchema.parse(req.body);
    const user = await adminService.updateUserStatus(req.params.id, isActive);
    sendSuccess(res, 'User status updated', { id: user._id, isActive: user.isActive });
  } catch (e) {
    if (e.name === 'ZodError') return sendError(res, 400, 'Validation failed', e.errors);
    sendError(res, e.statusCode || 500, e.message);
  }
};

export const resetUserPassword = async (req, res) => {
  try {
    const result = await adminService.resetStudentPassword(req.params.id);
    // Return temp password ONCE — never return any hash
    sendSuccess(res, 'Temporary password generated. Share it with the student securely.', {
      email: result.email,
      temporaryPassword: result.tempPassword,
    });
  } catch (e) { sendError(res, e.statusCode || 500, e.message); }
};

// ─── Categories ───────────────────────────────────────────────────────────────
export const createSystemCategory = async (req, res) => {
  try {
    const data = createCategorySchema.parse(req.body);
    const category = await adminService.createSystemCategory(data);
    sendSuccess(res, 'System category created', category, 201);
  } catch (e) {
    if (e.name === 'ZodError') return sendError(res, 400, 'Validation failed', e.errors);
    sendError(res, e.statusCode || 500, e.message);
  }
};

export const updateSystemCategory = async (req, res) => {
  try {
    const data = updateCategorySchema.parse(req.body);
    const category = await adminService.updateSystemCategory(req.params.id, data);
    sendSuccess(res, 'System category updated', category);
  } catch (e) {
    if (e.name === 'ZodError') return sendError(res, 400, 'Validation failed', e.errors);
    sendError(res, e.statusCode || 500, e.message);
  }
};

export const deleteSystemCategory = async (req, res) => {
  try {
    // reassignTo comes as a query param: DELETE /admin/categories/:id?reassignTo=<id>
    const { reassignTo } = deleteCategorySchema.parse(req.query);
    const result = await adminService.deleteSystemCategory(req.params.id, reassignTo);
    sendSuccess(res, 'System category deleted', result);
  } catch (e) {
    if (e.name === 'ZodError') return sendError(res, 400, 'Validation failed', e.errors);
    sendError(res, e.statusCode || 500, e.message);
  }
};

// ─── Announcements ────────────────────────────────────────────────────────────
export const createAnnouncement = async (req, res) => {
  try {
    const data = createAnnouncementSchema.parse(req.body);
    const announcement = await adminService.createAnnouncement(req.user.id, data);
    sendSuccess(res, 'Announcement created', announcement, 201);
  } catch (e) {
    if (e.name === 'ZodError') return sendError(res, 400, 'Validation failed', e.errors);
    sendError(res, e.statusCode || 500, e.message);
  }
};

export const getAdminAnnouncements = async (req, res) => {
  try {
    sendSuccess(res, 'Announcements retrieved', await adminService.getAnnouncements(true));
  } catch (e) { sendError(res, 500, e.message); }
};

export const updateAnnouncement = async (req, res) => {
  try {
    const data = updateAnnouncementSchema.parse(req.body);
    const announcement = await adminService.updateAnnouncement(req.params.id, data);
    sendSuccess(res, 'Announcement updated', announcement);
  } catch (e) {
    if (e.name === 'ZodError') return sendError(res, 400, 'Validation failed', e.errors);
    sendError(res, e.statusCode || 500, e.message);
  }
};

export const toggleAnnouncement = async (req, res) => {
  try {
    const { isActive } = toggleAnnouncementSchema.parse(req.body);
    const announcement = await adminService.updateAnnouncement(req.params.id, { isActive });
    sendSuccess(res, `Announcement ${isActive ? 'activated' : 'deactivated'}`, announcement);
  } catch (e) {
    if (e.name === 'ZodError') return sendError(res, 400, 'Validation failed', e.errors);
    sendError(res, e.statusCode || 500, e.message);
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    await adminService.deleteAnnouncement(req.params.id);
    sendSuccess(res, 'Announcement deleted');
  } catch (e) { sendError(res, e.statusCode || 500, e.message); }
};

// ─── Tip Templates ────────────────────────────────────────────────────────────
export const getTipTemplates = async (req, res) => {
  try {
    sendSuccess(res, 'Tip templates retrieved', await adminService.getTipTemplates());
  } catch (e) { sendError(res, 500, e.message); }
};

export const createTipTemplate = async (req, res) => {
  try {
    const data = createTipTemplateSchema.parse(req.body);
    const template = await adminService.createTipTemplate(data);
    sendSuccess(res, 'Tip template created', template, 201);
  } catch (e) {
    if (e.name === 'ZodError') return sendError(res, 400, 'Validation failed', e.errors);
    sendError(res, e.statusCode || 500, e.message);
  }
};

export const updateTipTemplate = async (req, res) => {
  try {
    const data = updateTipTemplateSchema.parse(req.body);
    const template = await adminService.updateTipTemplate(req.params.id, data);
    sendSuccess(res, 'Tip template updated', template);
  } catch (e) {
    if (e.name === 'ZodError') return sendError(res, 400, 'Validation failed', e.errors);
    sendError(res, e.statusCode || 500, e.message);
  }
};

export const deleteTipTemplate = async (req, res) => {
  try {
    await adminService.deleteTipTemplate(req.params.id);
    sendSuccess(res, 'Tip template deleted');
  } catch (e) { sendError(res, e.statusCode || 500, e.message); }
};
