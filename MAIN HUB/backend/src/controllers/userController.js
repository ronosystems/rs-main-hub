// /home/kk/RS/MAIN HUB/backend/src/controllers/userController.js

const User = require('../models/User');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// =============== HELPER: GET PROFILE PICTURE URL ===============
const getProfilePictureUrl = (user, req) => {
    if (!user || !user.profilePicture) return null;
    
    const profilePic = user.profilePicture;
    
    // If it's already a full URL, return it
    if (profilePic.startsWith('http://') || profilePic.startsWith('https://')) {
        return profilePic;
    }
    
    // Check if the user is from TRONIC_MASTER project
    if (user.project === 'TRONIC_MASTER') {
        const tronicBaseUrl = process.env.TRONIC_API_URL || 'http://localhost:5002';
        return `${tronicBaseUrl}${profilePic}`;
    }
    
    // Default: MAIN HUB (port 5000)
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    return `${baseUrl}${profilePic}`;
};

// =============== GET ALL USERS ===============
exports.getUsers = async (req, res) => {
    try {
        const currentUser = req.user;
        let query = {};

        if (currentUser.role === 'super_admin') {
            query = {};
        } 
        else if (currentUser.role === 'admin') {
            query = {
                role: { $in: ['manager', 'staff', 'guest'] }
            };
        }
        else if (currentUser.role === 'manager') {
            query = {
                role: { $in: ['staff', 'guest'] }
            };
        }
        else {
            query = { _id: currentUser._id };
        }

        const users = await User.find(query)
            .select('-password')
            .populate('company', 'name code');

        const usersWithUrls = users.map(user => {
            const userObj = user.toObject();
            userObj.profilePictureUrl = getProfilePictureUrl(user, req);
            return userObj;
        });

        res.status(200).json({
            success: true,
            data: usersWithUrls
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =============== GET SINGLE USER ===============
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUser = req.user;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        let query = { _id: id };

        if (currentUser.role === 'admin') {
            query.role = { $in: ['manager', 'staff', 'guest'] };
        } else if (currentUser.role === 'manager') {
            query.role = { $in: ['staff', 'guest'] };
        } else if (currentUser.role === 'staff' || currentUser.role === 'guest') {
            query = { _id: currentUser._id };
        }

        const user = await User.findOne(query)
            .select('-password')
            .populate('company', 'name code');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found or you do not have permission to view this user'
            });
        }

        const userObj = user.toObject();
        userObj.profilePictureUrl = getProfilePictureUrl(user, req);

        res.status(200).json({
            success: true,
            data: userObj
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =============== CREATE USER ===============
exports.createUser = async (req, res) => {
    try {
        const { 
            name, 
            email, 
            password, 
            role, 
            company, 
            project, 
            phone, 
            projectRole,
            companyRole  // ✅ ADD companyRole for project users
        } = req.body;
        const currentUser = req.user;

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // ===== ROLE PERMISSIONS =====
        let allowedRoles = ['guest'];
        if (currentUser.role === 'super_admin') {
            allowedRoles = ['super_admin', 'admin', 'manager', 'staff', 'guest'];
        } else if (currentUser.role === 'admin') {
            allowedRoles = ['manager', 'staff', 'guest'];
        }

        if (!allowedRoles.includes(role)) {
            return res.status(403).json({
                success: false,
                message: `You do not have permission to create a user with role: ${role}`
            });
        }

        // ===== VALIDATE COMPANY ROLE =====
        // Only guest users (project users) can have companyRole
        const finalRole = role || 'guest';
        let finalCompanyRole = null;
        
        if (finalRole === 'guest' && companyRole) {
            const validCompanyRoles = ['company_admin', 'company_manager', 'company_cashier', 'company_agent', 'company_staff'];
            if (validCompanyRoles.includes(companyRole)) {
                finalCompanyRole = companyRole;
            } else {
                finalCompanyRole = 'company_staff';
            }
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // ===== BUILD USER DATA =====
        const userData = {
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            role: finalRole,
            company: company || null,
            project: project || null,
            phone: phone || '',
            projectRole: projectRole || 'staff',
            isActive: true,
            settings: {
                theme: 'light',
                notifications: true,
                language: 'en'
            }
        };

        // ✅ Add companyRole ONLY for guest users (project users)
        if (finalRole === 'guest' && finalCompanyRole) {
            userData.companyRole = finalCompanyRole;
        }

        const user = new User(userData);
        await user.save();

        const userResponse = user.toObject();
        delete userResponse.password;
        userResponse.profilePictureUrl = getProfilePictureUrl(user, req);

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

// =============== UPDATE USER ===============
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;
        const currentUser = req.user;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        let user = await User.findById(id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // ===== PERMISSION CHECKS =====
        if (currentUser.role === 'admin') {
            if (!['manager', 'staff', 'guest'].includes(user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to update this user'
                });
            }
            if (updates.role && !['manager', 'staff', 'guest'].includes(updates.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Admin can only assign Manager, Staff, or Guest roles'
                });
            }
        } else if (currentUser.role === 'manager') {
            if (!['staff', 'guest'].includes(user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to update this user'
                });
            }
            if (updates.role) {
                return res.status(403).json({
                    success: false,
                    message: 'Manager cannot change user roles'
                });
            }
        } else if (currentUser.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update users'
            });
        }

        // ===== UPDATE FIELDS =====
        if (updates.name) user.name = updates.name;
        if (updates.email) user.email = updates.email.toLowerCase();
        if (updates.role) user.role = updates.role;
        if (updates.company !== undefined) user.company = updates.company;
        if (updates.project !== undefined) user.project = updates.project;
        if (updates.phone !== undefined) user.phone = updates.phone;
        if (updates.projectRole) user.projectRole = updates.projectRole;
        if (updates.isActive !== undefined) user.isActive = updates.isActive;

        // ✅ Update companyRole (only for guest users)
        if (updates.companyRole && user.role === 'guest') {
            const validCompanyRoles = ['company_admin', 'company_manager', 'company_cashier', 'company_agent', 'company_staff'];
            if (validCompanyRoles.includes(updates.companyRole)) {
                user.companyRole = updates.companyRole;
            }
        }

        if (updates.password) {
            user.password = await bcrypt.hash(updates.password, 10);
        }

        await user.save();

        const userResponse = user.toObject();
        delete userResponse.password;
        userResponse.profilePictureUrl = getProfilePictureUrl(user, req);

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

// =============== DELETE USER ===============
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const currentUser = req.user;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        const userToDelete = await User.findById(id);
        if (!userToDelete) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (currentUser.role === 'admin') {
            if (!['manager', 'staff', 'guest'].includes(userToDelete.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to delete this user'
                });
            }
        } else if (currentUser.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete users'
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

// =============== UPDATE USER STATUS ===============
exports.updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { isActive } = req.body;
        const currentUser = req.user;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        const userToUpdate = await User.findById(id);
        if (!userToUpdate) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (currentUser.role === 'admin') {
            if (!['manager', 'staff', 'guest'].includes(userToUpdate.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'You do not have permission to update this user\'s status'
                });
            }
        } else if (currentUser.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update user status'
            });
        }

        userToUpdate.isActive = isActive;
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

