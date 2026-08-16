// /home/kk/RS/MAIN HUB/backend/src/middleware/auth.js

const { verifyToken } = require('../utils/jwt');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;
    if (req.headers.authorization?.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
    try {
        const decoded = verifyToken(token);
        
        // Get user with all needed fields
        req.user = await User.findById(decoded.id)
            .select('-password')
            .populate('project', 'name code')
            .populate('company', 'name code');
            
        if (!req.user) {
            return res.status(401).json({ message: 'User not found' });
        }
        
        // Update last login
        req.user.lastLogin = new Date();
        await req.user.save({ validateBeforeSave: false });
        
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ message: 'Invalid token' });
    }
};

const superAdminOnly = (req, res, next) => {
    if (req.user?.role === 'super_admin') {
        next();
    } else {
        res.status(403).json({ message: 'Super Admin only' });
    }
};

const adminOrAbove = (req, res, next) => {
    if (['super_admin', 'admin'].includes(req.user?.role)) {
        next();
    } else {
        res.status(403).json({ message: 'Admin or above required' });
    }
};

// Generic authorize function for flexible role checking
const authorize = (...roles) => {
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

module.exports = { protect, superAdminOnly, adminOrAbove, authorize };