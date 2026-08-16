const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    icon: { type: String, default: '📱' },
    color: { type: String, default: '#0d6efd' },
    parentCategory: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

categorySchema.index({ company: 1, name: 1 }, { unique: true });

categorySchema.statics.getDefaultCategories = function() {
    return [
        { name: 'Smartphones', icon: '📱', color: '#0d6efd' },
        { name: 'Laptops', icon: '💻', color: '#6c757d' },
        { name: 'Tablets', icon: '📋', color: '#20c997' },
        { name: 'Accessories', icon: '🎧', color: '#fd7e14' },
        { name: 'Smartwatches', icon: '⌚', color: '#198754' },
        { name: 'Headphones', icon: '🎵', color: '#6f42c1' },
        { name: 'Gaming', icon: '🎮', color: '#dc3545' },
        { name: 'Cameras', icon: '📷', color: '#ffc107' },
        { name: 'TV & Home Theater', icon: '📺', color: '#17a2b8' },
        { name: 'Networking', icon: '🌐', color: '#8b5cf6' },
        { name: 'Cables & Chargers', icon: '🔌', color: '#fd7e14' },
        { name: 'Cases & Covers', icon: '🛡️', color: '#20c997' }
    ];
};

module.exports = mongoose.model('Category', categorySchema);
