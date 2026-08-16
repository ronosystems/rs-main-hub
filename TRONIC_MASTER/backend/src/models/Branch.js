// /home/kk/RS/TRONIC_MASTER/backend/src/models/Branch.js

const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        trim: true,
        uppercase: true
    },
    type: {
        type: String,
        enum: ['main', 'branch', 'warehouse', 'outlet'],
        default: 'branch'
    },
    country: {
        type: String,
        required: true,
        trim: true
    },
    // ✅ Add country code and currency fields
    countryCode: {
        type: String,
        required: true,
        trim: true,
        uppercase: true,
        default: 'KE'
    },
    currency: {
        type: String,
        required: true,
        trim: true,
        default: 'KES'
    },
    currencySymbol: {
        type: String,
        required: true,
        default: 'KSh'
    },
    city: {
        type: String,
        required: true,
        trim: true
    },
    address: {
        type: String,
        trim: true
    },
    phone: {
        type: String,
        trim: true
    },
    email: {
        type: String,
        trim: true,
        lowercase: true
    },
    manager: {
        name: {
            type: String,
            trim: true
        },
        phone: {
            type: String,
            trim: true
        },
        email: {
            type: String,
            trim: true,
            lowercase: true
        }
    },
    openingHours: {
        monday: { open: String, close: String },
        tuesday: { open: String, close: String },
        wednesday: { open: String, close: String },
        thursday: { open: String, close: String },
        friday: { open: String, close: String },
        saturday: { open: String, close: String },
        sunday: { open: String, close: String }
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isMainBranch: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// ✅ Indexes
branchSchema.index({ company: 1, code: 1 }, { unique: true });
branchSchema.index({ company: 1, name: 1 });
branchSchema.index({ company: 1, country: 1 });
branchSchema.index({ company: 1, countryCode: 1 });
branchSchema.index({ company: 1, city: 1 });
branchSchema.index({ company: 1, isMainBranch: 1 });

// ✅ Pre-save middleware - Auto set currency based on country
branchSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    
    // Auto-set currency based on country
    const countryCurrencyMap = {
        'KE': { currency: 'KES', currencySymbol: 'KSh', countryName: 'Kenya' },
        'TZ': { currency: 'TZS', currencySymbol: 'TSh', countryName: 'Tanzania' },
        'UG': { currency: 'UGX', currencySymbol: 'USh', countryName: 'Uganda' },
        'RW': { currency: 'RWF', currencySymbol: 'RF', countryName: 'Rwanda' },
        'NG': { currency: 'NGN', currencySymbol: '₦', countryName: 'Nigeria' },
        'ZA': { currency: 'ZAR', currencySymbol: 'R', countryName: 'South Africa' },
        'GH': { currency: 'GHS', currencySymbol: '₵', countryName: 'Ghana' },
        'EG': { currency: 'EGP', currencySymbol: 'E£', countryName: 'Egypt' },
        'US': { currency: 'USD', currencySymbol: '$', countryName: 'United States' },
        'GB': { currency: 'GBP', currencySymbol: '£', countryName: 'United Kingdom' },
        'EU': { currency: 'EUR', currencySymbol: '€', countryName: 'Europe' },
        'IN': { currency: 'INR', currencySymbol: '₹', countryName: 'India' },
        'CN': { currency: 'CNY', currencySymbol: '¥', countryName: 'China' },
        'JP': { currency: 'JPY', currencySymbol: '¥', countryName: 'Japan' },
        'AU': { currency: 'AUD', currencySymbol: 'A$', countryName: 'Australia' },
        'CA': { currency: 'CAD', currencySymbol: 'C$', countryName: 'Canada' },
        'BR': { currency: 'BRL', currencySymbol: 'R$', countryName: 'Brazil' },
        'MX': { currency: 'MXN', currencySymbol: '$', countryName: 'Mexico' },
        'AE': { currency: 'AED', currencySymbol: 'د.إ', countryName: 'UAE' },
        'SA': { currency: 'SAR', currencySymbol: 'ر.س', countryName: 'Saudi Arabia' }
    };
    
    // If countryCode is provided, auto-set currency
    if (this.countryCode && countryCurrencyMap[this.countryCode.toUpperCase()]) {
        const currencyData = countryCurrencyMap[this.countryCode.toUpperCase()];
        this.currency = currencyData.currency;
        this.currencySymbol = currencyData.currencySymbol;
        // Also set the country name if not already set
        if (!this.country || this.country === '') {
            this.country = currencyData.countryName;
        }
    }
    
    // If country is manually set but no countryCode, try to match
    if (this.country && !this.countryCode) {
        const countryMap = {
            'kenya': 'KE',
            'tanzania': 'TZ',
            'uganda': 'UG',
            'rwanda': 'RW',
            'nigeria': 'NG',
            'south africa': 'ZA',
            'ghana': 'GH',
            'egypt': 'EG',
            'united states': 'US',
            'united kingdom': 'GB',
            'europe': 'EU',
            'india': 'IN',
            'china': 'CN',
            'japan': 'JP',
            'australia': 'AU',
            'canada': 'CA',
            'brazil': 'BR',
            'mexico': 'MX',
            'uae': 'AE',
            'saudi arabia': 'SA'
        };
        const lowerCountry = this.country.toLowerCase();
        if (countryMap[lowerCountry]) {
            this.countryCode = countryMap[lowerCountry];
        }
    }
    
    next();
});

