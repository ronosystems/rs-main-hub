// /home/kk/RS/TRONIC_MASTER/backend/src/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Company = require('../models/Company');
const { protect } = require('../middleware/auth');

// ✅ Use the SAME JWT_SECRET as MAIN HUB
const JWT_SECRET = process.env.JWT_SECRET || 'hub_super_secret_key_2026';

// ✅ MAIN_HUB API URL for profile pictures
const MAIN_HUB_API_URL = process.env.MAIN_HUB_API_URL || 'http://localhost:5000';

// Helper function to get profile picture URL
const getProfilePictureUrl = (profilePictureId) => {
    if (!profilePictureId) return null;
    return `${MAIN_HUB_API_URL}/api/images/${profilePictureId}`;
};

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log('========================================');
        console.log('🔍 LOGIN ATTEMPT');
        console.log('📧 Email:', email);
        console.log('========================================');

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        // Find user
        console.log('📊 Looking for user in database...');
        const user = await User.findOne({ 
            email: email.toLowerCase()
        });

        if (!user) {
            console.log('❌ User not found');
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        console.log('✅ User found:', user.name);
        console.log('📧 User email:', user.email);
        console.log('🏢 Company ID:', user.company);
        console.log('📋 Project:', user.project);
        console.log('📋 Company Role:', user.companyRole);

        // Check if user is active
        if (!user.isActive) {
            console.log('❌ User is inactive');
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated'
            });
        }

        // Verify password
        console.log('🔐 Comparing passwords...');
        const isMatch = await bcrypt.compare(password, user.password);
        console.log('🔐 Password match result:', isMatch);
        
        if (!isMatch) {
            console.log('❌ Password does not match');
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        console.log('✅ Password matches!');

        // Check if user belongs to a company
        if (!user.company) {
            console.log('❌ User has no company');
            return res.status(403).json({
                success: false,
                message: 'User is not associated with any company'
            });
        }

        // Get the company
        console.log('🏢 Looking for company...');
        const company = await Company.findById(user.company);

        if (!company) {
            console.log('❌ Company not found');
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        console.log('✅ Company found:', company.name);
        console.log('📋 Company Project Type:', company.projectType);
        console.log('📊 Company Status:', company.status);

        // Check if company is active
        if (company.status !== 'active' || !company.isActive) {
            console.log('❌ Company is not active');
            return res.status(403).json({
                success: false,
                message: 'Company is not active'
            });
        }

        // Check if company has TRONIC_MASTER project type
        if (company.projectType !== 'TRONIC_MASTER') {
            console.log('❌ Company project type is:', company.projectType);
            return res.status(403).json({
                success: false,
                message: `Access denied. This company (${company.name}) does not have TRONIC_MASTER access.`
            });
        }

        console.log('✅ All checks passed! Generating token...');

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // ✅ Generate token with the SAME JWT_SECRET
        const token = jwt.sign(
            { 
                id: user._id, 
                role: user.role, 
                companyId: user.company,
                projectType: company.projectType
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        console.log('✅ Login successful!');
        console.log('========================================\n');

        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                companyRole: user.companyRole || 'company_staff',
                projectRole: user.projectRole || 'staff',
                phone: user.phone || '',
                // ✅ CHANGED: Use MAIN_HUB API for profile picture
                profilePicture: getProfilePictureUrl(user.profilePicture),
                company: {
                    id: company._id,
                    name: company.name,
                    code: company.code,
                    projectType: company.projectType,
                    settings: company.settings
                }
            },
            message: `Welcome to TRONIC_MASTER! (${company.name})`
        });

    } catch (error) {
        console.error('❌ Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login',
            error: error.message
        });
    }
});

router.get('/me', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        
        let company = null;
        if (user.company) {
            company = await Company.findById(user.company);
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                companyRole: user.companyRole || 'company_staff',
                projectRole: user.projectRole || 'staff',
                company: company,
                phone: user.phone || '',
                // ✅ CHANGED: Use MAIN_HUB API for profile picture
                profilePicture: getProfilePictureUrl(user.profilePicture)
            }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching user data'
        });
    }
});

router.post('/validate', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        let company = null;
        if (user.company) {
            company = await Company.findById(user.company);
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                companyRole: user.companyRole || 'company_staff',
                projectRole: user.projectRole || 'staff',
                company: company,
                phone: user.phone || '',
                // ✅ CHANGED: Use MAIN_HUB API for profile picture
                profilePicture: getProfilePictureUrl(user.profilePicture)
            }
        });
    } catch (error) {
        console.error('Validate error:', error);
        res.status(500).json({
            success: false,
            message: 'Error validating token'
        });
    }
});

module.exports = router;