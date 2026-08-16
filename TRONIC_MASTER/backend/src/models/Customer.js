const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true },
    address: { type: String, trim: true },
    totalPurchases: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    lastPurchase: { type: Date },
    notes: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

customerSchema.index({ company: 1, phone: 1 });
customerSchema.index({ company: 1, name: 1 });

module.exports = mongoose.model('Customer', customerSchema);
