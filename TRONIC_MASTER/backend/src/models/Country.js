const mongoose = require('mongoose');

const countrySchema = new mongoose.Schema({
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
    dialCode: {
        type: String,
        trim: true
    },
    currency: {
        type: String,
        trim: true
    },
    currencySymbol: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
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

countrySchema.index({ company: 1, name: 1 }, { unique: true });
countrySchema.index({ company: 1, code: 1 }, { unique: true });

countrySchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

countrySchema.statics.getCountriesByCompany = async function(companyId) {
    return await this.find({ 
        company: companyId, 
        isActive: true 
    }).sort({ name: 1 });
};

countrySchema.statics.searchCountries = async function(companyId, searchTerm) {
    return await this.find({
        company: companyId,
        isActive: true,
        $or: [
            { name: { $regex: searchTerm, $options: 'i' } },
            { code: { $regex: searchTerm, $options: 'i' } }
        ]
    }).sort({ name: 1 });
};

module.exports = mongoose.model('Country', countrySchema);
