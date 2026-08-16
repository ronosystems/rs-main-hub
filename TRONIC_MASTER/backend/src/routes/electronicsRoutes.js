// /home/kk/RS/TRONIC_MASTER/backend/src/routes/electronicsRoutes.js

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Product = require('../models/Product');
const User = require('../models/User');
const Branch = require('../models/Branch');

// ============================================
// ===== SPECIFIC ROUTES (MUST COME FIRST) ====
// ============================================

// ✅ GET /api/electronics/assigned - Get electronics assigned to current agent
router.get('/assigned', protect, async (req, res) => {
    try {
        const user = req.user;
        
        console.log('========================================');
        console.log(`🔍 Agent ${user.email} requesting assigned electronics`);
        console.log(`📋 User role: ${user.companyRole}`);
        console.log(`📋 Assigned products array:`, user.assignedPhones);
        console.log(`📋 Array length: ${user.assignedPhones?.length || 0}`);
        console.log('========================================');
        
        if (user.companyRole !== 'company_agent') {
            return res.status(403).json({
                success: false,
                message: 'Only agents can access assigned products'
            });
        }

        if (!user.assignedPhones || user.assignedPhones.length === 0) {
            console.log(`📱 Agent ${user.email} has no assigned products`);
            return res.json({
                success: true,
                data: [],
                count: 0,
                totalUnits: 0,
                message: 'No products assigned to this agent'
            });
        }

        console.log(`📱 Agent has ${user.assignedPhones.length} assigned product IDs`);

        const products = await Product.find({
            _id: { $in: user.assignedPhones },
            status: 'active',
            category: 'Electronics'
        })
        .populate('branch', 'name code city')
        .lean();

        console.log(`📱 Found ${products.length} products matching assigned IDs`);

        const filteredProducts = products.map(product => {
            console.log(`📱 Processing: ${product.brand} ${product.model}`);
            console.log(`   - Total units: ${product.units?.length || 0}`);
            
            const assignedUnits = (product.units || []).filter(unit => {
                const isAssignedToAgent = unit.assignedTo && 
                       unit.assignedTo.toString() === user._id.toString() &&
                       unit.assignedToType === 'user';
                const isAvailable = unit.status === 'available';
                
                if (isAssignedToAgent && isAvailable) {
                    console.log(`   ✅ Found assigned unit: ${unit.identifier}`);
                    return true;
                }
                return false;
            });

            console.log(`   - Assigned units: ${assignedUnits.length}`);

            if (assignedUnits.length > 0) {
                return {
                    ...product,
                    units: assignedUnits
                };
            }
            
            const availableUnits = (product.units || []).filter(u => u.status === 'available');
            if (availableUnits.length > 0) {
                console.log(`   ⚠️ No specific unit assignment, showing ${availableUnits.length} available units as fallback`);
                return {
                    ...product,
                    units: availableUnits
                };
            }
            
            return null;
        }).filter(p => p !== null);

        const totalUnits = filteredProducts.reduce((sum, p) => sum + p.units.length, 0);
        console.log(`✅ Total assigned serials: ${totalUnits}`);
        console.log('========================================');

        res.json({
            success: true,
            data: filteredProducts,
            count: filteredProducts.length,
            totalUnits: totalUnits
        });
    } catch (error) {
        console.error('Error fetching assigned electronics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch assigned products',
            error: error.message
        });
    }
});

// ✅ GET /api/electronics/branch/:branchId - Get electronics for a branch
router.get('/branch/:branchId', protect, async (req, res) => {
    try {
        const { branchId } = req.params;
        const companyId = req.user.company;

        const products = await Product.find({
            company: companyId,
            category: 'Electronics',
            status: 'active'
        })
        .populate('branch', 'name code city country countryCode currency currencySymbol')
        .lean();

        const filteredProducts = products.map(product => {
            const unitsInBranch = product.units.filter(unit => {
                if (unit.branch && unit.branch.toString() === branchId) {
                    return true;
                }
                if (!unit.branch && product.branch && product.branch._id.toString() === branchId) {
                    return true;
                }
                return false;
            });

            if (unitsInBranch.length > 0) {
                return {
                    ...product,
                    units: unitsInBranch
                };
            }
            return null;
        });

        const finalProducts = filteredProducts.filter(product => product !== null);

        res.json({
            success: true,
            data: finalProducts
        });
    } catch (error) {
        console.error('Error fetching electronics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products'
        });
    }
});

