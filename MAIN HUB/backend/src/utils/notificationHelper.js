// /home/kk/RS/MAIN HUB/backend/src/utils/notificationHelper.js

const Notification = require('../models/Notification');

/**
 * Create a notification for a user
 */
const createNotification = async (userId, title, message, type = 'system', metadata = {}, link = null) => {
  try {
    const notification = new Notification({
      userId,
      title,
      message,
      description: message,
      type,
      link,
      metadata,
      read: false
    });
    
    await notification.save();
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

/**
 * Create notifications for multiple users
 */
const createBulkNotifications = async (userId, notifications) => {
  try {
    const notificationDocs = notifications.map(notif => ({
      userId,
      ...notif
    }));
    
    const result = await Notification.insertMany(notificationDocs);
    return result;
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    return null;
  }
};

/**
 * Get unread count for a user
 */
const getUnreadCount = async (userId) => {
  try {
    return await Notification.getUnreadCount(userId);
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

module.exports = {
  createNotification,
  createBulkNotifications,
  getUnreadCount
};