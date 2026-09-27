import * as notificationService from '../services/notificationService.js';
import { sendSuccess } from '../utils/response.js';

export const getNotifications = async (req, res, next) => {
  try {
    const data = await notificationService.getUserNotifications(req.user.id);
    return sendSuccess(res, 'Notifications retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

export const markRead = async (req, res, next) => {
  try {
    const updated = await notificationService.markNotificationAsRead(req.user.id, req.params.id);
    return sendSuccess(res, 'Notification marked as read', updated);
  } catch (error) {
    next(error);
  }
};
