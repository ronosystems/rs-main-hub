// /home/kk/RS/MAIN HUB/backend/src/models/Company.js

const mongoose = require('mongoose');
const { getAllProjects } = require('../config/project');

// Get all project types from config
const PROJECT_TYPES = {};
getAllProjects().forEach(p => {
    PROJECT_TYPES[p.type] = {
        name: p.typeName,
        code: p.code.replace('PRJ-', ''),
        icon: p.icon,
        color: p.color,
        active: p.isActive,
        description: p.description,
        folder: p.name
    };
});

const CompanySchema = new mongoose.Schema({
    // ========== BASIC COMPANY INFO ==========
    name: { 
        type: String, 
        required: true,
        trim: true
    },
    code: { 
        type: String, 
        unique: true,
        trim: true,
        sparse: true // Allow null/undefined values
    },
    description: { 
        type: String,
        trim: true
    },
    email: { 
        type: String,
        trim: true,
        lowercase: true
    },
    phone: { 
        type: String,
        trim: true
    },
    address: { 
        type: String,
        trim: true
    },
    pin: {
        type: String,
        trim: true
    },

    // ========== PROJECT REFERENCE ==========
    project: { 
        type: String,
        trim: true,
        default: null
    },

    // ========== PLAN REFERENCE ==========
    plan: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Plan',
        default: null
    },

    // ========== PROJECT TYPE ==========
    projectType: {
        type: String,
        enum: Object.keys(PROJECT_TYPES),
        required: true,
        default: 'RETAIL_MASTER'
    },

    // ========== PLAN RENEWAL SETTINGS ==========
    planRenewal: {
        type: {
            type: String,
            enum: ['manual', 'automatic'],
            default: 'manual'
        },
        autoRenewEnabled: {
            type: Boolean,
            default: false
        },
        renewalDate: {
            type: Date
        },
        lastRenewalDate: {
            type: Date
        },
        nextRenewalDate: {
            type: Date
        }
    },

    // ========== COMPANY ADMIN USER (OWNER) ==========
    adminUser: {
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        phone: {
            type: String,
            trim: true
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },

    // ========== STATUS ==========
    status: { 
        type: String, 
        enum: ['active', 'inactive', 'suspended', 'pending'], 
        default: 'pending' 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },

    // ========== SUBSCRIPTION DETAILS ==========
    subscription: {
        startDate: {
            type: Date,
            default: Date.now
        },
        endDate: {
            type: Date,
            default: null
        },
        trialEndDate: {
            type: Date,
            default: null
        },
        isTrial: {
            type: Boolean,
            default: true
        },
        status: {
            type: String,
            enum: ['trial', 'active', 'expired', 'cancelled', 'suspended'],
            default: 'trial'
        }
    },

    // ========== ADDITIONAL SETTINGS ==========
    settings: {
        timezone: {
            type: String,
            default: 'Africa/Nairobi'
        },
        currency: {
            type: String,
            default: 'KES'
        },
        language: {
            type: String,
            default: 'en'
        }
    },

    // ✅ ADDED: Logo stored as Image reference
    logo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Image',
        default: null
    },

    // ========== METADATA ==========
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }

}, { 
    timestamps: true 
});

// ========== INDEXES ==========
CompanySchema.index({ code: 1 }, { unique: true, sparse: true });
CompanySchema.index({ email: 1 });
CompanySchema.index({ status: 1 });
CompanySchema.index({ projectType: 1 });
CompanySchema.index({ 'adminUser.email': 1 });
CompanySchema.index({ 'subscription.status': 1 });
CompanySchema.index({ 'subscription.endDate': 1 });

// ========== PRE-SAVE MIDDLEWARE - Generate sequential code ==========
CompanySchema.pre('save', async function(next) {
    try {
        if (this.isNew && !this.code) {
            const Company = mongoose.model('Company');
            
            // Get all existing company codes and find the highest number
            const existingCompanies = await Company.find({ 
                code: { $regex: /^C-\d{3}$/ } 
            }).select('code').lean();
            
            let maxNumber = 0;
            existingCompanies.forEach(company => {
                if (company.code) {
                    const match = company.code.match(/^C-(\d{3})$/);
                    if (match) {
                        const num = parseInt(match[1]);
                        if (!isNaN(num) && num > maxNumber) {
                            maxNumber = num;
                        }
                    }
                }
            });
            
            // Generate next code (max + 1)
            const nextNumber = maxNumber + 1;
            const paddedNumber = String(nextNumber).padStart(3, '0');
            this.code = `C-${paddedNumber}`;
            
            console.log(`📝 Generated company code: ${this.code} (next available)`);
        }
        next();
    } catch (error) {
        console.error('Error generating company code:', error);
        next(error);
    }
});

