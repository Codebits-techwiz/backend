import { getRecentActivity } from '../services/activityService.js';
import { sendSuccess } from '../utils/response.js';

/**
 * GET /api/activity/recent
 * Returns the user's last 10 distinct recently-touched transactions,
 * newest first, with deleted transactions silently omitted.
 */
export const getRecent = async (req, res, next) => {
  try {
    const items = await getRecentActivity(req.user.id);
    sendSuccess(res, 'Recent activity retrieved', items);
  } catch (error) {
    next(error);
  }
};
