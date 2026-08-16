const User = require('../models/User');
const Branch = require('../models/Branch');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

// ========== COMPANY ROLE PERMISSIONS ==========
const ROLE_PERMISSIONS = {
    company_admin: {
        canManageUsers: true,
        canManageProducts: true,
        canManageSales: true,
        canViewReports: true,
        canManageBranches: true,
        level: 5,
        label: 'Company Admin',
        icon: '👑'
    },
    company_manager: {
        canManageUsers: true,  // ✅ Changed to true
        canManageProducts: true,
        canManageSales: true,
        canViewReports: true,
        canManageBranches: false,
        level: 4,
        label: 'Company Manager',
        icon: '👔'
    },
    company_cashier: {
        canManageUsers: false,
        canManageProducts: false,
        canManageSales: true,
        canViewReports: false,
        canManageBranches: false,
        level: 3,
        label: 'Company Cashier',
        icon: '💳'
    },
    company_agent: {
        canManageUsers: false,
        canManageProducts: false,
        canManageSales: true,
        canViewReports: false,
        canManageBranches: false,
        level: 2,
        label: 'Company Agent',
        icon: '🤝'
    },
    company_staff: {
        canManageUsers: false,
        canManageProducts: false,
        canManageSales: false,
        canViewReports: false,
        canManageBranches: false,
        level: 1,
        label: 'Company Staff',
        icon: '👤'
    }
};

// ========== HELPER FUNCTIONS ==========
const getCompanyRoleDisplay = (role) => {
    const roleMap = {
        'company_admin': 'Admin',
        'company_manager': 'Manager',
        'company_cashier': 'Cashier',
        'company_agent': 'Agent',
        'company_staff': 'Staff'
    };
    return roleMap[role] || role || 'Staff';
};

const getCompanyRoleBadge = (role) => {
    const badgeMap = {
        'company_admin': 'badge-company-admin',
        'company_manager': 'badge-company-manager',
        'company_cashier': 'badge-company-cashier',
        'company_agent': 'badge-company-agent',
        'company_staff': 'badge-company-staff'
    };
    return badgeMap[role] || 'badge-company-staff';
};

const getCompanyRoleIcon = (role) => {
    const iconMap = {
        'company_admin': '👑',
        'company_manager': '👔',
        'company_cashier': '💳',
        'company_agent': '🤝',
        'company_staff': '👤'
    };
    return iconMap[role] || '👤';
};

// ============================================
// =============== GET CURRENT USER ===============
// ============================================
exports.getCurrentUser = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('company', 'name address phone email pin logo settings')
            .populate('branch', 'name code city country currency currencySymbol')
            .populate('assignedBranches', 'name code city')
            .select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const userData = user.toObject();
        userData.companyRoleDisplay = getCompanyRoleDisplay(user.companyRole);
        userData.companyRoleBadge = getCompanyRoleBadge(user.companyRole);
        userData.companyRoleIcon = getCompanyRoleIcon(user.companyRole);
        userData.permissions = ROLE_PERMISSIONS[user.companyRole] || ROLE_PERMISSIONS.company_staff;

        res.json({
            success: true,
            data: userData
        });
    } catch (error) {
        console.error('Error fetching current user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user details',
            error: error.message
        });
    }
};

// =============== GET CURRENT USER PROFILE ===============
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate('company', 'name address phone email pin logo settings')
            .populate('branch', 'name code city country currency currencySymbol')
            .populate('assignedBranches', 'name code city')
            .select('-password');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const userData = user.toObject();
        userData.companyRoleDisplay = getCompanyRoleDisplay(user.companyRole);
        userData.companyRoleBadge = getCompanyRoleBadge(user.companyRole);
        userData.companyRoleIcon = getCompanyRoleIcon(user.companyRole);
        userData.permissions = ROLE_PERMISSIONS[user.companyRole] || ROLE_PERMISSIONS.company_staff;

        res.json({
            success: true,
            data: userData
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile'
        });
    }
};

