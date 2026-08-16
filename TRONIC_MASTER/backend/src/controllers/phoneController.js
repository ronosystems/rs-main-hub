const Product = require('../models/Product');
const mongoose = require('mongoose');

// =============== GET ALL PHONES ===============
exports.getPhones = async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'No company associated with this user'
            });
        }

        const { branch, status, search } = req.query;
        const query = {
            company: companyId,
            category: 'Phones',
            status: 'active'
        };

        if (branch) query.branch = branch;
        if (status) query['units.status'] = status;
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } },
                { model: { $regex: search, $options: 'i' } },
                { 'units.identifier': { $regex: search, $options: 'i' } }
            ];
        }

        const phones = await Product.find(query)
            .populate('branch', 'name code currencySymbol')
            .populate('company', 'name code')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: phones,
            count: phones.length
        });
    } catch (error) {
        console.error('Error fetching phones:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch phones',
            error: error.message
        });
    }
};

// =============== GET SINGLE PHONE ===============
exports.getPhoneById = async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        const { id } = req.params;

        const phone = await Product.findOne({
            _id: id,
            company: companyId,
            category: 'Phones'
        })
        .populate('branch', 'name code currencySymbol')
        .populate('company', 'name code');

        if (!phone) {
            return res.status(404).json({
                success: false,
                message: 'Phone not found'
            });
        }

        res.json({
            success: true,
            data: phone
        });
    } catch (error) {
        console.error('Error fetching phone:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch phone',
            error: error.message
        });
    }
};

// =============== UPDATE PHONE ===============
exports.updatePhone = async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        const { id } = req.params;
        const { brand, model, ram, rom, imei } = req.body;

        const phone = await Product.findOne({
            _id: id,
            company: companyId,
            category: 'Phones'
        });

        if (!phone) {
            return res.status(404).json({
                success: false,
                message: 'Phone not found'
            });
        }

        if (brand) phone.brand = brand;
        if (model) phone.model = model;
        if (ram) phone.ram = ram;
        if (rom) phone.rom = rom;
        
        if (imei && imei !== phone.imei) {
            const existingPhone = await Product.findOne({
                company: companyId,
                imei: imei,
                _id: { $ne: id }
            });
            
            if (existingPhone) {
                return res.status(400).json({
                    success: false,
                    message: 'IMEI number already exists in another phone'
                });
            }
            phone.imei = imei;
        }

        phone.updatedAt = Date.now();
        await phone.save();

        const updatedPhone = await Product.findById(phone._id)
            .populate('branch', 'name code currencySymbol');

        res.json({
            success: true,
            data: updatedPhone,
            message: 'Phone updated successfully'
        });
    } catch (error) {
        console.error('Error updating phone:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update phone',
            error: error.message
        });
    }
};

// =============== DELETE PHONE ===============
exports.deletePhone = async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        const { id } = req.params;

        const phone = await Product.findOne({
            _id: id,
            company: companyId,
            category: 'Phones'
        });

        if (!phone) {
            return res.status(404).json({
                success: false,
                message: 'Phone not found'
            });
        }

        if (phone.units && phone.units.length > 0) {
            const hasAvailableUnits = phone.units.some(u => u.status === 'available');
            if (hasAvailableUnits) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete phone with available units. Please sell or transfer all units first.'
                });
            }
        }

        phone.status = 'inactive';
        phone.updatedAt = Date.now();
        await phone.save();

        res.json({
            success: true,
            message: 'Phone deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting phone:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete phone',
            error: error.message
        });
    }
};

// =============== SELL PHONE ===============
exports.sellPhone = async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        const { id } = req.params;
        const { 
            customerName, 
            customerPhone, 
            customerId,
            kinName,
            kinPhone,
            sellingPrice, 
            saleType,
            branchId 
        } = req.body;

        if (!customerName) {
            return res.status(400).json({
                success: false,
                message: 'Customer name is required'
            });
        }

        if (!sellingPrice || sellingPrice <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid selling price is required'
            });
        }

        const phone = await Product.findOne({
            _id: id,
            company: companyId,
            category: 'Phones'
        });

        if (!phone) {
            return res.status(404).json({
                success: false,
                message: 'Phone not found'
            });
        }

        const unitIndex = phone.units.findIndex(u => u.status === 'available');
        if (unitIndex === -1) {
            return res.status(400).json({
                success: false,
                message: 'No available units to sell'
            });
        }

        const unit = phone.units[unitIndex];

        unit.status = 'sold';
        unit.soldAt = new Date();
        unit.customer = {
            name: customerName,
            phone: customerPhone || '',
            id: customerId || '',
            kinName: kinName || '',
            kinPhone: kinPhone || ''
        };
        unit.salePrice = sellingPrice;
        unit.saleType = saleType || 'cash';
        unit.soldBy = req.user._id;
        unit.updatedAt = new Date();

        // Clear agent assignment when sold
        unit.assignedTo = null;
        unit.assignedToType = null;

        phone.updatedAt = Date.now();
        phone.markModified('units');
        await phone.save();

        const receiptNo = `RCP-${Date.now().toString().slice(-6)}`;

        const saleData = {
            productId: phone._id,
            productName: phone.name,
            brand: phone.brand,
            model: phone.model,
            imei: unit.identifier,
            customerName,
            customerPhone,
            customerId,
            kinName,
            kinPhone,
            sellingPrice,
            saleType: saleType || 'cash',
            branchId: branchId || phone.branch,
            companyId: companyId,
            soldBy: req.user._id,
            soldAt: new Date()
        };

        res.json({
            success: true,
            data: {
                phone: phone,
                unit: unit,
                sale: saleData,
                receiptNo: receiptNo
            },
            message: `Unit ${unit.identifier} sold to ${customerName}`
        });
    } catch (error) {
        console.error('Error selling phone:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to sell phone',
            error: error.message
        });
    }
};

