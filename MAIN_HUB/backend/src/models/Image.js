const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
    // Which entity owns this image
    entityType: {
        type: String,
        enum: ['user', 'company', 'product', 'logo', 'category', 'brand'],
        required: true
    },
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    // Store as Buffer (binary data)
    data: {
        type: Buffer,
        required: true
    },
    contentType: {
        type: String,
        required: true // e.g., 'image/jpeg', 'image/png'
    },
    filename: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    isPrimary: {
        type: Boolean,
        default: false
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    companyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
    }
}, {
    timestamps: true
});

// Indexes for fast queries
imageSchema.index({ entityType: 1, entityId: 1 });
imageSchema.index({ companyId: 1 });
imageSchema.index({ isPrimary: 1 });
imageSchema.index({ entityType: 1, entityId: 1, isPrimary: 1 });

// Virtual for base64 data URL
imageSchema.virtual('dataUrl').get(function() {
    if (!this.data) return null;
    return `data:${this.contentType};base64,${this.data.toString('base64')}`;
});

// Ensure virtuals are included in JSON output
imageSchema.set('toJSON', { 
    virtuals: true,
    transform: function(doc, ret) {
        // Don't send raw buffer in JSON responses (too large)
        delete ret.data;
        return ret;
    }
});

imageSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Image', imageSchema);