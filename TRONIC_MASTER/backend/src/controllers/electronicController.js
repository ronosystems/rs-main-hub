// /home/kk/RS/TRONIC_MASTER/backend/src/controllers/electronicController.js

const Product = require('../models/Product');
const mongoose = require('mongoose');

// =============== GET ALL ELECTRONICS ===============
exports.getElectronics = async (req, res) => {
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
            category: 'Electronics',
            status: 'active'
        };

        if (branch) query.branch = branch;
        if (status) query['units.status'] = status;
        
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { brand: { $regex: search, $options: 'i' } },
                { model: { $regex: search, $options: 'i' } },
                { 'units.identifier': { $regex: search, $options: 'i' } },
                { sku: { $regex: search, $options: 'i' } }
            ];
        }

        const electronics = await Product.find(query)
            .populate('branch', 'name code currencySymbol')
            .populate('company', 'name code')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: electronics,
            count: electronics.length
        });
    } catch (error) {
        console.error('Error fetching electronics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch electronics',
            error: error.message
        });
    }
};

// =============== GET SINGLE ELECTRONIC ===============
exports.getElectronicById = async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        const { id } = req.params;

        const electronic = await Product.findOne({
            _id: id,
            company: companyId,
            category: 'Electronics'
        })
        .populate('branch', 'name code currencySymbol')
        .populate('company', 'name code');

        if (!electronic) {
            return res.status(404).json({
                success: false,
                message: 'Electronic product not found'
            });
        }

        res.json({
            success: true,
            data: electronic
        });
    } catch (error) {
        console.error('Error fetching electronic:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch electronic',
            error: error.message
        });
    }
};

// =============== UPDATE ELECTRONIC ===============
exports.updateElectronic = async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        const { id } = req.params;
        const { brand, model, ram, rom, sku, serialNumber } = req.body;

        const electronic = await Product.findOne({
            _id: id,
            company: companyId,
            category: 'Electronics'
        });

        if (!electronic) {
            return res.status(404).json({
                success: false,
                message: 'Electronic product not found'
            });
        }

        if (brand) electronic.brand = brand;
        if (model) electronic.model = model;
        if (ram) electronic.ram = ram;
        if (rom) electronic.rom = rom;
        if (sku) electronic.sku = sku;
        
        if (serialNumber && serialNumber !== electronic.serialNumber) {
            const existingElectronic = await Product.findOne({
                company: companyId,
                serialNumber: serialNumber,
                _id: { $ne: id }
            });
            
            if (existingElectronic) {
                return res.status(400).json({
                    success: false,
                    message: 'Serial number already exists in another product'
                });
            }
            electronic.serialNumber = serialNumber;
        }

        electronic.updatedAt = Date.now();
        await electronic.save();

        const updatedElectronic = await Product.findById(electronic._id)
            .populate('branch', 'name code currencySymbol');

        res.json({
            success: true,
            data: updatedElectronic,
            message: 'Electronic updated successfully'
        });
    } catch (error) {
        console.error('Error updating electronic:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update electronic',
            error: error.message
        });
    }
};

// =============== DELETE ELECTRONIC ===============
exports.deleteElectronic = async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        const { id } = req.params;

        const electronic = await Product.findOne({
            _id: id,
            company: companyId,
            category: 'Electronics'
        });

        if (!electronic) {
            return res.status(404).json({
                success: false,
                message: 'Electronic product not found'
            });
        }

        if (electronic.units && electronic.units.length > 0) {
            const hasAvailableUnits = electronic.units.some(u => u.status === 'available');
            if (hasAvailableUnits) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete product with available units. Please sell or transfer all units first.'
                });
            }
        }

        electronic.status = 'inactive';
        electronic.updatedAt = Date.now();
        await electronic.save();

        res.json({
            success: true,
            message: 'Electronic deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting electronic:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete electronic',
            error: error.message
        });
    }
};

// =============== SELL ELECTRONIC ===============
exports.sellElectronic = async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        const { id } = req.params;
        const { 
            serial,
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

        const electronic = await Product.findOne({
            _id: id,
            company: companyId,
            category: 'Electronics'
        });

        if (!electronic) {
            return res.status(404).json({
                success: false,
                message: 'Electronic product not found'
            });
        }

        const unitIndex = electronic.units.findIndex(u => u.identifier === serial);
        if (unitIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Serial number not found'
            });
        }

        const unit = electronic.units[unitIndex];

        if (unit.status !== 'available') {
            return res.status(400).json({
                success: false,
                message: `Serial is not available for sale. Current status: ${unit.status}`
            });
        }

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

        electronic.updatedAt = Date.now();
        electronic.markModified('units');
        await electronic.save();

        const receiptNo = `RCP-${Date.now().toString().slice(-6)}`;

        const saleData = {
            productId: electronic._id,
            productName: electronic.name,
            brand: electronic.brand,
            model: electronic.model,
            serial: unit.identifier,
            customerName,
            customerPhone,
            customerId,
            kinName,
            kinPhone,
            sellingPrice,
            saleType: saleType || 'cash',
            branchId: branchId || electronic.branch,
            companyId: companyId,
            soldBy: req.user._id,
            soldAt: new Date()
        };

        res.json({
            success: true,
            data: {
                electronic: electronic,
                unit: unit,
                sale: saleData,
                receiptNo: receiptNo
            },
            message: `Serial ${unit.identifier} sold to ${customerName}`
        });
    } catch (error) {
        console.error('Error selling electronic:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to sell electronic',
            error: error.message
        });
    }
};

