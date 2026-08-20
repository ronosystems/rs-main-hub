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
    project: { type: String },
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
    
    // ✅ CHANGED: profilePicture now stores Image ObjectId
    profilePicture: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Image',
        default: null
    },
    
    // Keep avatar for backward compatibility (optional)
    avatar: { type: String, default: '' },
    
    companyRole: { 
        type: String, 
        enum: ['company_admin', 'company_manager', 'company_cashier', 'company_agent', 'company_staff'],
        default: 'company_staff'
    },
    projectRole: { 
        type: String, 
        enum: ['admin', 'manager', 'staff'],
        default: 'staff'
    },
    phone: { type: String, default: '' },
    department: { type: String, default: '' },
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

// ✅ NEW: Method to get profile picture URL
UserSchema.methods.getProfilePictureUrl = async function() {
    if (!this.profilePicture) return null;
    const Image = mongoose.model('Image');
    const image = await Image.findById(this.profilePicture);
    return image ? image.dataUrl : null;
};

// ✅ NEW: Method to get profile picture as buffer
UserSchema.methods.getProfilePictureBuffer = async function() {
    if (!this.profilePicture) return null;
    const Image = mongoose.model('Image');
    const image = await Image.findById(this.profilePicture);
    return image ? image.data : null;
};

// Virtual for backward compatibility
UserSchema.virtual('profilePictureUrl').get(function() {
    return this.profilePicture ? `/api/images/${this.profilePicture}` : null;
});

// Ensure virtuals are included in JSON output
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', UserSchema);