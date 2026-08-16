// /home/kk/RS/TRONIC_MASTER/backend/src/middleware/upload.js

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ========== ENSURE UPLOAD DIRECTORIES EXIST ==========
const profilePicturesDir = path.join(__dirname, '../uploads/profile-pictures');
const logosDir = path.join(__dirname, '../uploads/logos');

if (!fs.existsSync(profilePicturesDir)) {
    fs.mkdirSync(profilePicturesDir, { recursive: true });
    console.log('📁 Created profile pictures directory:', profilePicturesDir);
}

if (!fs.existsSync(logosDir)) {
    fs.mkdirSync(logosDir, { recursive: true });
    console.log('📁 Created logos directory:', logosDir);
}

// ========== STORAGE CONFIGURATIONS ==========

// Storage for profile pictures
const profileStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, profilePicturesDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        const userId = req.user?._id || 'unknown';
        cb(null, `profile-${userId}-${uniqueSuffix}${ext}`);
    }
});

// ✅ FIXED: Storage for company logos
const logoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, logosDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        // ✅ Use user ID as the company identifier (simplest approach)
        const userId = req.user?._id || 'unknown';
        cb(null, `logo-${userId}-${uniqueSuffix}${ext}`);
    }
});

// ========== FILE FILTER ==========
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    const isSVG = file.mimetype === 'image/svg+xml' || file.originalname.endsWith('.svg');
    
    if (allowedTypes.includes(file.mimetype) || isSVG) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WEBP, and SVG are allowed.'), false);
    }
};

// ========== MULTER INSTANCES ==========

// For profile pictures (max 5MB)
const profileUpload = multer({
    storage: profileStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
});

// For company logos (max 2MB)
const logoUpload = multer({
    storage: logoStorage,
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: fileFilter
});

// ========== EXPORT ==========
module.exports = {
    profile: profileUpload.single('profilePicture'),
    logo: logoUpload.single('logo'),
    profileUpload: profileUpload,
    logoUpload: logoUpload,
    single: profileUpload.single.bind(profileUpload),
    array: profileUpload.array.bind(profileUpload),
    fields: profileUpload.fields.bind(profileUpload),
    any: profileUpload.any.bind(profileUpload)
};