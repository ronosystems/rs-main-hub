// /home/kk/RS/MAIN HUB/backend/src/models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { 
        type: String, 
        enum: ['super_admin', 'admin', 'manager', 'staff', 'guest'],
        default: 'guest'
    },
    project: { type: String },  // Changed from ObjectId to String
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    
    // ✅ ADDED: Company Role for project users (TRONIC_MASTER)
    companyRole: { 
        type: String, 
        enum: ['company_admin', 'company_manager', 'company_cashier', 'company_agent', 'company_staff'],
        default: 'company_staff'
    },
    
    // Project Role for project users
    projectRole: { 
        type: String, 
        enum: ['admin', 'manager', 'staff'],
        default: 'staff'
    },
    phone: { type: String, default: '' },
    department: { type: String, default: '' },
    profilePicture: { type: String, default: '' },
    avatar: { type: String },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
    settings: {
        theme: { type: String, default: 'light' },
        notifications: { type: Boolean, default: true },
        language: { type: String, default: 'en' }
    }
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
UserSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

// Virtual for full profile picture URL
UserSchema.virtual('profilePictureUrl').get(function() {
    if (this.profilePicture) {
        return this.profilePicture;
    }
    if (this.avatar) {
        return this.avatar;
    }
    return null;
});

// Ensure virtuals are included in JSON output
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', UserSchema);