// =============== GET USERS BY COMPANY ===============
exports.getUsersByCompany = async (req, res) => {
    try {
        const { companyId } = req.params;
        const currentUser = req.user;

        let query = { company: companyId };

        if (currentUser.role === 'admin') {
            query.role = { $in: ['manager', 'staff', 'guest'] };
        } else if (currentUser.role === 'manager') {
            query.role = { $in: ['staff', 'guest'] };
        } else if (currentUser.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view users by company'
            });
        }

        const users = await User.find(query)
            .select('-password')
            .populate('company', 'name code');

        const usersWithUrls = users.map(user => {
            const userObj = user.toObject();
            userObj.profilePictureUrl = getProfilePictureUrl(user, req);
            return userObj;
        });

        res.status(200).json({
            success: true,
            data: usersWithUrls
        });
    } catch (error) {
        console.error('Get users by company error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =============== GET USERS BY PROJECT ===============
exports.getUsersByProject = async (req, res) => {
    try {
        const { projectId } = req.params;
        const currentUser = req.user;

        if (!['super_admin', 'admin'].includes(currentUser.role)) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to view users by project'
            });
        }

        const users = await User.find({ project: projectId })
            .select('-password')
            .populate('company', 'name code');

        const usersWithUrls = users.map(user => {
            const userObj = user.toObject();
            userObj.profilePictureUrl = getProfilePictureUrl(user, req);
            return userObj;
        });

        res.status(200).json({
            success: true,
            data: usersWithUrls
        });
    } catch (error) {
        console.error('Get users by project error:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// =============== SYNC COMPANY ROLE ===============
exports.syncCompanyRole = async (req, res) => {
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
};