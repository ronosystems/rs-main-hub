const mongoose = require('mongoose');

const citySchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    country: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Country',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    code: {
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

citySchema.index({ company: 1, country: 1, name: 1 }, { unique: true });
citySchema.index({ company: 1, country: 1 });

citySchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

citySchema.statics.getCitiesByCountry = async function(companyId, countryId) {
    return await this.find({ 
        company: companyId, 
        country: countryId,
        isActive: true 
    }).sort({ name: 1 });
};

citySchema.statics.getCitiesByCompany = async function(companyId) {
    return await this.find({ 
        company: companyId, 
        isActive: true 
    })
    .populate('country', 'name code')
    .sort({ name: 1 });
};

citySchema.statics.searchCities = async function(companyId, searchTerm) {
    return await this.find({
        company: companyId,
        isActive: true,
        $or: [
            { name: { $regex: searchTerm, $options: 'i' } },
            { code: { $regex: searchTerm, $options: 'i' } }
        ]
    })
    .populate('country', 'name code')
    .sort({ name: 1 });
};

module.exports = mongoose.model('City', citySchema);