// =============== UPDATE USER PROFILE ===============
exports.updateProfile = async (req, res) => {
    try {
        const { name, phone, department } = req.body;
        const userId = req.user._id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (name) user.name = name;
        if (phone) user.phone = phone;
        if (department) user.department = department;
        user.updatedAt = Date.now();

        await user.save();

        const updatedUser = await User.findById(userId)
            .populate('company', 'name address phone email pin logo settings')
            .populate('branch', 'name code city country currency currencySymbol')
            .populate('assignedBranches', 'name code city')
            .select('-password');

        res.json({
            success: true,
            data: updatedUser,
            message: 'Profile updated successfully'
        });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
};

// =============== UPLOAD PROFILE PICTURE ===============
exports.uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.profilePicture) {
            const oldPath = path.join(__dirname, '../uploads/profile-pictures', path.basename(user.profilePicture));
            if (fs.existsSync(oldPath)) {
                try {
                    fs.unlinkSync(oldPath);
                } catch (err) {
                    console.error('Error deleting old profile picture:', err);
                }
            }
        }

        const relativePath = `/uploads/profile-pictures/${req.file.filename}`;
        user.profilePicture = relativePath;
        user.updatedAt = Date.now();
        await user.save();

        const updatedUser = await User.findById(req.user._id)
            .populate('company', 'name address phone email pin logo settings')
            .populate('branch', 'name code city country currency currencySymbol')
            .populate('assignedBranches', 'name code city')
            .select('-password');

        const imageUrl = `${req.protocol}://${req.get('host')}${relativePath}`;

        res.json({
            success: true,
            data: updatedUser,
            imageUrl: imageUrl,
            message: 'Profile picture updated successfully'
        });
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload profile picture: ' + error.message
        });
    }
};

// =============== REMOVE PROFILE PICTURE ===============
exports.removeProfilePicture = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.profilePicture) {
            const oldPath = path.join(__dirname, '../uploads/profile-pictures', path.basename(user.profilePicture));
            if (fs.existsSync(oldPath)) {
                try {
                    fs.unlinkSync(oldPath);
                } catch (err) {
                    console.error('Error deleting profile picture:', err);
                }
            }
        }

        user.profilePicture = '';
        user.updatedAt = Date.now();
        await user.save();

        const updatedUser = await User.findById(req.user._id)
            .populate('company', 'name address phone email pin logo settings')
            .populate('branch', 'name code city country currency currencySymbol')
            .populate('assignedBranches', 'name code city')
            .select('-password');

        res.json({
            success: true,
            data: updatedUser,
            message: 'Profile picture removed successfully'
        });
    } catch (error) {
        console.error('Error removing profile picture:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove profile picture'
        });
    }
};

// =============== CHANGE PASSWORD ===============
exports.changePassword = async (req, res) => {
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

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        user.updatedAt = Date.now();
        await user.save();

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password'
        });
    }
};

// =============== GET ALL USERS (Company filtered) ===============
exports.getUsers = async (req, res) => {
    try {
        const currentUser = req.user;
        
        if (!currentUser.companyRole || currentUser.companyRole === 'company_staff') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view users'
            });
        }

        const companyId = currentUser.company?._id || currentUser.company;
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'User has no company assigned'
            });
        }

        let query = {
            company: companyId,
            role: { $in: ['guest', 'staff'] }
        };

        if (currentUser.companyRole === 'company_manager') {
            query.companyRole = { $ne: 'company_admin' };
        }

        const users = await User.find(query)
            .select('-password')
            .populate('company', 'name code')
            .populate('branch', 'name code city')
            .populate('assignedBranches', 'name code city')
            .sort({ createdAt: -1 });

        const usersWithRoles = users.map(user => {
            const userObj = user.toObject();
            userObj.companyRoleDisplay = getCompanyRoleDisplay(user.companyRole);
            userObj.companyRoleBadge = getCompanyRoleBadge(user.companyRole);
            userObj.companyRoleIcon = getCompanyRoleIcon(user.companyRole);
            return userObj;
        });

        res.json({
            success: true,
            data: usersWithRoles
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users'
        });
    }
};

// =============== GET SINGLE USER ===============
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUser = req.user;

        if (currentUser._id.toString() === id) {
            const user = await User.findById(id)
                .select('-password')
                .populate('company', 'name code')
                .populate('branch', 'name code city')
                .populate('assignedBranches', 'name code city');
            
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }
            return res.json({
                success: true,
                data: user
            });
        }

        if (!currentUser.companyRole || currentUser.companyRole === 'company_staff') {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to view other users'
            });
        }

        const companyId = currentUser.company?._id || currentUser.company;
        const query = {
            _id: id,
            company: companyId,
            role: { $in: ['guest', 'staff'] }
        };

        if (currentUser.companyRole === 'company_manager') {
            query.companyRole = { $ne: 'company_admin' };
        }

        const user = await User.findOne(query)
            .select('-password')
            .populate('company', 'name code')
            .populate('branch', 'name code city')
            .populate('assignedBranches', 'name code city');
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found or you do not have permission to view this user'
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch user'
        });
    }
};

