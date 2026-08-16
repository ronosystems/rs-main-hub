const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
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
    category: {
        type: String,
        enum: ['Phones', 'Electronics', 'Accessories'],
        required: true
    },
    brand: {
        type: String,
        required: true,
        trim: true
    },
    model: {
        type: String,
        required: true,
        trim: true
    },
    ram: {
        type: String,
        trim: true
    },
    rom: {
        type: String,
        trim: true
    },
    imei: {
        type: String,
        trim: true,
        sparse: true
    },
    serialNumber: {
        type: String,
        trim: true,
        sparse: true
    },
    barcode: {
        type: String,
        trim: true,
        sparse: true
    },
    sku: {
        type: String,
        trim: true,
        sparse: true
    },
    // ✅ ADD IMAGE FIELD
    image: {
        type: String,
        default: ''
    },
    price: {
        purchase: {
            type: Number,
            required: true,
            min: 0
        },
        sale: {
            type: Number,
            required: true,
            min: 0
        },
        best: {
            type: Number,
            min: 0
        }
    },
    stock: {
        quantity: {
            type: Number,
            default: 0,
            min: 0
        },
        minLevel: {
            type: Number,
            default: 5,
            min: 0
        }
    },
    units: [{
        identifier: {
            type: String,
            required: true,
            trim: true
        },
        status: {
            type: String,
            enum: ['available', 'sold', 'reserved', 'repair'],
            default: 'available'
        },
        branch: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Branch',
            default: null
        },
        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        assignedToType: {
            type: String,
            enum: ['user', 'branch', null],
            default: null
        },
        customer: {
            name: { type: String, default: '' },
            phone: { type: String, default: '' },
            id: { type: String, default: '' },
            kinName: { type: String, default: '' },
            kinPhone: { type: String, default: '' }
        },
        salePrice: { type: Number, default: null },
        saleType: { 
            type: String, 
            enum: ['cash', 'credit', null],
            default: null 
        },
        soldBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        soldAt: { type: Date, default: null },
        reversedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null
        },
        reversedAt: { type: Date, default: null },
        reverseReason: { type: String, default: '' },
        transferredTo: {
            type: {
                type: String,
                enum: ['user', 'branch', null],
                default: null
            },
            id: {
                type: mongoose.Schema.Types.ObjectId,
                refPath: 'units.transferredTo.type'
            },
            reason: { type: String, default: '' },
            transferredBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            transferredAt: { type: Date, default: null },
            fromBranch: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Branch'
            }
        },
        transferHistory: [{
            type: {
                type: String,
                enum: ['user', 'branch']
            },
            from: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Branch'
            },
            to: {
                type: mongoose.Schema.Types.ObjectId,
                refPath: 'transferHistory.type'
            },
            reason: { type: String, default: '' },
            transferredBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            transferredAt: { type: Date, default: Date.now }
        }],
        createdAt: {
            type: Date,
            default: Date.now
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    }],
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        default: null,
        index: true
    },
    status: {
        type: String,
        enum: ['active', 'inactive'],
        default: 'active'
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

// ============================================
// INDEXES
// ============================================
productSchema.index({ company: 1, category: 1 });
productSchema.index({ company: 1, name: 1 });
productSchema.index({ company: 1, brand: 1 });
productSchema.index({ company: 1, model: 1 });
productSchema.index({ company: 1, 'units.identifier': 1 });
productSchema.index({ company: 1, branch: 1 });
productSchema.index({ company: 1, 'units.branch': 1 });
productSchema.index({ company: 1, 'units.assignedTo': 1 });
productSchema.index({ imei: 1 }, { sparse: true });
productSchema.index({ serialNumber: 1 }, { sparse: true });
productSchema.index({ barcode: 1 }, { sparse: true });
productSchema.index({ sku: 1 }, { sparse: true });
// ✅ ADD INDEX FOR IMAGE
productSchema.index({ image: 1 }, { sparse: true });

// ============================================
// FIXED: PRE-SAVE MIDDLEWARE
// ============================================
productSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    
    if (!this.sku) {
        const prefix = this.category === 'Phones' ? 'PH' : 
                      this.category === 'Electronics' ? 'EL' : 'AC';
        const timestamp = Date.now().toString().slice(-6);
        this.sku = `${prefix}-${timestamp}`;
    }
    next();
});

// ============================================
// VIRTUALS
// ============================================
productSchema.virtual('availableUnits').get(function() {
    if (!this.units) return 0;
    return this.units.filter(u => u.status === 'available').length;
});

productSchema.virtual('soldUnits').get(function() {
    if (!this.units) return 0;
    return this.units.filter(u => u.status === 'sold').length;
});

productSchema.virtual('reservedUnits').get(function() {
    if (!this.units) return 0;
    return this.units.filter(u => u.status === 'reserved').length;
});

productSchema.virtual('repairUnits').get(function() {
    if (!this.units) return 0;
    return this.units.filter(u => u.status === 'repair').length;
});

productSchema.virtual('totalUnits').get(function() {
    if (!this.units) return 0;
    return this.units.length;
});