// ========== INSTANCE METHODS ==========

// Get project type details from config
CompanySchema.methods.getProjectTypeDetails = function() {
    const project = getAllProjects().find(p => p.type === this.projectType);
    return project || null;
};

// Check if company is active
CompanySchema.methods.isActiveCompany = function() {
    return this.status === 'active' && this.isActive === true;
};

// Check if subscription is active
CompanySchema.methods.isSubscriptionActive = function() {
    if (this.subscription.status === 'active') {
        if (this.subscription.endDate) {
            return new Date() <= this.subscription.endDate;
        }
        return true;
    }
    return false;
};

// Get subscription status with details
CompanySchema.methods.getSubscriptionStatus = function() {
    const now = new Date();
    const endDate = this.subscription.endDate;
    
    if (!endDate) {
        return {
            status: 'active',
            isActive: true,
            daysRemaining: null
        };
    }
    
    const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysRemaining < 0) {
        return {
            status: 'expired',
            isActive: false,
            daysRemaining: daysRemaining,
            expiredDays: Math.abs(daysRemaining)
        };
    }
    
    if (daysRemaining <= 7) {
        return {
            status: 'expiring_soon',
            isActive: true,
            daysRemaining: daysRemaining
        };
    }
    
    return {
        status: 'active',
        isActive: true,
        daysRemaining: daysRemaining
    };
};

// ✅ ADDED: Method to get logo URL
CompanySchema.methods.getLogoUrl = async function() {
    if (!this.logo) return null;
    const Image = mongoose.model('Image');
    const image = await Image.findById(this.logo);
    return image ? image.dataUrl : null;
};

// ✅ ADDED: Virtual for logo URL
CompanySchema.virtual('logoUrl').get(function() {
    return this.logo ? `/api/images/${this.logo}` : null;
});

// ========== STATIC METHODS ==========

// Get all project types
CompanySchema.statics.getProjectTypes = function() {
    return PROJECT_TYPES;
};

// Get all plan types (deprecated - kept for backward compatibility)
CompanySchema.statics.getPlanTypes = function() {
    return ['basic', 'standard', 'premium', 'enterprise'];
};

// Find companies with expiring subscriptions
CompanySchema.statics.findExpiringSoon = function(days = 7) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    
    return this.find({
        'subscription.status': 'active',
        'subscription.endDate': { 
            $lte: futureDate,
            $gte: new Date()
        }
    });
};

// Find companies with expired subscriptions
CompanySchema.statics.findExpired = function() {
    return this.find({
        'subscription.status': 'active',
        'subscription.endDate': { 
            $lt: new Date()
        }
    });
};

// Get company statistics
CompanySchema.statics.getStatistics = async function() {
    const total = await this.countDocuments();
    const active = await this.countDocuments({ status: 'active' });
    const inactive = await this.countDocuments({ status: 'inactive' });
    const pending = await this.countDocuments({ status: 'pending' });
    const suspended = await this.countDocuments({ status: 'suspended' });
    
    const subscriptionStats = await this.aggregate([
        {
            $group: {
                _id: '$subscription.status',
                count: { $sum: 1 }
            }
        }
    ]);
    
    const planStats = await this.aggregate([
        {
            $match: { plan: { $ne: null } }
        },
        {
            $group: {
                _id: '$plan',
                count: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: 'plans',
                localField: '_id',
                foreignField: '_id',
                as: 'planDetails'
            }
        },
        {
            $unwind: {
                path: '$planDetails',
                preserveNullAndEmptyArrays: true
            }
        }
    ]);
    
    return {
        total,
        active,
        inactive,
        pending,
        suspended,
        subscriptionStats,
        planStats
    };
};

// Search companies
CompanySchema.statics.searchCompanies = function(searchTerm) {
    return this.find({
        $or: [
            { name: { $regex: searchTerm, $options: 'i' } },
            { email: { $regex: searchTerm, $options: 'i' } },
            { code: { $regex: searchTerm, $options: 'i' } },
            { 'adminUser.name': { $regex: searchTerm, $options: 'i' } },
            { 'adminUser.email': { $regex: searchTerm, $options: 'i' } }
        ]
    });
};

// ========== EXPORT ==========
module.exports = mongoose.model('Company', CompanySchema);