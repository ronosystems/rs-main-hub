const mongoose = require('mongoose');
const Counter = require('./Counter');

const saleSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        required: true
    },
    saleNumber: {
        type: String,
        trim: true,
        unique: false
    },
    receiptNumber: {
        type: String,
        trim: true
    },
    customer: {
        name: { type: String, trim: true },
        phone: { type: String, trim: true },
        email: { type: String, trim: true, lowercase: true }
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        productName: { type: String, required: true },
        sku: { type: String, trim: true },
        category: {
            type: String,
            enum: ['Phones', 'Electronics', 'Accessories'],
            required: true
        },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        totalPrice: { type: Number, required: true, min: 0 },
        unitIdentifiers: [{ type: String, trim: true }]
    }],
    subtotal: { type: Number, required: true, min: 0 },
    tax: {
        rate: { type: Number, default: 0 },
        amount: { type: Number, default: 0 }
    },
    discount: {
        type: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
        value: { type: Number, default: 0 },
        amount: { type: Number, default: 0 }
    },
    total: { type: Number, required: true, min: 0 },
    payment: {
        method: {
            type: String,
            enum: ['cash', 'mpesa', 'card', 'bank', 'credit'],
            required: true
        },
        amount: { type: Number, required: true, min: 0 },
        reference: { type: String, trim: true },
        status: {
            type: String,
            enum: ['pending', 'paid', 'partial', 'refunded'],
            default: 'paid'
        },
        change: { type: Number, default: 0 }
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'cancelled', 'refunded'],
        default: 'completed'
    },
    notes: { type: String, trim: true },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

// ============ INDEXES ============
saleSchema.index({ company: 1, saleNumber: 1 }, { unique: true });
saleSchema.index({ company: 1, receiptNumber: 1 }, { unique: true });
saleSchema.index({ company: 1, branch: 1 });
saleSchema.index({ company: 1, createdAt: -1 });
saleSchema.index({ company: 1, status: 1 });

// ============ PRE-SAVE MIDDLEWARE ============
saleSchema.pre('save', async function(next) {
    this.updatedAt = Date.now();
    
    // ✅ Generate saleNumber if not exists
    if (this.isNew && !this.saleNumber) {
        try {
            const seq = await Counter.increment(this.company);
            // ✅ Use numeric format without SALE- prefix (000001, 000002, etc.)
            this.saleNumber = String(seq).padStart(6, '0');
            console.log(`📝 Generated sale number: ${this.saleNumber}`);
        } catch (error) {
            console.error('❌ Error generating sale number:', error);
            const timestamp = Date.now().toString().slice(-6);
            this.saleNumber = timestamp;
        }
    }
    
    // ✅ Generate receiptNumber if not exists
    if (this.isNew && !this.receiptNumber) {
        try {
            // ✅ Use a separate counter or the same one
            // Since we already incremented for saleNumber, we need to increment again
            // Or we can use a different approach
            const seq = await Counter.increment(this.company);
            this.receiptNumber = String(seq).padStart(6, '0');
            console.log(`📝 Generated receipt number: ${this.receiptNumber}`);
        } catch (error) {
            console.error('❌ Error generating receipt number:', error);
            const timestamp = Date.now().toString().slice(-6);
            this.receiptNumber = timestamp;
        }
    }
    
    next();
});

// ============ VIRTUALS ============
saleSchema.virtual('formattedDate').get(function() {
    return this.createdAt.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
});

// ============ STATIC METHODS ============
saleSchema.statics.getSalesByCompany = async function(companyId, limit = 100) {
    return await this.find({ company: companyId })
        .populate('branch', 'name code currency currencySymbol')
        .populate('items.product', 'name sku category')
        .sort({ createdAt: -1 })
        .limit(limit);
};

saleSchema.statics.getSalesByBranch = async function(branchId, limit = 100) {
    return await this.find({ branch: branchId })
        .populate('branch', 'name code currency currencySymbol')
        .populate('items.product', 'name sku category')
        .sort({ createdAt: -1 })
        .limit(limit);
};

saleSchema.statics.getTodaySales = async function(companyId) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    return await this.find({
        company: companyId,
        status: 'completed',
        createdAt: { $gte: startOfDay }
    });
};

saleSchema.statics.getSalesStats = async function(companyId, period = 'today') {
    let startDate;
    const now = new Date();
    
    switch(period) {
        case 'today':
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
        case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
        case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
        default:
            startDate = new Date(now.setHours(0, 0, 0, 0));
    }
    
    const sales = await this.find({
        company: companyId,
        status: 'completed',
        createdAt: { $gte: startDate }
    });
    
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    return {
        totalSales,
        totalRevenue,
        averageOrderValue,
        period,
        sales
    };
};

// Get next sale number without creating a sale
saleSchema.statics.getNextSaleNumber = async function(companyId) {
    const seq = await Counter.getCurrent(companyId);
    const nextSeq = seq + 1;
    return String(nextSeq).padStart(6, '0');
};

module.exports = mongoose.model('Sale', saleSchema);