productSchema.virtual('stockStatus').get(function() {
    if (this.category === 'Accessories') {
        if (!this.stock || this.stock.quantity === 0) return 'out_of_stock';
        if (this.stock.quantity <= this.stock.minLevel) return 'low_stock';
        return 'in_stock';
    } else {
        const available = this.availableUnits;
        if (available === 0) return 'out_of_stock';
        if (available <= 2) return 'low_stock';
        return 'in_stock';
    }
});

// ============================================
// STATIC METHODS
// ============================================
productSchema.statics.getProductsByCompany = async function(companyId) {
    return await this.find({ company: companyId, status: 'active' })
        .populate('branch', 'name code city country currency currencySymbol')
        .sort({ createdAt: -1 });
};

productSchema.statics.getProductsByCategory = async function(companyId, category) {
    return await this.find({ 
        company: companyId, 
        category: category,
        status: 'active' 
    })
    .populate('branch', 'name code city country currency currencySymbol')
    .sort({ createdAt: -1 });
};

productSchema.statics.getProductsByBranch = async function(branchId) {
    return await this.find({ 
        branch: branchId, 
        status: 'active' 
    })
    .populate('branch', 'name code city country currency currencySymbol')
    .sort({ createdAt: -1 });
};

productSchema.statics.getPhonesByBranch = async function(branchId) {
    return await this.find({ 
        branch: branchId,
        category: 'Phones',
        status: 'active' 
    })
    .populate('branch', 'name code city country currency currencySymbol')
    .sort({ createdAt: -1 });
};

productSchema.statics.searchProducts = async function(companyId, searchTerm) {
    return await this.find({
        company: companyId,
        status: 'active',
        $or: [
            { name: { $regex: searchTerm, $options: 'i' } },
            { brand: { $regex: searchTerm, $options: 'i' } },
            { model: { $regex: searchTerm, $options: 'i' } },
            { imei: { $regex: searchTerm, $options: 'i' } },
            { serialNumber: { $regex: searchTerm, $options: 'i' } },
            { barcode: { $regex: searchTerm, $options: 'i' } },
            { sku: { $regex: searchTerm, $options: 'i' } }
        ]
    })
    .populate('branch', 'name code city country currency currencySymbol')
    .sort({ createdAt: -1 });
};

productSchema.statics.getLowStockProducts = async function(companyId) {
    return await this.find({
        company: companyId,
        status: 'active',
        $or: [
            { 
                category: 'Accessories',
                'stock.quantity': { $lte: '$stock.minLevel' }
            },
            {
                category: { $in: ['Phones', 'Electronics'] },
                $expr: { $lte: [{ $size: '$units' }, 2] }
            }
        ]
    })
    .populate('branch', 'name code city country currency currencySymbol');
};

productSchema.statics.getLowStockProductsByBranch = async function(branchId) {
    return await this.find({
        branch: branchId,
        status: 'active',
        $or: [
            { 
                category: 'Accessories',
                'stock.quantity': { $lte: '$stock.minLevel' }
            },
            {
                category: { $in: ['Phones', 'Electronics'] },
                $expr: { $lte: [{ $size: '$units' }, 2] }
            }
        ]
    }).populate('branch', 'name code city country currency currencySymbol');
};

productSchema.statics.findDuplicate = async function(companyId, productData) {
    const { name, brand, model, ram, rom, category } = productData;
    
    const query = {
        company: companyId,
        name: name.trim(),
        brand: brand.trim(),
        model: model.trim(),
        category: category,
        status: 'active'
    };
    
    if (category === 'Phones') {
        query.ram = ram || '';
        query.rom = rom || '';
    }
    
    return await this.findOne(query);
};

// ============================================
// INSTANCE METHODS
// ============================================
productSchema.methods.addUnit = async function(identifier, status = 'available', branchId = null) {
    const existingUnit = this.units.find(u => u.identifier === identifier);
    if (existingUnit) {
        throw new Error('IMEI already exists');
    }
    
    const newUnit = {
        identifier,
        status,
        branch: branchId || this.branch,
        createdAt: new Date(),
        updatedAt: new Date()
    };
    
    this.units.push(newUnit);
    this.markModified('units');
    await this.save();
    return this;
};

productSchema.methods.removeUnit = async function(identifier) {
    const unitIndex = this.units.findIndex(u => u.identifier === identifier);
    if (unitIndex === -1) {
        throw new Error('Unit not found');
    }
    
    if (this.units[unitIndex].status !== 'available') {
        throw new Error('Only available units can be deleted');
    }
    
    this.units.splice(unitIndex, 1);
    this.markModified('units');
    await this.save();
    return this;
};

productSchema.methods.updateUnitStatus = async function(identifier, status) {
    const unitIndex = this.units.findIndex(u => u.identifier === identifier);
    if (unitIndex === -1) {
        throw new Error('Unit not found');
    }
    
    this.units[unitIndex].status = status;
    this.units[unitIndex].updatedAt = new Date();
    this.markModified('units');
    await this.save();
    return this;
};

