import { Notification } from '../models/Notification.js';

export const getUserNotifications = async (userId) => {
  const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(50);
  const unreadCount = await Notification.countDocuments({ user: userId, isRead: false });

  return {
    unreadCount,
    notifications
  };
};

export const markNotificationAsRead = async (userId, notificationId) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, user: userId },
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    const error = new Error('Notification not found');
    error.statusCode = 404;
    throw error;
  }

  return notification;
};

export const createNotification = async (userId, title, message, type = 'system') => {
  return await Notification.create({
    user: userId,
    title,
    message,
    type
  });
};
