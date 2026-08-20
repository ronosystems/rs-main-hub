const express = require('express');
const router = express.Router();
const { upload, uploadImage, getImage, getPrimaryImage, deleteImage } = require('../services/imageService');
const User = require('../models/User');
const Company = require('../models/Company');

// ============================================
// UPLOAD PROFILE PICTURE
// ============================================
router.post('/upload/profile', upload.single('image'), async (req, res) => {
    try {
        console.log('📸 Upload profile request received');
        
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No image file provided' 
            });
        }

        // Get userId from body (temporarily for testing)
        const userId = req.body.userId;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'userId is required'
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Delete old profile picture if exists
        if (user.profilePicture) {
            await deleteImage(user.profilePicture);
        }

        // Upload new image
        const image = await uploadImage(
            req.file,
            'user',
            userId,
            {
                isPrimary: true,
                uploadedBy: userId,
                companyId: user.company
            }
        );

        // Update user with new image reference
        user.profilePicture = image._id;
        await user.save();

        res.status(201).json({
            success: true,
            message: 'Profile picture uploaded successfully',
            data: {
                imageId: image._id,
                imageUrl: `/api/images/${image._id}`
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ============================================
// UPLOAD COMPANY LOGO
// ============================================
router.post('/upload/logo', upload.single('image'), async (req, res) => {
    try {
        console.log('🏢 Upload logo request received');
        
        if (!req.file) {
            return res.status(400).json({ 
                success: false, 
                message: 'No image file provided' 
            });
        }

        const companyId = req.body.companyId;
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'companyId is required'
            });
        }

        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        // Delete old logo if exists
        if (company.logo) {
            await deleteImage(company.logo);
        }

        // Upload new logo
        const image = await uploadImage(
            req.file,
            'company',
            companyId,
            {
                isPrimary: true,
                companyId: companyId
            }
        );

        // Update company with new logo reference
        company.logo = image._id;
        await company.save();

        res.status(201).json({
            success: true,
            message: 'Company logo uploaded successfully',
            data: {
                imageId: image._id,
                imageUrl: `/api/images/${image._id}`
            }
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ============================================
// GET IMAGE BY ID
// ============================================
router.get('/:imageId', async (req, res) => {
    try {
        const image = await getImage(req.params.imageId);
        
        if (!image) {
            return res.status(404).json({
                success: false,
                message: 'Image not found'
            });
        }

        res.set('Content-Type', image.contentType);
        res.set('Cache-Control', 'public, max-age=86400');
        res.send(image.data);
    } catch (error) {
        console.error('Image fetch error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ============================================
// GET PRIMARY IMAGE FOR ENTITY
// ============================================
router.get('/entity/:entityType/:entityId', async (req, res) => {
    try {
        const { entityType, entityId } = req.params;
        const image = await getPrimaryImage(entityType, entityId);
        
        if (!image) {
            return res.status(404).json({
                success: false,
                message: 'No primary image found for this entity'
            });
        }

        res.set('Content-Type', image.contentType);
        res.set('Cache-Control', 'public, max-age=86400');
        res.send(image.data);
    } catch (error) {
        console.error('Entity image fetch error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ============================================
// GET IMAGE AS BASE64 DATA URL
// ============================================
router.get('/dataurl/:imageId', async (req, res) => {
    try {
        const image = await getImage(req.params.imageId);
        
        if (!image) {
            return res.status(404).json({
                success: false,
                message: 'Image not found'
            });
        }

        res.json({
            success: true,
            data: {
                dataUrl: `data:${image.contentType};base64,${image.data.toString('base64')}`
            }
        });
    } catch (error) {
        console.error('Image data URL fetch error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ============================================
// DELETE IMAGE
// ============================================
router.delete('/:imageId', async (req, res) => {
    try {
        const image = await getImage(req.params.imageId);
        
        if (!image) {
            return res.status(404).json({
                success: false,
                message: 'Image not found'
            });
        }

        await deleteImage(req.params.imageId);

        res.json({
            success: true,
            message: 'Image deleted successfully'
        });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;