productSchema.methods.updateUnit = async function(oldIdentifier, newIdentifier, status) {
    const unitIndex = this.units.findIndex(u => u.identifier === oldIdentifier);
    if (unitIndex === -1) {
        throw new Error('Unit not found');
    }
    
    if (newIdentifier && newIdentifier !== oldIdentifier) {
        const existingUnit = this.units.find(u => u.identifier === newIdentifier);
        if (existingUnit) {
            throw new Error('IMEI already exists');
        }
        this.units[unitIndex].identifier = newIdentifier;
    }
    
    if (status && ['available', 'sold', 'reserved', 'repair'].includes(status)) {
        this.units[unitIndex].status = status;
    }
    
    this.units[unitIndex].updatedAt = new Date();
    this.markModified('units');
    await this.save();
    return this;
};

productSchema.methods.sellUnit = async function(identifier, customerData, salePrice, saleType, userId) {
    const unitIndex = this.units.findIndex(u => u.identifier === identifier);
    if (unitIndex === -1) {
        throw new Error('Unit not found');
    }
    
    if (this.units[unitIndex].status !== 'available') {
        throw new Error('Unit is not available for sale');
    }
    
    this.units[unitIndex].status = 'sold';
    this.units[unitIndex].customer = {
        name: customerData.name,
        phone: customerData.phone,
        id: customerData.id,
        kinName: customerData.kinName || '',
        kinPhone: customerData.kinPhone || ''
    };
    this.units[unitIndex].salePrice = salePrice;
    this.units[unitIndex].saleType = saleType || 'cash';
    this.units[unitIndex].soldBy = userId;
    this.units[unitIndex].soldAt = new Date();
    this.units[unitIndex].updatedAt = new Date();
    
    this.markModified('units');
    await this.save();
    return this;
};

productSchema.methods.reverseSale = async function(identifier, reason, userId) {
    const unitIndex = this.units.findIndex(u => u.identifier === identifier);
    if (unitIndex === -1) {
        throw new Error('Unit not found');
    }
    
    if (this.units[unitIndex].status !== 'sold') {
        throw new Error('Unit is not sold');
    }
    
    const customerName = this.units[unitIndex].customer?.name || 'Unknown';
    
    this.units[unitIndex].status = 'available';
    this.units[unitIndex].customer = null;
    this.units[unitIndex].salePrice = null;
    this.units[unitIndex].saleType = null;
    this.units[unitIndex].soldBy = null;
    this.units[unitIndex].soldAt = null;
    this.units[unitIndex].reversedBy = userId;
    this.units[unitIndex].reversedAt = new Date();
    this.units[unitIndex].reverseReason = reason || 'No reason provided';
    this.units[unitIndex].updatedAt = new Date();
    
    this.markModified('units');
    await this.save();
    return this;
};

// ============================================
// TRANSFER UNIT - FIXED
// ============================================
productSchema.methods.transferUnit = async function(identifier, transferType, transferTo, reason, fromBranch, userId) {
    const unitIndex = this.units.findIndex(u => u.identifier === identifier);
    if (unitIndex === -1) {
        throw new Error('Unit not found');
    }

    if (this.units[unitIndex].status !== 'available') {
        throw new Error('Only available units can be transferred');
    }

    if (!this.units[unitIndex].transferHistory) {
        this.units[unitIndex].transferHistory = [];
    }

    this.units[unitIndex].transferHistory.push({
        type: transferType,
        from: fromBranch || this.units[unitIndex].branch || this.branch,
        to: transferTo,
        reason: reason || 'No reason provided',
        transferredBy: userId,
        transferredAt: new Date()
    });

    if (transferType === 'user') {
        this.units[unitIndex].assignedTo = transferTo;
        this.units[unitIndex].assignedToType = 'user';
    } else if (transferType === 'branch') {
        this.units[unitIndex].branch = transferTo;
        this.units[unitIndex].assignedToType = 'branch';
        this.units[unitIndex].assignedTo = null;
    }

    this.units[unitIndex].transferredTo = {
        type: transferType,
        id: transferTo,
        reason: reason || 'No reason provided',
        transferredBy: userId,
        transferredAt: new Date(),
        fromBranch: fromBranch || this.units[unitIndex].branch || this.branch
    };

    this.units[unitIndex].updatedAt = new Date();
    this.updatedAt = new Date();

    this.markModified('units');
    await this.save();
    return this;
};

productSchema.methods.getUnit = function(identifier) {
    return this.units.find(u => u.identifier === identifier);
};

productSchema.methods.getTransferHistory = function(identifier) {
    const unit = this.units.find(u => u.identifier === identifier);
    if (!unit) {
        return null;
    }
    return unit.transferHistory || [];
};

productSchema.methods.getUnitStats = function() {
    const total = this.units.length;
    const available = this.units.filter(u => u.status === 'available').length;
    const sold = this.units.filter(u => u.status === 'sold').length;
    const reserved = this.units.filter(u => u.status === 'reserved').length;
    const repair = this.units.filter(u => u.status === 'repair').length;
    
    return { total, available, sold, reserved, repair };
};

module.exports = mongoose.model('Product', productSchema);