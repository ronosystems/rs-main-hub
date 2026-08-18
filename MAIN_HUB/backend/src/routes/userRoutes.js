const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, superAdminOnly, adminOrAbove, authorize } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ============================================
// MULTER CONFIGURATION FOR FILE UPLOADS
// ============================================

// Configure storage for profile pictures
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/profile-pictures');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const userId = req.user?.id || req.params?.id || 'unknown';
    cb(null, `profile-${userId}-${uniqueSuffix}${ext}`);
  }
});

// File filter for images only
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WEBP, and SVG are allowed.'), false);
  }
};

// Multer upload middleware
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

// ============================================
// PROFILE MANAGEMENT ROUTES (Self-service)
// ============================================

// Get current user profile
router.get('/profile/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password')
      .populate('company', 'name code')
      .populate('project', 'name code');
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update current user profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name, phone, department } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (department) user.department = department;
    
    await user.save();
    
    const updatedUser = await User.findById(user._id)
      .select('-password')
      .populate('company', 'name code')
      .populate('project', 'name code');
    
    res.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Upload profile picture
router.put('/profile/picture', protect, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.profilePicture) {
      const oldFilePath = path.join(__dirname, '..', user.profilePicture);
      if (fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
          console.log(`Deleted old profile picture: ${oldFilePath}`);
        } catch (err) {
          console.error('Error deleting old profile picture:', err);
        }
      }
    }

    const profilePictureUrl = `/uploads/profile-pictures/${req.file.filename}`;
    user.profilePicture = profilePictureUrl;
    await user.save();

    const updatedUser = await User.findById(user._id)
      .select('-password')
      .populate('company', 'name code')
      .populate('project', 'name code');

    res.json({ 
      success: true, 
      data: updatedUser, 
      message: 'Profile picture updated successfully' 
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// Remove profile picture
router.delete('/profile/picture', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.profilePicture) {
      const filePath = path.join(__dirname, '..', user.profilePicture);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log(`Deleted profile picture: ${filePath}`);
        } catch (err) {
          console.error('Error deleting profile picture:', err);
        }
      }
    }

    user.profilePicture = '';
    await user.save();

    const updatedUser = await User.findById(user._id)
      .select('-password')
      .populate('company', 'name code')
      .populate('project', 'name code');

    res.json({ 
      success: true, 
      data: updatedUser, 
      message: 'Profile picture removed successfully' 
    });
  } catch (error) {
    console.error('Error removing profile picture:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Change password
router.put('/profile/password', protect, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Current password and new password are required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const bcrypt = require('bcryptjs');
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// USER MANAGEMENT ROUTES
// ============================================

// ✅ GET ALL USERS
router.get('/', protect, async (req, res) => {
    try {
        const currentUser = req.user;
        let query = {};

        console.log('👤 User list request from:', currentUser.email, 'Role:', currentUser.role);

        if (currentUser.role === 'super_admin') {
            query = {};
            console.log('👑 Super Admin - Showing all users');
        } 
        else if (currentUser.role === 'admin') {
            query = {
                role: { $ne: 'super_admin' }
            };
            console.log('👤 Admin - Showing all users except super_admin');
        }
        else if (currentUser.role === 'manager') {
            query = {
                role: { $in: ['staff', 'guest'] }
            };
            console.log('👤 Manager - Showing staff and guests');
        }
        else {
            query = { _id: currentUser._id };
            console.log('👤 Staff/Guest - Showing only self');
        }

        const users = await User.find(query)
            .select('-password')
            .populate('company', 'name code')
            .populate('project', 'name code')
            .sort({ createdAt: -1 });

        console.log(`📊 Found ${users.length} users for role ${currentUser.role}`);

        res.json({ success: true, data: users });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get single user
router.get('/:id', protect, async (req, res) => {
    try {
        const userId = req.params.id;
        const currentUser = req.user;
        
        // Users can access their own profile
        if (req.user.id === userId) {
            const user = await User.findById(userId)
                .select('-password')
                .populate('company', 'name code')
                .populate('project', 'name code');
                
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found' });
            }
            return res.json({ success: true, data: user });
        }
        
        let query = { _id: userId };
        
        if (currentUser.role === 'super_admin') {
            // No additional filter
        } 
        else if (currentUser.role === 'admin') {
            query.role = { $ne: 'super_admin' };
        } 
        else if (currentUser.role === 'manager') {
            query.role = { $in: ['staff', 'guest'] };
        } 
        else {
            return res.status(403).json({ 
                success: false, 
                message: 'Access denied' 
            });
        }
        
        const user = await User.findOne(query)
            .select('-password')
            .populate('company', 'name code')
            .populate('project', 'name code');
            
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, data: user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ✅ CREATE USER - Super Admin only
router.post('/', protect, superAdminOnly, async (req, res) => {
    try {
        const { 
            name, 
            email, 
            password, 
            role, 
            project, 
            company, 
            phone, 
            projectRole,
            companyRole 
        } = req.body;
        
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ 
                success: false, 
                message: 'User with this email already exists' 
            });
        }
        
        // Admin can only create managers, staff, guests
        if (req.user.role === 'admin' && !['manager', 'staff', 'guest'].includes(role)) {
            return res.status(403).json({
                success: false,
                message: 'Admin can only create Manager, Staff, or Guest users'
            });
        }
        
        const userData = {
            name,
            email,
            password,
            role: role || 'guest',
            project: project || null,
            company: company || null,
            phone: phone || '',
            projectRole: projectRole || 'staff'
        };

        // ✅ Add companyRole only for guest users (project users)
        if (companyRole && (role === 'guest' || !role)) {
            const validRoles = ['company_admin', 'company_manager', 'company_cashier', 'company_agent', 'company_staff'];
            if (validRoles.includes(companyRole)) {
                userData.companyRole = companyRole;
            }
        }

        const user = new User(userData);
        await user.save();
        
        const userDataResponse = await User.findById(user._id)
            .select('-password')
            .populate('company', 'name code')
            .populate('project', 'name code');
            
        res.status(201).json({ success: true, data: userDataResponse });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// ✅ UPDATE USER - Super Admin only
router.put('/:id', protect, superAdminOnly, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        const { 
            name, 
            email, 
            role, 
            project, 
            company, 
            phone, 
            isActive, 
            settings, 
            projectRole,
            companyRole 
        } = req.body;
        
        // Admin cannot change role to super_admin
        if (req.user.role === 'admin') {
            if (role === 'super_admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Admin cannot assign Super Admin role'
                });
            }
            if (role && !['manager', 'staff', 'guest'].includes(role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Admin can only assign Manager, Staff, or Guest roles'
                });
            }
        }
        
        if (name) user.name = name;
        if (email) user.email = email;
        if (role) user.role = role;
        if (project) user.project = project;
        if (company) user.company = company;
        if (phone) user.phone = phone;
        if (projectRole !== undefined) user.projectRole = projectRole;
        if (isActive !== undefined) user.isActive = isActive;
        if (settings) user.settings = { ...user.settings, ...settings };
        
        // ✅ Update companyRole (only for guest users)
        if (companyRole && user.role === 'guest') {
            const validRoles = ['company_admin', 'company_manager', 'company_cashier', 'company_agent', 'company_staff'];
            if (validRoles.includes(companyRole)) {
                user.companyRole = companyRole;
            }
        }
        
        await user.save();
        
        const updatedUser = await User.findById(user._id)
            .select('-password')
            .populate('company', 'name code')
            .populate('project', 'name code');
            
        res.json({ success: true, data: updatedUser });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Delete user (Super Admin only)
router.delete('/:id', protect, superAdminOnly, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        // Admin cannot delete super_admin
        if (req.user.role === 'admin' && user.role === 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Admin cannot delete Super Admin users'
            });
        }
        
        // Delete profile picture if exists
        if (user.profilePicture) {
            const filePath = path.join(__dirname, '..', user.profilePicture);
            if (fs.existsSync(filePath)) {
                try {
                    fs.unlinkSync(filePath);
                    console.log(`Deleted profile picture for user ${user.email}: ${filePath}`);
                } catch (err) {
                    console.error('Error deleting profile picture:', err);
                }
            }
        }
        
        await user.deleteOne();
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Update user status (Super Admin only)
router.patch('/:id/status', protect, superAdminOnly, async (req, res) => {
    try {
        const { isActive } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isActive },
            { new: true }
        )
        .select('-password')
        .populate('company', 'name code')
        .populate('project', 'name code');
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.json({ success: true, data: user });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get users by company (Super Admin only)
router.get('/company/:companyId', protect, superAdminOnly, async (req, res) => {
    try {
        const users = await User.find({ 
            company: req.params.companyId, 
            isActive: true 
        })
        .select('-password')
        .populate('company', 'name code')
        .populate('project', 'name code');
        
        res.json({ success: true, data: users });
    } catch (error) {
        console.error('Get users by company error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Get users by project (Super Admin only)
router.get('/project/:projectId', protect, superAdminOnly, async (req, res) => {
    try {
        const users = await User.find({ 
            project: req.params.projectId, 
            isActive: true 
        })
        .select('-password')
        .populate('company', 'name code')
        .populate('project', 'name code');
        
        res.json({ success: true, data: users });
    } catch (error) {
        console.error('Get users by project error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Upload profile picture for any user (Super Admin only)
router.put('/:id/picture', protect, superAdminOnly, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.profilePicture) {
      const oldFilePath = path.join(__dirname, '..', user.profilePicture);
      if (fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
          console.log(`Deleted old profile picture for user ${user.email}: ${oldFilePath}`);
        } catch (err) {
          console.error('Error deleting old profile picture:', err);
        }
      }
    }

    const profilePictureUrl = `/uploads/profile-pictures/${req.file.filename}`;
    user.profilePicture = profilePictureUrl;
    await user.save();

    const updatedUser = await User.findById(user._id)
      .select('-password')
      .populate('company', 'name code')
      .populate('project', 'name code');

    res.json({ 
      success: true, 
      data: updatedUser, 
      message: 'Profile picture updated successfully' 
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

// ============================================
// ✅ SYNC COMPANY ROLE - New endpoint
// ============================================
router.put('/sync-company-role', protect, superAdminOnly, async (req, res) => {
    try {
        const { email, companyRole } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Only guest users (project users) can have companyRole
        if (user.role !== 'guest') {
            return res.status(400).json({
                success: false,
                message: 'Only project users (guest role) can have companyRole'
            });
        }

        const validRoles = ['company_admin', 'company_manager', 'company_cashier', 'company_agent', 'company_staff'];
        const finalRole = companyRole || 'company_staff';
        
        if (!validRoles.includes(finalRole)) {
            return res.status(400).json({
                success: false,
                message: `Invalid company role. Must be one of: ${validRoles.join(', ')}`
            });
        }

        const oldRole = user.companyRole;
        user.companyRole = finalRole;
        user.updatedAt = new Date();
        await user.save();

        res.status(200).json({
            success: true,
            message: `Company role updated from ${oldRole || 'not set'} to ${finalRole}`,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                oldRole: oldRole,
                newRole: finalRole,
                company: user.company
            }
        });
    } catch (error) {
        console.error('Sync company role error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;