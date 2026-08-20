const Image = require('../models/Image');
const multer = require('multer');

// Memory storage (no disk writing)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images are allowed.'), false);
    }
};

// Multer config
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: fileFilter
});

// Upload image to database
const uploadImage = async (file, entityType, entityId, options = {}) => {
    try {
        if (!file) throw new Error('No file provided');
        if (!file.buffer) throw new Error('Invalid file data');
        
        const image = new Image({
            entityType,
            entityId,
            data: file.buffer,
            contentType: file.mimetype,
            filename: file.originalname || 'image.jpg',
            size: file.size,
            isPrimary: options.isPrimary || false,
            uploadedBy: options.uploadedBy,
            companyId: options.companyId
        });

        // If this is primary, unset other primary images for this entity
        if (options.isPrimary) {
            await Image.updateMany(
                { entityType, entityId, isPrimary: true },
                { isPrimary: false }
            );
        }

        await image.save();
        return image;
    } catch (error) {
        throw new Error(`Failed to upload image: ${error.message}`);
    }
};

// Get image by ID
const getImage = async (imageId) => {
    return await Image.findById(imageId);
};

// Get primary image for entity
const getPrimaryImage = async (entityType, entityId) => {
    return await Image.findOne({ entityType, entityId, isPrimary: true });
};

// Get all images for entity
const getImagesForEntity = async (entityType, entityId) => {
    return await Image.find({ entityType, entityId });
};

// Delete image
const deleteImage = async (imageId) => {
    return await Image.findByIdAndDelete(imageId);
};

// Delete all images for entity
const deleteImagesForEntity = async (entityType, entityId) => {
    return await Image.deleteMany({ entityType, entityId });
};

module.exports = {
    upload,
    uploadImage,
    getImage,
    getPrimaryImage,
    getImagesForEntity,
    deleteImage,
    deleteImagesForEntity
};