// ✅ Static method to get currency for a country
branchSchema.statics.getCurrencyForCountry = function(countryCode) {
    const countryCurrencyMap = {
        'KE': { currency: 'KES', currencySymbol: 'KSh', countryName: 'Kenya' },
        'TZ': { currency: 'TZS', currencySymbol: 'TSh', countryName: 'Tanzania' },
        'UG': { currency: 'UGX', currencySymbol: 'USh', countryName: 'Uganda' },
        'RW': { currency: 'RWF', currencySymbol: 'RF', countryName: 'Rwanda' },
        'NG': { currency: 'NGN', currencySymbol: '₦', countryName: 'Nigeria' },
        'ZA': { currency: 'ZAR', currencySymbol: 'R', countryName: 'South Africa' },
        'GH': { currency: 'GHS', currencySymbol: '₵', countryName: 'Ghana' },
        'EG': { currency: 'EGP', currencySymbol: 'E£', countryName: 'Egypt' },
        'US': { currency: 'USD', currencySymbol: '$', countryName: 'United States' },
        'GB': { currency: 'GBP', currencySymbol: '£', countryName: 'United Kingdom' },
        'EU': { currency: 'EUR', currencySymbol: '€', countryName: 'Europe' },
        'IN': { currency: 'INR', currencySymbol: '₹', countryName: 'India' },
        'CN': { currency: 'CNY', currencySymbol: '¥', countryName: 'China' },
        'JP': { currency: 'JPY', currencySymbol: '¥', countryName: 'Japan' },
        'AU': { currency: 'AUD', currencySymbol: 'A$', countryName: 'Australia' },
        'CA': { currency: 'CAD', currencySymbol: 'C$', countryName: 'Canada' },
        'BR': { currency: 'BRL', currencySymbol: 'R$', countryName: 'Brazil' },
        'MX': { currency: 'MXN', currencySymbol: '$', countryName: 'Mexico' },
        'AE': { currency: 'AED', currencySymbol: 'د.إ', countryName: 'UAE' },
        'SA': { currency: 'SAR', currencySymbol: 'ر.س', countryName: 'Saudi Arabia' }
    };
    return countryCurrencyMap[countryCode.toUpperCase()] || { currency: 'KES', currencySymbol: 'KSh', countryName: 'Kenya' };
};

// ✅ Static method to get all countries with their currencies
branchSchema.statics.getCountriesWithCurrencies = function() {
    return [
        { code: 'KE', name: 'Kenya', currency: 'KES', currencySymbol: 'KSh' },
        { code: 'TZ', name: 'Tanzania', currency: 'TZS', currencySymbol: 'TSh' },
        { code: 'UG', name: 'Uganda', currency: 'UGX', currencySymbol: 'USh' },
        { code: 'RW', name: 'Rwanda', currency: 'RWF', currencySymbol: 'RF' },
        { code: 'NG', name: 'Nigeria', currency: 'NGN', currencySymbol: '₦' },
        { code: 'ZA', name: 'South Africa', currency: 'ZAR', currencySymbol: 'R' },
        { code: 'GH', name: 'Ghana', currency: 'GHS', currencySymbol: '₵' },
        { code: 'EG', name: 'Egypt', currency: 'EGP', currencySymbol: 'E£' },
        { code: 'US', name: 'United States', currency: 'USD', currencySymbol: '$' },
        { code: 'GB', name: 'United Kingdom', currency: 'GBP', currencySymbol: '£' },
        { code: 'EU', name: 'Europe', currency: 'EUR', currencySymbol: '€' },
        { code: 'IN', name: 'India', currency: 'INR', currencySymbol: '₹' },
        { code: 'CN', name: 'China', currency: 'CNY', currencySymbol: '¥' },
        { code: 'JP', name: 'Japan', currency: 'JPY', currencySymbol: '¥' },
        { code: 'AU', name: 'Australia', currency: 'AUD', currencySymbol: 'A$' },
        { code: 'CA', name: 'Canada', currency: 'CAD', currencySymbol: 'C$' },
        { code: 'BR', name: 'Brazil', currency: 'BRL', currencySymbol: 'R$' },
        { code: 'MX', name: 'Mexico', currency: 'MXN', currencySymbol: '$' },
        { code: 'AE', name: 'UAE', currency: 'AED', currencySymbol: 'د.إ' },
        { code: 'SA', name: 'Saudi Arabia', currency: 'SAR', currencySymbol: 'ر.س' }
    ];
};

// ✅ Static methods
branchSchema.statics.getBranchesByCompany = async function(companyId) {
    return await this.find({ 
        company: companyId, 
        isActive: true 
    }).sort({ isMainBranch: -1, name: 1 });
};

branchSchema.statics.getMainBranch = async function(companyId) {
    return await this.findOne({ 
        company: companyId, 
        isMainBranch: true,
        isActive: true 
    });
};

branchSchema.statics.getBranchesByCountry = async function(companyId, country) {
    return await this.find({ 
        company: companyId, 
        country: country,
        isActive: true 
    }).sort({ name: 1 });
};

branchSchema.statics.searchBranches = async function(companyId, searchTerm) {
    return await this.find({
        company: companyId,
        isActive: true,
        $or: [
            { name: { $regex: searchTerm, $options: 'i' } },
            { code: { $regex: searchTerm, $options: 'i' } },
            { city: { $regex: searchTerm, $options: 'i' } },
            { country: { $regex: searchTerm, $options: 'i' } }
        ]
    }).sort({ name: 1 });
};

module.exports = mongoose.model('Branch', branchSchema);