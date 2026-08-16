const express = require('express');
const router = express.Router();
const { 
    protect, 
    authorizeCompany, 
    authorizeLevel,
    superAdminOnly 
} = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
    getCurrentUser,
    getProfile,
    updateProfile,
    uploadProfilePicture,
    removeProfilePicture,
    changePassword,
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    updateUserStatus
} = require('../controllers/userController');

// All routes require authentication
router.use(protect);

// =============== PROFILE ROUTES (Self-service) ===============
// ============================================
// IMPORTANT: /me route MUST come BEFORE /:id
// ============================================

// Get current user (from token) - This is the /me endpoint
router.get('/me', getCurrentUser);

// Update current user profile
router.put('/me', updateProfile);

// Upload profile picture
router.put('/me/picture', upload.single('profilePicture'), uploadProfilePicture);

// Remove profile picture
router.delete('/me/picture', removeProfilePicture);

// Change password
router.put('/me/change-password', changePassword);

// Legacy profile routes (kept for backward compatibility)
router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.put('/profile/picture', upload.single('profilePicture'), uploadProfilePicture);
router.delete('/profile/picture', removeProfilePicture);
router.put('/change-password', changePassword);

// =============== USER MANAGEMENT ROUTES ===============

// Get all users - Company Admin, Manager, and Super Admin can view
router.get('/', authorizeCompany('company_admin', 'company_manager'), getUsers);

// ============================================
// IMPORTANT: /:id route MUST come AFTER all specific routes
// ============================================

// Get single user by ID
router.get('/:id', authorizeCompany('company_admin', 'company_manager'), getUserById);

// ✅ FIXED: Create user - Allow Company Admin AND Manager
// Managers cannot create Admin users (handled in controller)
router.post('/', authorizeCompany('company_admin', 'company_manager'), createUser);

// ✅ FIXED: Update user - Allow Company Admin AND Manager
// Managers cannot update Admin users (handled in controller)
router.put('/:id', authorizeCompany('company_admin', 'company_manager'), updateUser);

// ✅ FIXED: Update user status - Allow Company Admin AND Manager
// Managers cannot update Admin user status (handled in controller)
router.patch('/:id/status', authorizeCompany('company_admin', 'company_manager'), updateUserStatus);

// Delete user - Super Admin only (or Admin + Manager with restrictions)
router.delete('/:id', superAdminOnly, deleteUser);

// ============================================
// ✅ NEW: ASSIGN PRODUCT TO AGENT
// ============================================
router.post('/:userId/assign-product', protect, async (req, res) => {
    try {
        const { userId } = req.params;
        const { productId, unitId } = req.body;
        const currentUser = req.user;

        console.log('📱 Assign product request:');
        console.log('   User ID:', userId);
        console.log('   Product ID:', productId);
        console.log('   Unit ID:', unitId);
        console.log('   Assigned by:', currentUser.email);

        // Only Admin and Manager can assign products
        if (currentUser.companyRole !== 'company_admin' && currentUser.companyRole !== 'company_manager') {
            return res.status(403).json({
                success: false,
                message: 'Only admins and managers can assign products to agents'
            });
        }

        // Find the user (agent)
        const User = require('../models/User');
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Only agents should get product assignments
        if (user.companyRole !== 'company_agent') {
            return res.status(400).json({
                success: false,
                message: 'Only agents can have assigned products'
            });
        }

        // Check if product exists
        const Product = require('../models/Product');
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        // Initialize assignedPhones if not exists
        if (!user.assignedPhones) {
            user.assignedPhones = [];
        }

        // Add product to assignedPhones if not already there
        if (!user.assignedPhones.includes(productId)) {
            user.assignedPhones.push(productId);
            await user.save();
            console.log(`✅ Product ${product.brand} ${product.model} assigned to agent ${user.name}`);
        } else {
            console.log(`📱 Product already assigned to agent ${user.name}`);
        }

        // Also update the unit's assignedTo if unitId is provided
        if (unitId) {
            // Find the product and update the specific unit
            const productDoc = await Product.findById(productId);
            if (productDoc) {
                const unitIndex = productDoc.units.findIndex(u => u.identifier === unitId || u._id.toString() === unitId);
                if (unitIndex !== -1) {
                    productDoc.units[unitIndex].assignedTo = userId;
                    productDoc.units[unitIndex].assignedToType = 'user';
                    productDoc.units[unitIndex].assignedAt = new Date();
                    productDoc.units[unitIndex].assignedBy = currentUser._id;
                    productDoc.markModified('units');
                    await productDoc.save();
                    console.log(`✅ Unit ${unitId} assigned to agent ${user.name}`);
                }
            }
        }

        res.json({
            success: true,
            message: `Product assigned to ${user.name} successfully`,
            data: {
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    assignedPhones: user.assignedPhones
                },
                product: {
                    id: product._id,
                    brand: product.brand,
                    model: product.model
                }
            }
        });
    } catch (error) {
        console.error('Error assigning product:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to assign product',
            error: error.message
        });
    }
});

module.exports = router;