// =============== TRANSFER ELECTRONIC ===============
exports.transferElectronic = async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        const { id } = req.params;
        const { serial, toBranchId, toUserId, reason, fromBranch } = req.body;

        console.log('📦 Transfer request:');
        console.log('Product ID:', id);
        console.log('Serial:', serial);
        console.log('To Branch:', toBranchId);
        console.log('To User:', toUserId);

        if (!toBranchId && !toUserId) {
            return res.status(400).json({
                success: false,
                message: 'Either branch or user is required for transfer'
            });
        }

        const electronic = await Product.findOne({
            _id: id,
            company: companyId,
            category: 'Electronics'
        });

        if (!electronic) {
            return res.status(404).json({
                success: false,
                message: 'Electronic product not found'
            });
        }

        let unitIndex = -1;
        let unit = null;
        for (let i = 0; i < electronic.units.length; i++) {
            if (electronic.units[i].identifier === serial) {
                unitIndex = i;
                unit = electronic.units[i];
                break;
            }
        }

        if (unitIndex === -1 || !unit) {
            return res.status(404).json({
                success: false,
                message: 'Serial number not found'
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

            // If transferring to an agent, auto-assign the product
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
        if (!electronic.units[unitIndex].transferHistory) {
            electronic.units[unitIndex].transferHistory = [];
        }

        // Add to transfer history
        electronic.units[unitIndex].transferHistory.push({
            type: destinationType,
            from: fromBranch || unit.branch || electronic.branch,
            to: destinationId,
            reason: reason || 'No reason provided',
            transferredBy: req.user._id,
            transferredAt: new Date()
        });

        // Update the unit
        if (destinationType === 'branch') {
            electronic.units[unitIndex].branch = destinationId;
            electronic.units[unitIndex].assignedToType = 'branch';
            electronic.units[unitIndex].assignedTo = null;
        } else if (destinationType === 'user') {
            electronic.units[unitIndex].assignedTo = destinationId;
            electronic.units[unitIndex].assignedToType = 'user';
        }

        electronic.units[unitIndex].transferredTo = {
            type: destinationType,
            id: destinationId,
            reason: reason || 'No reason provided',
            transferredBy: req.user._id,
            transferredAt: new Date(),
            fromBranch: fromBranch || unit.branch || electronic.branch
        };

        electronic.units[unitIndex].updatedAt = new Date();
        electronic.updatedAt = new Date();

        electronic.markModified('units');
        await electronic.save();

        const updatedElectronic = await Product.findById(electronic._id)
            .populate('branch', 'name code currencySymbol');

        const updatedUnit = updatedElectronic.units.find(u => u.identifier === serial);

        res.json({
            success: true,
            message: `Serial ${serial} transferred to ${destinationType} successfully`,
            data: {
                electronic: updatedElectronic,
                unit: updatedUnit,
                transferredTo: destinationName,
                transferType: destinationType,
                transferId: destinationId
            }
        });
    } catch (error) {
        console.error('Error transferring electronic:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to transfer electronic',
            error: error.message
        });
    }
};