// ✅ GET /api/electronics/company - Get all electronics for a company
router.get('/company', protect, async (req, res) => {
    try {
        const companyId = req.user.company;

        const products = await Product.find({
            company: companyId,
            category: 'Electronics',
            status: 'active'
        })
        .populate('branch', 'name code city country countryCode currency currencySymbol')
        .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Error fetching electronics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch products'
        });
    }
});

// ✅ GET /api/electronics/available-users - Get users for transfer
router.get('/available-users', protect, async (req, res) => {
    try {
        const companyId = req.user.company;
        const currentUserId = req.user._id;

        const users = await User.find({
            company: companyId,
            isActive: true,
            _id: { $ne: currentUserId }
        })
        .select('name email phone profilePicture companyRole role isActive assignedPhones')
        .sort({ name: 1 });

        res.json({
            success: true,
            data: users
        });
    } catch (error) {
        console.error('Error fetching available users:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch users'
        });
    }
});

// ✅ GET /api/electronics/available-branches - Get branches for transfer
router.get('/available-branches', protect, async (req, res) => {
    try {
        const companyId = req.user.company;
        const currentBranch = req.user.branch;

        const branches = await Branch.find({
            company: companyId,
            isActive: true,
            _id: { $ne: currentBranch }
        })
        .select('name code city country countryCode currency currencySymbol')
        .sort({ name: 1 });

        res.json({
            success: true,
            data: branches
        });
    } catch (error) {
        console.error('Error fetching available branches:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch branches'
        });
    }
});

// ✅ GET /api/electronics/branches-with-currency - Get all branches with currency
router.get('/branches-with-currency', protect, async (req, res) => {
    try {
        const companyId = req.user.company;

        const branches = await Branch.find({
            company: companyId,
            isActive: true
        })
        .select('name code city country countryCode currency currencySymbol')
        .sort({ name: 1 });

        res.json({
            success: true,
            data: branches
        });
    } catch (error) {
        console.error('Error fetching branches with currency:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch branches'
        });
    }
});

// ✅ GET /api/electronics/currency/:countryCode - Get currency for a country
router.get('/currency/:countryCode', protect, async (req, res) => {
    try {
        const { countryCode } = req.params;
        const currencyInfo = Branch.getCurrencyForCountry(countryCode);

        res.json({
            success: true,
            data: currencyInfo
        });
    } catch (error) {
        console.error('Error fetching currency:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch currency'
        });
    }
});

// ✅ GET /api/electronics/countries-currencies - Get all countries with currencies
router.get('/countries-currencies', protect, async (req, res) => {
    try {
        const countries = Branch.getCountriesWithCurrencies();

        res.json({
            success: true,
            data: countries
        });
    } catch (error) {
        console.error('Error fetching countries:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch countries'
        });
    }
});

// ============================================
// ===== GENERIC ROUTES (MUST COME LAST) =====
// ============================================

// ✅ GET /api/electronics/:id - Get single electronic
router.get('/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.company;

        const product = await Product.findOne({
            _id: id,
            company: companyId,
            category: 'Electronics'
        })
        .populate('branch', 'name code city country countryCode currency currencySymbol');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Error fetching electronic:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch product'
        });
    }
});

// ✅ POST /api/electronics/:id/sell - Sell an electronic
router.post('/:id/sell', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            serial, 
            customerName, 
            customerPhone, 
            customerId, 
            kinName, 
            kinPhone, 
            sellingPrice, 
            saleType 
        } = req.body;

        const companyId = req.user.company;

        const product = await Product.findOne({
            _id: id,
            company: companyId,
            category: 'Electronics'
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const unitIndex = product.units.findIndex(u => u.identifier === serial);
        if (unitIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Serial number not found'
            });
        }

        const unit = product.units[unitIndex];

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
            phone: customerPhone,
            id: customerId,
            kinName: kinName || '',
            kinPhone: kinPhone || ''
        };
        unit.salePrice = sellingPrice;
        unit.saleType = saleType || 'cash';
        unit.soldBy = req.user._id;
        unit.updatedAt = new Date();

        unit.assignedTo = null;
        unit.assignedToType = null;

        product.markModified('units');
        await product.save();

        const receiptNo = `RCP-${Date.now().toString().slice(-6)}`;

        res.json({
            success: true,
            message: 'Electronic sold successfully',
            receiptNo: receiptNo,
            data: unit
        });
    } catch (error) {
        console.error('❌ Error selling electronic:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to sell electronic: ' + error.message
        });
    }
});

