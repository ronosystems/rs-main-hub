const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    company: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
    orderNumber: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer' },
    customerName: { type: String, trim: true },
    customerPhone: { type: String, trim: true },
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        productName: { type: String, required: true },
        sku: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        totalPrice: { type: Number, required: true, min: 0 }
    }],
    subtotal: { type: Number, required: true, min: 0 },
    tax: {
        rate: { type: Number, default: 16 },
        amount: { type: Number, default: 0 }
    },
    discount: {
        type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
        value: { type: Number, default: 0 },
        amount: { type: Number, default: 0 }
    },
    total: { type: Number, required: true, min: 0 },
    payment: {
        method: { type: String, enum: ['cash', 'mpesa', 'card', 'bank', 'credit'], required: true },
        status: { type: String, enum: ['pending', 'paid', 'partial', 'refunded'], default: 'pending' },
        amountPaid: { type: Number, default: 0 },
        reference: { type: String, trim: true }
    },
    status: { type: String, enum: ['pending', 'processing', 'completed', 'cancelled', 'refunded'], default: 'pending' },
    orderType: { type: String, enum: ['pos', 'online', 'wholesale'], default: 'pos' },
    notes: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

orderSchema.index({ company: 1, orderNumber: 1 }, { unique: true });
orderSchema.index({ company: 1, status: 1 });
orderSchema.index({ company: 1, createdAt: -1 });

orderSchema.pre('save', async function(next) {
    if (this.isNew && !this.orderNumber) {
        const Order = mongoose.model('Order');
        const count = await Order.countDocuments({ company: this.company });
        const paddedNumber = String(count + 1).padStart(6, '0');
        this.orderNumber = `ORD-${paddedNumber}`;
    }
    this.updatedAt = Date.now();
    next();
});

orderSchema.statics.getTodaySales = async function(companyId) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    return await this.find({
        company: companyId,
        createdAt: { $gte: startOfDay },
        status: 'completed'
    });
};

module.exports = mongoose.model('Order', orderSchema);
