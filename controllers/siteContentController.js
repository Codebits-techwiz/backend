import * as siteContentService from '../services/siteContentService.js';
import { sendSuccess } from '../utils/response.js';

/**
 * Public route to fetch all sections for landing page
 * GET /api/site-content
 */
export const getPublicSiteContent = async (req, res, next) => {
  try {
    const data = await siteContentService.getAllPublicSiteContent();
    return sendSuccess(res, 'Public site content retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * Admin route to get site content
 * GET /api/admin/site-content
 */
export const getAdminSiteContent = async (req, res, next) => {
  try {
    const data = await siteContentService.getAllPublicSiteContent();
    return sendSuccess(res, 'Admin site content retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

/**
 * Admin route to update site content for a specific section
 * PUT /api/admin/site-content/:section
 */
export const updateAdminSiteContent = async (req, res, next) => {
  try {
    const { section } = req.params;
    const updated = await siteContentService.updateSectionContent(section, req.body);
    return sendSuccess(res, `Site content for section '${section}' updated successfully`, updated);
  } catch (error) {
    if (error.name === 'ZodError') {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.errors,
      });
    }
    next(error);
  }
};
