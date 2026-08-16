// /home/kk/RS/MAIN HUB/backend/src/models/Notification.js

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    enum: ['user', 'company', 'system', 'plan', 'security', 'project', 'task', 'success', 'error', 'warning', 'info'],
    default: 'system'
  },
  read: {
    type: Boolean,
    default: false,
    index: true
  },
  link: {
    type: String,
    default: null
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Compound indexes for faster queries
notificationSchema.index({ userId: 1, read: 1 });
notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, type: 1 });

// Static method for unread count
notificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({ userId, read: false });
};

// Method to mark as read
notificationSchema.methods.markAsRead = async function() {
  this.read = true;
  await this.save();
  return this;
};

module.exports = mongoose.model('Notification', notificationSchema);