// /home/kk/RS/MAIN HUB/backend/src/routes/settingsRoutes.js

const express = require('express');
const router = express.Router();
const Settings = require('../models/Settings');
const { protect, superAdminOnly } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for logo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/logos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `system-logo-${Date.now()}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PNG, JPEG, SVG, and WEBP are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB limit
  },
  fileFilter: fileFilter
});

// Get system settings
router.get('/', protect, superAdminOnly, async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      // Create default settings if none exist
      settings = await Settings.create({
        platformName: 'RONOSYSTEMS HUB',
        platformEmail: 'support@ronosystems.com',
        timezone: 'Africa/Nairobi',
        currency: 'KES',
        language: 'en',
        primaryColor: '#00d4ff',
        sidebarColor: '#0a0a0a',
        theme: 'light'
      });
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update system settings
router.put('/', protect, superAdminOnly, async (req, res) => {
  try {
    const {
      platformName,
      platformEmail,
      timezone,
      currency,
      language,
      primaryColor,
      sidebarColor,
      theme
    } = req.body;

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    // Update fields
    if (platformName) settings.platformName = platformName;
    if (platformEmail) settings.platformEmail = platformEmail;
    if (timezone) settings.timezone = timezone;
    if (currency) settings.currency = currency;
    if (language) settings.language = language;
    if (primaryColor) settings.primaryColor = primaryColor;
    if (sidebarColor) settings.sidebarColor = sidebarColor;
    if (theme) settings.theme = theme;

    await settings.save();
    res.json({ success: true, data: settings, message: 'Settings updated successfully' });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Upload logo
router.put('/logo', protect, superAdminOnly, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }

    // Delete old logo if exists
    if (settings.logo) {
      const oldFilePath = path.join(__dirname, '..', settings.logo);
      if (fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
        } catch (err) {
          console.error('Error deleting old logo:', err);
        }
      }
    }

    // Update logo
    const logoUrl = `/uploads/logos/${req.file.filename}`;
    settings.logo = logoUrl;
    await settings.save();

    res.json({ 
      success: true, 
      data: settings, 
      message: 'Logo uploaded successfully' 
    });
  } catch (error) {
    console.error('Upload logo error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Remove logo
router.delete('/logo', protect, superAdminOnly, async (req, res) => {
  try {
    const settings = await Settings.findOne();
    if (!settings) {
      return res.status(404).json({ success: false, message: 'Settings not found' });
    }

    // Delete logo file
    if (settings.logo) {
      const filePath = path.join(__dirname, '..', settings.logo);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.error('Error deleting logo:', err);
        }
      }
    }

    settings.logo = '';
    await settings.save();

    res.json({ 
      success: true, 
      data: settings, 
      message: 'Logo removed successfully' 
    });
  } catch (error) {
    console.error('Remove logo error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;