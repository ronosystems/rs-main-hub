const mongoose = require('mongoose');

const PlanSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        default: 0
    },
    currency: {
        type: String,
        default: 'KES'
    },
    billingCycle: {
        type: String,
        enum: ['monthly', 'yearly', 'one-time'],
        default: 'monthly'
    },
    features: {
        maxUsers: { type: Number, default: 1 },
        maxProjects: { type: Number, default: 1 },
        maxCompanies: { type: Number, default: 1 },
        maxStorage: { type: String, default: '1GB' },
        customDomain: { type: Boolean, default: false },
        apiAccess: { type: Boolean, default: false },
        prioritySupport: { type: Boolean, default: false },
        advancedReports: { type: Boolean, default: false }
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'archived'],
        default: 'active'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

PlanSchema.pre('save', async function(next) {
    if (this.isNew && !this.code) {
        const count = await mongoose.model('Plan').countDocuments();
        this.code = `PLN-${String(count + 1).padStart(3, '0')}`;
    }
    next();
});

module.exports = mongoose.model('Plan', PlanSchema);