// ✅ POST /api/electronics/:id/reverse - Reverse a sale
router.post('/:id/reverse', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { serial, reason } = req.body;

        const companyId = req.user.company;

        const product = await Product.findOne({
            _id: id,
            company: companyId,
            category: 'Electronics'
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const unitIndex = product.units.findIndex(u => u.identifier === serial);
        if (unitIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Serial number not found'
            });
        }

        const unit = product.units[unitIndex];

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

        product.markModified('units');
        await product.save();

        const updatedProduct = await Product.findById(id)
            .populate('branch', 'name code city country countryCode currency currencySymbol');

        const updatedUnit = updatedProduct.units.find(u => u.identifier === serial);

        res.json({
            success: true,
            message: `Sale reversed successfully for ${customerName}`,
            data: updatedUnit
        });
    } catch (error) {
        console.error('❌ Error reversing sale:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reverse sale: ' + error.message
        });
    }
});

// ✅ POST /api/electronics/:id/transfer-unit - Transfer a unit with auto-assign
router.post('/:id/transfer-unit', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            serial, 
            transferType, 
            transferTo, 
            reason, 
            fromBranch 
        } = req.body;

        console.log('📦 Transfer request:');
        console.log('Serial:', serial);
        console.log('Transfer Type:', transferType);
        console.log('Transfer To:', transferTo);

        const companyId = req.user.company;

        if (!['user', 'branch'].includes(transferType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid transfer type'
            });
        }

        if (!transferTo) {
            return res.status(400).json({
                success: false,
                message: 'Transfer destination is required'
            });
        }

        let destinationName = '';
        let destinationType = '';
        let destinationId = null;

        const product = await Product.findOne({
            _id: id,
            company: companyId,
            category: 'Electronics'
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const unitIndex = product.units.findIndex(u => u.identifier === serial);
        if (unitIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Serial number not found'
            });
        }

        if (product.units[unitIndex].status !== 'available') {
            return res.status(400).json({
                success: false,
                message: 'Only available serials can be transferred'
            });
        }

        if (transferType === 'user') {
            const user = await User.findOne({
                _id: transferTo,
                company: companyId,
                isActive: true
            });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found or inactive'
                });
            }
            destinationName = user.name;
            destinationType = 'user';
            destinationId = transferTo;

            console.log(`👤 Transferring to user: ${user.name}`);
            console.log(`👤 User role: ${user.companyRole}`);

            if (user.companyRole === 'company_agent') {
                product.units[unitIndex].assignedTo = transferTo;
                product.units[unitIndex].assignedToType = 'user';
                product.units[unitIndex].assignedAt = new Date();
                product.units[unitIndex].assignedBy = req.user._id;
                
                console.log(`✅ Unit ${serial} assigned to agent ${user.name}`);

                if (!user.assignedPhones) {
                    user.assignedPhones = [];
                }
                if (!user.assignedPhones.includes(id)) {
                    user.assignedPhones.push(id);
                    await user.save();
                    console.log(`✅ Product ${id} added to agent's assignedPhones`);
                } else {
                    console.log(`📱 Product already in agent's assignedPhones`);
                }
            }
        } else if (transferType === 'branch') {
            const branch = await Branch.findOne({
                _id: transferTo,
                company: companyId,
                isActive: true
            });
            if (!branch) {
                return res.status(404).json({
                    success: false,
                    message: 'Branch not found or inactive'
                });
            }
            destinationName = branch.name;
            destinationType = 'branch';
            destinationId = transferTo;
            
            product.units[unitIndex].branch = transferTo;
            product.units[unitIndex].assignedToType = 'branch';
            product.units[unitIndex].assignedTo = null;
        }

        if (!product.units[unitIndex].transferHistory) {
            product.units[unitIndex].transferHistory = [];
        }

        product.units[unitIndex].transferHistory.push({
            type: transferType,
            from: fromBranch || product.units[unitIndex].branch || product.branch,
            to: destinationId,
            reason: reason || 'No reason provided',
            transferredBy: req.user._id,
            transferredAt: new Date()
        });

        product.units[unitIndex].transferredTo = {
            type: transferType,
            id: destinationId,
            reason: reason || 'No reason provided',
            transferredBy: req.user._id,
            transferredAt: new Date(),
            fromBranch: fromBranch || product.units[unitIndex].branch || product.branch
        };

        product.units[unitIndex].updatedAt = new Date();
        product.updatedAt = new Date();

        product.markModified('units');
        await product.save();

        const updatedProduct = await Product.findById(id)
            .populate('branch', 'name code city country countryCode currency currencySymbol');

        const updatedUnit = updatedProduct.units.find(u => u.identifier === serial);

        console.log(`✅ Transfer complete: ${serial} -> ${destinationName}`);

        res.json({
            success: true,
            message: `Serial transferred to ${destinationType} successfully`,
            data: {
                unit: updatedUnit,
                transferredTo: destinationName,
                transferType: destinationType,
                transferId: destinationId
            }
        });
    } catch (error) {
        console.error('❌ Error transferring serial:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to transfer serial: ' + error.message
        });
    }
});