// =============== TRANSFER PHONE - FIXED WITH AUTO-ASSIGN ===============
exports.transferPhone = async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        const { id } = req.params;
        const { imei, toBranchId, toUserId, reason, fromBranch } = req.body;

        console.log('📦 Transfer request:');
        console.log('Product ID:', id);
        console.log('IMEI:', imei);
        console.log('To Branch:', toBranchId);
        console.log('To User:', toUserId);

        if (!toBranchId && !toUserId) {
            return res.status(400).json({
                success: false,
                message: 'Either branch or user is required for transfer'
            });
        }

        const phone = await Product.findOne({
            _id: id,
            company: companyId,
            category: 'Phones'
        });

        if (!phone) {
            return res.status(404).json({
                success: false,
                message: 'Phone not found'
            });
        }

        let unitIndex = -1;
        let unit = null;
        for (let i = 0; i < phone.units.length; i++) {
            if (phone.units[i].identifier === imei) {
                unitIndex = i;
                unit = phone.units[i];
                break;
            }
        }

        if (unitIndex === -1 || !unit) {
            return res.status(404).json({
                success: false,
                message: 'IMEI not found'
            });
        }

        console.log('📋 Found unit:', unit.identifier);
        console.log('Current branch:', unit.branch);
        console.log('Current status:', unit.status);

        if (unit.status !== 'available') {
            return res.status(400).json({
                success: false,
                message: 'Only available units can be transferred'
            });
        }

        let destinationName = '';
        let destinationType = '';
        let destinationId = null;

        // ============================================================
        // ✅ NEW: Check if destination is an agent and auto-assign product
        // ============================================================
        if (toUserId) {
            const User = require('../models/User');
            const userDoc = await User.findOne({
                _id: toUserId,
                company: companyId,
                isActive: true
            });
            if (!userDoc) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found or inactive'
                });
            }
            destinationName = userDoc.name;
            destinationType = 'user';
            destinationId = toUserId;

            console.log(`👤 User found: ${userDoc.name}`);
            console.log(`👤 User role: ${userDoc.companyRole}`);
            console.log(`👤 Current assignedPhones:`, userDoc.assignedPhones);

            // ✅ If transferring to an agent, auto-assign the product
            if (userDoc.companyRole === 'company_agent') {
                if (!userDoc.assignedPhones) {
                    userDoc.assignedPhones = [];
                }
                if (!userDoc.assignedPhones.includes(id)) {
                    userDoc.assignedPhones.push(id);
                    await userDoc.save();
                    console.log(`✅ Product ${id} auto-assigned to agent ${userDoc.name}`);
                    console.log(`✅ New assignedPhones:`, userDoc.assignedPhones);
                } else {
                    console.log(`📱 Product already in agent's assignedPhones`);
                }
            }
        } else if (toBranchId) {
            const Branch = require('../models/Branch');
            const branchDoc = await Branch.findOne({
                _id: toBranchId,
                company: companyId,
                isActive: true
            });
            if (!branchDoc) {
                return res.status(404).json({
                    success: false,
                    message: 'Branch not found or inactive'
                });
            }
            destinationName = branchDoc.name;
            destinationType = 'branch';
            destinationId = toBranchId;
        }

        // Initialize transfer history
        if (!phone.units[unitIndex].transferHistory) {
            phone.units[unitIndex].transferHistory = [];
        }

        // Add to transfer history
        phone.units[unitIndex].transferHistory.push({
            type: destinationType,
            from: fromBranch || unit.branch || phone.branch,
            to: destinationId,
            reason: reason || 'No reason provided',
            transferredBy: req.user._id,
            transferredAt: new Date()
        });

        // Update the unit
        if (destinationType === 'branch') {
            phone.units[unitIndex].branch = destinationId;
            phone.units[unitIndex].assignedToType = 'branch';
            phone.units[unitIndex].assignedTo = null;
        } else if (destinationType === 'user') {
            phone.units[unitIndex].assignedTo = destinationId;
            phone.units[unitIndex].assignedToType = 'user';
        }

        phone.units[unitIndex].transferredTo = {
            type: destinationType,
            id: destinationId,
            reason: reason || 'No reason provided',
            transferredBy: req.user._id,
            transferredAt: new Date(),
            fromBranch: fromBranch || unit.branch || phone.branch
        };

        phone.units[unitIndex].updatedAt = new Date();
        phone.updatedAt = new Date();

        phone.markModified('units');
        await phone.save();

        const updatedPhone = await Product.findById(phone._id)
            .populate('branch', 'name code currencySymbol');

        const updatedUnit = updatedPhone.units.find(u => u.identifier === imei);

        res.json({
            success: true,
            message: `Unit ${imei} transferred to ${destinationType} successfully`,
            data: {
                phone: updatedPhone,
                unit: updatedUnit,
                transferredTo: destinationName,
                transferType: destinationType,
                transferId: destinationId
            }
        });
    } catch (error) {
        console.error('Error transferring phone:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to transfer phone',
            error: error.message
        });
    }
};