// =============== CREATE USER - FIXED FOR MANAGER ACCESS ===============
exports.createUser = async (req, res) => {
    try {
        const { 
            name, 
            email, 
            password, 
            companyRole, 
            phone,
            branch,
            assignedBranches,
            department
        } = req.body;
        
        const currentUser = req.user;

        // ✅ Allow both Admin AND Manager to create users
        if (currentUser.companyRole !== 'company_admin' && currentUser.companyRole !== 'company_manager') {
            return res.status(403).json({
                success: false,
                message: 'Only Company Admin or Manager can create users'
            });
        }

        // ✅ Restrict Managers from creating Admin users
        if (currentUser.companyRole === 'company_manager' && companyRole === 'company_admin') {
            return res.status(403).json({
                success: false,
                message: 'Managers cannot create Admin users'
            });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        const companyId = currentUser.company?._id || currentUser.company;
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'You are not assigned to a company'
            });
        }

        const validCompanyRoles = ['company_admin', 'company_manager', 'company_cashier', 'company_agent', 'company_staff'];
        let finalCompanyRole = companyRole || 'company_staff';
        
        if (!validCompanyRoles.includes(finalCompanyRole)) {
            return res.status(400).json({
                success: false,
                message: `Invalid company role. Must be one of: ${validCompanyRoles.join(', ')}`
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const userData = {
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: 'guest',
            companyRole: finalCompanyRole,
            company: companyId,
            phone: phone || '',
            department: department || '',
            project: 'TRONIC_MASTER',
            isActive: true
        };

        // ========== HANDLE BRANCH ASSIGNMENTS ==========
        console.log('📝 Creating user with role:', finalCompanyRole);
        console.log('📝 Branch data received:', { branch, assignedBranches });

        if (finalCompanyRole === 'company_admin') {
            userData.branch = null;
            userData.assignedBranches = [];
            console.log('👑 Admin: No branch assigned');
        } else {
            if (branch && branch !== '' && branch !== 'null') {
                const branchExists = await Branch.findById(branch);
                if (branchExists) {
                    userData.branch = branch;
                    console.log('📍 Branch assigned:', branchExists.name);
                } else {
                    return res.status(400).json({
                        success: false,
                        message: 'Branch not found'
                    });
                }
            } else {
                userData.branch = null;
            }

            if (finalCompanyRole === 'company_manager') {
                if (assignedBranches && assignedBranches.length > 0) {
                    const validBranches = await Branch.find({
                        _id: { $in: assignedBranches },
                        company: companyId
                    });
                    
                    if (validBranches.length === assignedBranches.length) {
                        userData.assignedBranches = assignedBranches;
                        console.log('📋 Assigned branches:', assignedBranches.length);
                    } else {
                        return res.status(400).json({
                            success: false,
                            message: 'One or more branches not found in your company'
                        });
                    }
                } else {
                    userData.assignedBranches = [];
                }
            } else {
                userData.assignedBranches = [];
            }
        }

        const newUser = new User(userData);
        await newUser.save();

        const populatedUser = await User.findById(newUser._id)
            .select('-password')
            .populate('company', 'name')
            .populate('branch', 'name code city')
            .populate('assignedBranches', 'name code city');

        const userResponse = populatedUser.toObject();
        userResponse.companyRoleDisplay = getCompanyRoleDisplay(populatedUser.companyRole);
        userResponse.companyRoleBadge = getCompanyRoleBadge(populatedUser.companyRole);
        userResponse.companyRoleIcon = getCompanyRoleIcon(populatedUser.companyRole);

        console.log('✅ User created successfully with branch data');

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: userResponse
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =============== UPDATE USER - FIXED FOR MANAGER ACCESS ===============
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const currentUser = req.user;

        // ✅ Allow both Admin AND Manager to update users
        if (currentUser.companyRole !== 'company_admin' && currentUser.companyRole !== 'company_manager') {
            return res.status(403).json({
                success: false,
                message: 'Only Company Admin or Manager can update users'
            });
        }

        const userToUpdate = await User.findById(id);
        if (!userToUpdate) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const companyId = currentUser.company?._id || currentUser.company;
        if (userToUpdate.company.toString() !== companyId?.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only update users in your company'
            });
        }

        // ✅ Restrict Managers from updating Admin users
        if (currentUser.companyRole === 'company_manager' && userToUpdate.companyRole === 'company_admin') {
            return res.status(403).json({
                success: false,
                message: 'Managers cannot update Admin users'
            });
        }

        // ✅ Restrict Managers from changing role to Admin
        if (currentUser.companyRole === 'company_manager' && updates.companyRole === 'company_admin') {
            return res.status(403).json({
                success: false,
                message: 'Managers cannot assign Admin role'
            });
        }

        console.log('📝 Updating user:', userToUpdate.email);
        console.log('📝 Update data received:', updates);

        if (updates.name) userToUpdate.name = updates.name;
        if (updates.email) userToUpdate.email = updates.email.toLowerCase();
        if (updates.phone !== undefined) userToUpdate.phone = updates.phone;
        if (updates.isActive !== undefined) userToUpdate.isActive = updates.isActive;
        if (updates.department !== undefined) userToUpdate.department = updates.department;

        if (updates.companyRole) {
            const validRoles = ['company_admin', 'company_manager', 'company_cashier', 'company_agent', 'company_staff'];
            if (!validRoles.includes(updates.companyRole)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid company role. Must be one of: ${validRoles.join(', ')}`
                });
            }
            userToUpdate.companyRole = updates.companyRole;
        }

        const finalRole = userToUpdate.companyRole;

        if (finalRole === 'company_admin') {
            userToUpdate.branch = null;
            userToUpdate.assignedBranches = [];
            console.log('👑 Admin: Cleared branch assignments');
        } else {
            if (updates.branch !== undefined) {
                if (updates.branch === '' || updates.branch === null || updates.branch === 'null') {
                    userToUpdate.branch = null;
                    console.log('📍 Branch cleared');
                } else {
                    const branchExists = await Branch.findById(updates.branch);
                    if (branchExists) {
                        userToUpdate.branch = updates.branch;
                        console.log('📍 Branch assigned:', branchExists.name);
                    } else {
                        return res.status(400).json({
                            success: false,
                            message: 'Branch not found'
                        });
                    }
                }
            }

            if (finalRole === 'company_manager') {
                if (updates.assignedBranches !== undefined) {
                    if (!updates.assignedBranches || updates.assignedBranches.length === 0) {
                        userToUpdate.assignedBranches = [];
                        console.log('📋 Assigned branches cleared');
                    } else {
                        const validBranches = await Branch.find({
                            _id: { $in: updates.assignedBranches },
                            company: companyId
                        });
                        
                        if (validBranches.length === updates.assignedBranches.length) {
                            userToUpdate.assignedBranches = updates.assignedBranches;
                            console.log('📋 Assigned branches updated:', updates.assignedBranches.length);
                        } else {
                            return res.status(400).json({
                                success: false,
                                message: 'One or more branches not found in your company'
                            });
                        }
                    }
                }
            } else {
                userToUpdate.assignedBranches = [];
            }
        }

        if (updates.password) {
            userToUpdate.password = await bcrypt.hash(updates.password, 10);
            console.log('🔑 Password updated');
        }

        userToUpdate.updatedAt = Date.now();
        await userToUpdate.save();

        const updatedUser = await User.findById(id)
            .select('-password')
            .populate('company', 'name')
            .populate('branch', 'name code city')
            .populate('assignedBranches', 'name code city');

        const userResponse = updatedUser.toObject();
        userResponse.companyRoleDisplay = getCompanyRoleDisplay(updatedUser.companyRole);
        userResponse.companyRoleBadge = getCompanyRoleBadge(updatedUser.companyRole);
        userResponse.companyRoleIcon = getCompanyRoleIcon(updatedUser.companyRole);

        console.log('✅ User updated successfully');

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: userResponse
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =============== DELETE USER - FIXED FOR MANAGER ACCESS ===============
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUser = req.user;

        // ✅ Allow both Admin AND Manager to delete users
        if (currentUser.companyRole !== 'company_admin' && currentUser.companyRole !== 'company_manager') {
            return res.status(403).json({
                success: false,
                message: 'Only Company Admin or Manager can delete users'
            });
        }

        const userToDelete = await User.findById(id);
        if (!userToDelete) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const companyId = currentUser.company?._id || currentUser.company;
        if (userToDelete.company.toString() !== companyId?.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only delete users in your company'
            });
        }

        // ✅ Restrict Managers from deleting Admin users
        if (currentUser.companyRole === 'company_manager' && userToDelete.companyRole === 'company_admin') {
            return res.status(403).json({
                success: false,
                message: 'Managers cannot delete Admin users'
            });
        }

        if (userToDelete.companyRole === 'company_admin' && userToDelete._id.toString() === currentUser._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You cannot delete your own account'
            });
        }

        await User.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =============== UPDATE USER STATUS - FIXED FOR MANAGER ACCESS ===============
exports.updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        const currentUser = req.user;

        // ✅ Allow both Admin AND Manager to update user status
        if (currentUser.companyRole !== 'company_admin' && currentUser.companyRole !== 'company_manager') {
            return res.status(403).json({
                success: false,
                message: 'Only Company Admin or Manager can update user status'
            });
        }

        const userToUpdate = await User.findById(id);
        if (!userToUpdate) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const companyId = currentUser.company?._id || currentUser.company;
        if (userToUpdate.company.toString() !== companyId?.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You can only update users in your company'
            });
        }

        // ✅ Restrict Managers from updating Admin user status
        if (currentUser.companyRole === 'company_manager' && userToUpdate.companyRole === 'company_admin') {
            return res.status(403).json({
                success: false,
                message: 'Managers cannot update Admin user status'
            });
        }

        userToUpdate.isActive = isActive;
        userToUpdate.updatedAt = Date.now();
        await userToUpdate.save();

        res.status(200).json({
            success: true,
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
            data: {
                id: userToUpdate._id,
                isActive: userToUpdate.isActive
            }
        });
    } catch (error) {
        console.error('Update user status error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};