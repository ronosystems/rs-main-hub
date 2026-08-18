// /home/kk/RS/MAIN HUB/backend/src/models/Settings.js

const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  platformName: {
    type: String,
    default: 'RONOSYSTEMS HUB'
  },
  platformEmail: {
    type: String,
    default: 'support@ronosystems.com'
  },
  timezone: {
    type: String,
    default: 'Africa/Nairobi'
  },
  currency: {
    type: String,
    default: 'KES'
  },
  language: {
    type: String,
    default: 'en'
  },
  primaryColor: {
    type: String,
    default: '#00d4ff'
  },
  sidebarColor: {
    type: String,
    default: '#0a0a0a'
  },
  theme: {
    type: String,
    enum: ['light', 'dark', 'auto'],
    default: 'light'
  },
  logo: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Settings', SettingsSchema);