// =============== REVERSE SALE ===============
exports.reverseSale = async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        const { id } = req.params;
        const { imei, reason } = req.body;

        console.log('🔄 Reverse sale request:');
        console.log('Product ID:', id);
        console.log('IMEI:', imei);

        const phone = await Product.findOne({
            _id: id,
            company: companyId,
            category: 'Phones'
        });

        if (!phone) {
            return res.status(404).json({
                success: false,
                message: 'Phone not found'
            });
        }

        let unitIndex = -1;
        let unit = null;
        for (let i = 0; i < phone.units.length; i++) {
            if (phone.units[i].identifier === imei) {
                unitIndex = i;
                unit = phone.units[i];
                break;
            }
        }

        if (unitIndex === -1 || !unit) {
            return res.status(404).json({
                success: false,
                message: 'IMEI not found'
            });
        }

        if (unit.status !== 'sold') {
            return res.status(400).json({
                success: false,
                message: `IMEI is not sold. Current status: ${unit.status}`
            });
        }

        const customerName = unit.customer?.name || 'Unknown';

        unit.status = 'available';
        unit.soldAt = null;
        unit.customer = null;
        unit.salePrice = null;
        unit.saleType = null;
        unit.soldBy = null;
        unit.reversedAt = new Date();
        unit.reverseReason = reason || 'No reason provided';
        unit.reversedBy = req.user._id;
        unit.updatedAt = new Date();

        phone.updatedAt = Date.now();
        phone.markModified('units');
        await phone.save();

        const updatedPhone = await Product.findById(phone._id)
            .populate('branch', 'name code currencySymbol');

        const updatedUnit = updatedPhone.units.find(u => u.identifier === imei);

        res.json({
            success: true,
            data: {
                phone: updatedPhone,
                unit: updatedUnit,
                reason: reason || 'No reason provided',
                customerName: customerName
            },
            message: `Sale reversed for ${imei} (Customer: ${customerName})`
        });
    } catch (error) {
        console.error('Error reversing sale:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reverse sale',
            error: error.message
        });
    }
};

// =============== GET PHONE STATS ===============
exports.getPhoneStats = async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'No company associated with this user'
            });
        }

        const phones = await Product.find({
            company: companyId,
            category: 'Phones',
            status: 'active'
        });

        const totalModels = phones.length;
        let totalUnits = 0;
        let availableUnits = 0;
        let soldUnits = 0;

        phones.forEach(phone => {
            if (phone.units) {
                totalUnits += phone.units.length;
                availableUnits += phone.units.filter(u => u.status === 'available').length;
                soldUnits += phone.units.filter(u => u.status === 'sold').length;
            }
        });

        const branchStats = {};
        phones.forEach(phone => {
            const branchId = phone.branch?.toString() || 'unassigned';
            if (!branchStats[branchId]) {
                branchStats[branchId] = {
                    name: phone.branch?.name || 'Unassigned',
                    count: 0,
                    units: 0,
                    available: 0
                };
            }
            branchStats[branchId].count++;
            if (phone.units) {
                branchStats[branchId].units += phone.units.length;
                branchStats[branchId].available += phone.units.filter(u => u.status === 'available').length;
            }
        });

        res.json({
            success: true,
            data: {
                totalModels,
                totalUnits,
                availableUnits,
                soldUnits,
                branchStats: Object.values(branchStats)
            }
        });
    } catch (error) {
        console.error('Error fetching phone stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch phone stats',
            error: error.message
        });
    }
};