// =============== REVERSE SALE ===============
exports.reverseSale = async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        const { id } = req.params;
        const { serial, reason } = req.body;

        console.log('🔄 Reverse sale request:');
        console.log('Product ID:', id);
        console.log('Serial:', serial);

        const electronic = await Product.findOne({
            _id: id,
            company: companyId,
            category: 'Electronics'
        });

        if (!electronic) {
            return res.status(404).json({
                success: false,
                message: 'Electronic product not found'
            });
        }

        let unitIndex = -1;
        let unit = null;
        for (let i = 0; i < electronic.units.length; i++) {
            if (electronic.units[i].identifier === serial) {
                unitIndex = i;
                unit = electronic.units[i];
                break;
            }
        }

        if (unitIndex === -1 || !unit) {
            return res.status(404).json({
                success: false,
                message: 'Serial number not found'
            });
        }

        if (unit.status !== 'sold') {
            return res.status(400).json({
                success: false,
                message: `Serial is not sold. Current status: ${unit.status}`
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

        electronic.updatedAt = Date.now();
        electronic.markModified('units');
        await electronic.save();

        const updatedElectronic = await Product.findById(electronic._id)
            .populate('branch', 'name code currencySymbol');

        const updatedUnit = updatedElectronic.units.find(u => u.identifier === serial);

        res.json({
            success: true,
            data: {
                electronic: updatedElectronic,
                unit: updatedUnit,
                reason: reason || 'No reason provided',
                customerName: customerName
            },
            message: `Sale reversed for ${serial} (Customer: ${customerName})`
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

// =============== GET ELECTRONIC STATS ===============
exports.getElectronicStats = async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'No company associated with this user'
            });
        }

        const electronics = await Product.find({
            company: companyId,
            category: 'Electronics',
            status: 'active'
        });

        const totalModels = electronics.length;
        let totalUnits = 0;
        let availableUnits = 0;
        let soldUnits = 0;

        electronics.forEach(electronic => {
            if (electronic.units) {
                totalUnits += electronic.units.length;
                availableUnits += electronic.units.filter(u => u.status === 'available').length;
                soldUnits += electronic.units.filter(u => u.status === 'sold').length;
            }
        });

        const branchStats = {};
        electronics.forEach(electronic => {
            const branchId = electronic.branch?.toString() || 'unassigned';
            if (!branchStats[branchId]) {
                branchStats[branchId] = {
                    name: electronic.branch?.name || 'Unassigned',
                    count: 0,
                    units: 0,
                    available: 0
                };
            }
            branchStats[branchId].count++;
            if (electronic.units) {
                branchStats[branchId].units += electronic.units.length;
                branchStats[branchId].available += electronic.units.filter(u => u.status === 'available').length;
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
        console.error('Error fetching electronic stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch electronic stats',
            error: error.message
        });
    }
};

// =============== GET SERIALS FOR ELECTRONIC ===============
exports.getSerials = async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        const { id } = req.params;

        const electronic = await Product.findOne({
            _id: id,
            company: companyId,
            category: 'Electronics'
        });

        if (!electronic) {
            return res.status(404).json({
                success: false,
                message: 'Electronic product not found'
            });
        }

        res.json({
            success: true,
            data: electronic.units || [],
            count: electronic.units?.length || 0
        });
    } catch (error) {
        console.error('Error fetching serials:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch serials',
            error: error.message
        });
    }
};

// =============== GET SINGLE SERIAL ===============
exports.getSerialById = async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        const { id, serial } = req.params;

        const electronic = await Product.findOne({
            _id: id,
            company: companyId,
            category: 'Electronics'
        });

        if (!electronic) {
            return res.status(404).json({
                success: false,
                message: 'Electronic product not found'
            });
        }

        const unit = electronic.units.find(u => u.identifier === serial);
        if (!unit) {
            return res.status(404).json({
                success: false,
                message: 'Serial number not found'
            });
        }

        res.json({
            success: true,
            data: unit
        });
    } catch (error) {
        console.error('Error fetching serial:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch serial',
            error: error.message
        });
    }
};

// =============== UPDATE SERIAL ===============
exports.updateSerial = async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        const { id, serial } = req.params;
        const { newSerial, status } = req.body;

        console.log('📝 Updating serial:');
        console.log('Product ID:', id);
        console.log('Old Serial:', serial);
        console.log('New Serial:', newSerial);
        console.log('New Status:', status);

        const electronic = await Product.findOne({
            _id: id,
            company: companyId,
            category: 'Electronics'
        });

        if (!electronic) {
            return res.status(404).json({
                success: false,
                message: 'Electronic product not found'
            });
        }

        const unitIndex = electronic.units.findIndex(u => u.identifier === serial);
        if (unitIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Serial number not found'
            });
        }

        const unit = electronic.units[unitIndex];

        if (newSerial && newSerial !== serial) {
            const existingUnit = electronic.units.find(u => u.identifier === newSerial);
            if (existingUnit) {
                return res.status(400).json({
                    success: false,
                    message: 'Serial number already exists'
                });
            }
            unit.identifier = newSerial;
        }

        if (status && ['available', 'sold', 'reserved', 'repair'].includes(status)) {
            unit.status = status;
        }

        unit.updatedAt = new Date();
        electronic.updatedAt = Date.now();
        electronic.markModified('units');
        await electronic.save();

        console.log('✅ Serial updated successfully');

        res.json({
            success: true,
            message: 'Serial updated successfully',
            data: unit
        });
    } catch (error) {
        console.error('Error updating serial:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update serial',
            error: error.message
        });
    }
};

// =============== DELETE SERIAL ===============
exports.deleteSerial = async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        const { id, serial } = req.params;

        const electronic = await Product.findOne({
            _id: id,
            company: companyId,
            category: 'Electronics'
        });

        if (!electronic) {
            return res.status(404).json({
                success: false,
                message: 'Electronic product not found'
            });
        }

        const unitIndex = electronic.units.findIndex(u => u.identifier === serial);
        if (unitIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Serial number not found'
            });
        }

        if (electronic.units[unitIndex].status !== 'available') {
            return res.status(400).json({
                success: false,
                message: 'Only available serials can be deleted'
            });
        }

        electronic.units.splice(unitIndex, 1);
        electronic.updatedAt = Date.now();
        electronic.markModified('units');
        await electronic.save();

        res.json({
            success: true,
            message: 'Serial deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting serial:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete serial',
            error: error.message
        });
    }
};