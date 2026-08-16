// /home/kk/RS/TRONIC_MASTER/backend/src/models/Company.js

const mongoose = require('mongoose');

// This is just a reference to the MAIN HUB Company model
const companySchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, unique: true },
    description: { type: String },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String },
    address: { type: String },
    pin: { type: String },
    // ✅ ADD LOGO FIELD
    logo: { 
        type: String, 
        default: '' 
    },
    projectType: { 
        type: String, 
        enum: ['TRONIC_MASTER', 'RETAIL_MASTER', 'SUPERMARKET_MASTER', 'WHOLESALE_MASTER', 'HARDWARE_MASTER'],
        default: 'TRONIC_MASTER' 
    },
    project: { type: String, default: null },
    plan: { type: mongoose.Schema.Types.ObjectId, ref: 'Plan' },
    adminUser: {
        email: { type: String },
        name: { type: String },
        phone: { type: String },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    status: { type: String, enum: ['active', 'inactive', 'suspended', 'pending'], default: 'active' },
    isActive: { type: Boolean, default: true },
    subscription: {
        startDate: { type: Date, default: Date.now },
        endDate: { type: Date },
        trialEndDate: { type: Date },
        isTrial: { type: Boolean, default: true },
        status: { type: String, enum: ['trial', 'active', 'expired', 'cancelled', 'suspended'], default: 'trial' }
    },
    settings: {
        currency: { type: String, default: 'KES' },
        timezone: { type: String, default: 'Africa/Nairobi' },
        taxRate: { type: Number, default: 16 },
        receiptFooter: { type: String, default: 'Thank you for shopping with us!' }
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Company', companySchema);