// ✅ GET /api/electronics/:id/transfer-history/:serial - Get transfer history
router.get('/:id/transfer-history/:serial', protect, async (req, res) => {
    try {
        const { id, serial } = req.params;
        const companyId = req.user.company;

        const product = await Product.findOne({
            _id: id,
            company: companyId,
            category: 'Electronics'
        })
        .populate('branch', 'name code city country currency currencySymbol');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const unit = product.units.find(u => u.identifier === serial);
        if (!unit) {
            return res.status(404).json({
                success: false,
                message: 'Serial number not found'
            });
        }

        const transferHistory = await Promise.all((unit.transferHistory || []).map(async (transfer) => {
            let fromName = 'Unknown';
            let toName = 'Unknown';
            
            if (transfer.from) {
                const fromBranch = await Branch.findById(transfer.from).select('name');
                if (fromBranch) fromName = fromBranch.name;
            }
            
            if (transfer.to) {
                if (transfer.type === 'user') {
                    const user = await User.findById(transfer.to).select('name');
                    if (user) toName = user.name;
                } else {
                    const branch = await Branch.findById(transfer.to).select('name');
                    if (branch) toName = branch.name;
                }
            }
            
            let transferredByName = 'Unknown';
            if (transfer.transferredBy) {
                const user = await User.findById(transfer.transferredBy).select('name');
                if (user) transferredByName = user.name;
            }
            
            return {
                ...transfer._doc,
                fromName,
                toName,
                transferredByName
            };
        }));

        let currentOwner = null;
        let currentOwnerType = null;
        
        if (unit.assignedTo && unit.assignedToType === 'user') {
            const user = await User.findById(unit.assignedTo).select('name email');
            currentOwner = user;
            currentOwnerType = 'user';
        } else if (unit.branch || product.branch) {
            const branchId = unit.branch || product.branch;
            const branch = await Branch.findById(branchId).select('name code city');
            currentOwner = branch;
            currentOwnerType = 'branch';
        }

        res.json({
            success: true,
            data: {
                serial: unit.identifier,
                status: unit.status,
                currentOwner,
                currentOwnerType,
                transferHistory: transferHistory.reverse()
            }
        });
    } catch (error) {
        console.error('Error fetching transfer history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch transfer history'
        });
    }
});

// ✅ PUT /api/electronics/:id/unit - Update a unit
router.put('/:id/unit', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { oldSerial, newSerial, status } = req.body;

        console.log('📝 Updating serial:');
        console.log('Product ID:', id);
        console.log('Old Serial:', oldSerial);
        console.log('New Serial:', newSerial);
        console.log('New Status:', status);

        const companyId = req.user.company;

        const product = await Product.findOne({
            _id: id,
            company: companyId,
            category: 'Electronics'
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const unitIndex = product.units.findIndex(u => u.identifier === oldSerial);
        if (unitIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Serial number not found'
            });
        }

        const unit = product.units[unitIndex];

        if (newSerial && newSerial !== oldSerial) {
            const existingUnit = product.units.find(u => u.identifier === newSerial);
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
        product.updatedAt = new Date();

        product.markModified('units');
        await product.save();

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
            message: 'Failed to update serial: ' + error.message
        });
    }
});

// ✅ DELETE /api/electronics/:id/unit/:serial - Delete a unit
router.delete('/:id/unit/:serial', protect, async (req, res) => {
    try {
        const { id, serial } = req.params;
        const companyId = req.user.company;

        const product = await Product.findOne({
            _id: id,
            company: companyId,
            category: 'Electronics'
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        const unitIndex = product.units.findIndex(u => u.identifier === serial);
        if (unitIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'Serial number not found'
            });
        }

        if (product.units[unitIndex].status !== 'available') {
            return res.status(400).json({
                success: false,
                message: 'Only available serials can be deleted'
            });
        }

        product.units.splice(unitIndex, 1);
        product.updatedAt = new Date();

        product.markModified('units');
        await product.save();

        res.json({
            success: true,
            message: 'Serial deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting serial:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete serial'
        });
    }
});

module.exports = router;