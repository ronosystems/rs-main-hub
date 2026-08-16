// /home/kk/RS/TRONIC_MASTER/backend/src/middleware/auth.js

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// ✅ Use the SAME JWT_SECRET as MAIN HUB
const JWT_SECRET = process.env.JWT_SECRET || 'hub_super_secret_key_2026';

// Company role hierarchy for permissions
const COMPANY_ROLE_HIERARCHY = {
    'company_admin': 5,
    'company_manager': 4,
    'company_cashier': 3,
    'company_agent': 2,
    'company_staff': 1
};

// Protect middleware - authentication
exports.protect = async (req, res, next) => {
    try {
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized, no token'
            });
        }

        try {
            // ✅ Use the SAME JWT_SECRET
            const decoded = jwt.verify(token, JWT_SECRET);
            
            const user = await User.findById(decoded.id)
                .populate('company', 'name code projectType settings');
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    message: 'User not found'
                });
            }
            
            if (!user.isActive) {
                return res.status(403).json({
                    success: false,
                    message: 'Account is disabled'
                });
            }
            
            req.user = user;
            next();
        } catch (error) {
            console.error('Token verification error:', error);
            return res.status(401).json({
                success: false,
                message: 'Not authorized, invalid token'
            });
        }
    } catch (error) {
        console.error('Auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// ========== AUTHORIZE BY SYSTEM ROLE ==========
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Role ${req.user.role} is not authorized to access this route`
            });
        }
        next();
    };
};

// ========== AUTHORIZE BY COMPANY ROLE ==========
exports.authorizeCompany = (...companyRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }
        
        if (req.user.role === 'super_admin') {
            return next();
        }
        
        if (!req.user.companyRole) {
            return res.status(403).json({
                success: false,
                message: 'No company role assigned'
            });
        }
        
        if (!companyRoles.includes(req.user.companyRole)) {
            return res.status(403).json({
                success: false,
                message: `Company role ${req.user.companyRole} is not authorized to access this route`
            });
        }
        next();
    };
};

// ========== AUTHORIZE BY PERMISSION LEVEL ==========
exports.authorizeLevel = (minLevel) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Not authorized'
            });
        }
        
        if (req.user.role === 'super_admin') {
            return next();
        }
        
        if (!req.user.companyRole) {
            return res.status(403).json({
                success: false,
                message: 'No company role assigned'
            });
        }
        
        const userLevel = COMPANY_ROLE_HIERARCHY[req.user.companyRole] || 0;
        const requiredLevel = COMPANY_ROLE_HIERARCHY[minLevel] || 0;
        
        if (userLevel < requiredLevel) {
            return res.status(403).json({
                success: false,
                message: `Insufficient permissions. Required: ${minLevel}, User: ${req.user.companyRole}`
            });
        }
        next();
    };
};

// ========== SUPER ADMIN ONLY ==========
exports.superAdminOnly = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized'
        });
    }
    
    if (req.user.role !== 'super_admin') {
        return res.status(403).json({
            success: false,
            message: 'Super Admin access required'
        });
    }
    next();
};