import * as adminService from '../services/adminService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getActiveAnnouncements = async (req, res) => {
  try {
    const announcements = await adminService.getAnnouncements(false); // false means student view (only active)
    sendSuccess(res, 'Active announcements retrieved successfully', announcements);
  } catch (error) {
    sendError(res, 500, error.message);
  }
};
