const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Product = require('../models/Product');
const User = require('../models/User');
const Branch = require('../models/Branch');

// ============================================
// ===== SPECIFIC ROUTES (MUST COME FIRST) ====
// ============================================

// ✅ GET /api/phones/assigned - Get phones assigned to current agent
router.get('/assigned', protect, async (req, res) => {
    try {
        const user = req.user;
        
        console.log('========================================');
        console.log(`🔍 Agent ${user.email} requesting assigned phones`);
        console.log(`📋 User role: ${user.companyRole}`);
        console.log(`📋 Assigned phones array:`, user.assignedPhones);
        console.log(`📋 Array length: ${user.assignedPhones?.length || 0}`);
        console.log('========================================');
        
        // Only agents should access this
        if (user.companyRole !== 'company_agent') {
            return res.status(403).json({
                success: false,
                message: 'Only agents can access assigned phones'
            });
        }

        // Check if user has assigned phones
        if (!user.assignedPhones || user.assignedPhones.length === 0) {
            console.log(`📱 Agent ${user.email} has no assigned phones`);
            return res.json({
                success: true,
                data: [],
                count: 0,
                totalUnits: 0,
                message: 'No phones assigned to this agent'
            });
        }

        console.log(`📱 Agent has ${user.assignedPhones.length} assigned phone IDs`);

        // Get ALL products that are in the agent's assignedPhones
        const products = await Product.find({
            _id: { $in: user.assignedPhones },
            status: 'active',
            category: 'Phones'
        })
        .populate('branch', 'name code city')
        .lean();

        console.log(`📱 Found ${products.length} products matching assigned IDs`);

        // Filter units for EACH product
        const filteredProducts = products.map(product => {
            console.log(`📱 Processing: ${product.brand} ${product.model}`);
            console.log(`   - Total units: ${product.units?.length || 0}`);
            
            // Filter units that are assigned to THIS agent
            const assignedUnits = (product.units || []).filter(unit => {
                // Check if unit is assigned to this agent
                const isAssignedToAgent = unit.assignedTo && 
                       unit.assignedTo.toString() === user._id.toString() &&
                       unit.assignedToType === 'user';
                
                // Unit must be available
                const isAvailable = unit.status === 'available';
                
                if (isAssignedToAgent && isAvailable) {
                    console.log(`   ✅ Found assigned unit: ${unit.identifier}`);
                    return true;
                }
                return false;
            });

            console.log(`   - Assigned units: ${assignedUnits.length}`);

            // Only return product if it has assigned units
            if (assignedUnits.length > 0) {
                return {
                    ...product,
                    units: assignedUnits
                };
            }
            
            // If no specific unit assignments but product is in assignedPhones,
            // show all available units as fallback
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

        // Count total units
        const totalUnits = filteredProducts.reduce((sum, p) => sum + p.units.length, 0);
        console.log(`✅ Total assigned IMEIs: ${totalUnits}`);
        console.log('========================================');

        res.json({
            success: true,
            data: filteredProducts,
            count: filteredProducts.length,
            totalUnits: totalUnits
        });
    } catch (error) {
        console.error('Error fetching assigned phones:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch assigned phones',
            error: error.message
        });
    }
});

// ✅ GET /api/phones/branch/:branchId - Get phones for a branch
router.get('/branch/:branchId', protect, async (req, res) => {
    try {
        const { branchId } = req.params;
        const companyId = req.user.company;

        const products = await Product.find({
            company: companyId,
            category: 'Phones',
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
        console.error('Error fetching phones:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch phones'
        });
    }
});

// ✅ GET /api/phones/company - Get all phones for a company
router.get('/company', protect, async (req, res) => {
    try {
        const companyId = req.user.company;

        const products = await Product.find({
            company: companyId,
            category: 'Phones',
            status: 'active'
        })
        .populate('branch', 'name code city country countryCode currency currencySymbol')
        .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Error fetching phones:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch phones'
        });
    }
});

// ✅ GET /api/phones/available-users - Get users for transfer
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

// ✅ GET /api/phones/available-branches - Get branches for transfer
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

// ✅ GET /api/phones/branches-with-currency - Get all branches with currency
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

// ✅ GET /api/phones/currency/:countryCode - Get currency for a country
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

// ✅ GET /api/phones/countries-currencies - Get all countries with currencies
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

// ✅ GET /api/phones/:id - Get single phone
router.get('/:id', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.user.company;

        const product = await Product.findOne({
            _id: id,
            company: companyId,
            category: 'Phones'
        })
        .populate('branch', 'name code city country countryCode currency currencySymbol');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Phone not found'
            });
        }

        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Error fetching phone:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch phone'
        });
    }
});

// ✅ POST /api/phones/:id/sell - Sell a phone
router.post('/:id/sell', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            imei, 
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
            category: 'Phones'
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Phone not found'
            });
        }

        const unitIndex = product.units.findIndex(u => u.identifier === imei);
        if (unitIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'IMEI not found'
            });
        }

        const unit = product.units[unitIndex];

        if (unit.status !== 'available') {
            return res.status(400).json({
                success: false,
                message: `IMEI is not available for sale. Current status: ${unit.status}`
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

        // Clear agent assignment when sold
        unit.assignedTo = null;
        unit.assignedToType = null;

        product.markModified('units');
        await product.save();

        const receiptNo = `RCP-${Date.now().toString().slice(-6)}`;

        res.json({
            success: true,
            message: 'Phone sold successfully',
            receiptNo: receiptNo,
            data: unit
        });
    } catch (error) {
        console.error('❌ Error selling phone:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to sell phone: ' + error.message
        });
    }
});

// ✅ POST /api/phones/:id/reverse - Reverse a sale
router.post('/:id/reverse', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { imei, reason } = req.body;

        const companyId = req.user.company;

        const product = await Product.findOne({
            _id: id,
            company: companyId,
            category: 'Phones'
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Phone not found'
            });
        }

        const unitIndex = product.units.findIndex(u => u.identifier === imei);
        if (unitIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'IMEI not found'
            });
        }

        const unit = product.units[unitIndex];

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

        product.markModified('units');
        await product.save();

        const updatedProduct = await Product.findById(id)
            .populate('branch', 'name code city country countryCode currency currencySymbol');

        const updatedUnit = updatedProduct.units.find(u => u.identifier === imei);

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

// ✅ POST /api/phones/:id/transfer-unit - Transfer a unit with auto-assign
router.post('/:id/transfer-unit', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            imei, 
            transferType, 
            transferTo, 
            reason, 
            fromBranch 
        } = req.body;

        console.log('📦 Transfer request:');
        console.log('IMEI:', imei);
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

        // Find the product
        const product = await Product.findOne({
            _id: id,
            company: companyId,
            category: 'Phones'
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Phone not found'
            });
        }

        // Find the unit
        const unitIndex = product.units.findIndex(u => u.identifier === imei);
        if (unitIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'IMEI not found'
            });
        }

        if (product.units[unitIndex].status !== 'available') {
            return res.status(400).json({
                success: false,
                message: 'Only available IMEIs can be transferred'
            });
        }

        // ============================================
        // HANDLE TRANSFER DESTINATION
        // ============================================
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

            // ✅ If transferring to an agent, auto-assign
            if (user.companyRole === 'company_agent') {
                // 1. Assign the specific unit to the agent
                product.units[unitIndex].assignedTo = transferTo;
                product.units[unitIndex].assignedToType = 'user';
                product.units[unitIndex].assignedAt = new Date();
                product.units[unitIndex].assignedBy = req.user._id;
                
                console.log(`✅ Unit ${imei} assigned to agent ${user.name}`);

                // 2. Add the product to agent's assignedPhones
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
            
            // Assign to branch
            product.units[unitIndex].branch = transferTo;
            product.units[unitIndex].assignedToType = 'branch';
            product.units[unitIndex].assignedTo = null;
        }

        // ============================================
        // UPDATE TRANSFER HISTORY
        // ============================================
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

        const updatedUnit = updatedProduct.units.find(u => u.identifier === imei);

        console.log(`✅ Transfer complete: ${imei} -> ${destinationName}`);

        res.json({
            success: true,
            message: `IMEI transferred to ${destinationType} successfully`,
            data: {
                unit: updatedUnit,
                transferredTo: destinationName,
                transferType: destinationType,
                transferId: destinationId
            }
        });
    } catch (error) {
        console.error('❌ Error transferring IMEI:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to transfer IMEI: ' + error.message
        });
    }
});

// ✅ GET /api/phones/:id/transfer-history/:imei - Get transfer history
router.get('/:id/transfer-history/:imei', protect, async (req, res) => {
    try {
        const { id, imei } = req.params;
        const companyId = req.user.company;

        const product = await Product.findOne({
            _id: id,
            company: companyId,
            category: 'Phones'
        })
        .populate('branch', 'name code city country currency currencySymbol');

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Phone not found'
            });
        }

        const unit = product.units.find(u => u.identifier === imei);
        if (!unit) {
            return res.status(404).json({
                success: false,
                message: 'IMEI not found'
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
                imei: unit.identifier,
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

// ✅ PUT /api/phones/:id/unit - Update a unit
router.put('/:id/unit', protect, async (req, res) => {
    try {
        const { id } = req.params;
        const { oldImei, newImei, status } = req.body;

        console.log('📝 Updating IMEI:');
        console.log('Product ID:', id);
        console.log('Old IMEI:', oldImei);
        console.log('New IMEI:', newImei);
        console.log('New Status:', status);

        const companyId = req.user.company;

        const product = await Product.findOne({
            _id: id,
            company: companyId,
            category: 'Phones'
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Phone not found'
            });
        }

        const unitIndex = product.units.findIndex(u => u.identifier === oldImei);
        if (unitIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'IMEI not found'
            });
        }

        const unit = product.units[unitIndex];

        if (newImei && newImei !== oldImei) {
            const existingUnit = product.units.find(u => u.identifier === newImei);
            if (existingUnit) {
                return res.status(400).json({
                    success: false,
                    message: 'IMEI already exists'
                });
            }
            unit.identifier = newImei;
        }

        if (status && ['available', 'sold', 'reserved', 'repair'].includes(status)) {
            unit.status = status;
        }

        unit.updatedAt = new Date();
        product.updatedAt = new Date();

        product.markModified('units');
        await product.save();

        console.log('✅ IMEI updated successfully');

        res.json({
            success: true,
            message: 'IMEI updated successfully',
            data: unit
        });
    } catch (error) {
        console.error('Error updating IMEI:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update IMEI: ' + error.message
        });
    }
});

// ✅ DELETE /api/phones/:id/unit/:imei - Delete a unit
router.delete('/:id/unit/:imei', protect, async (req, res) => {
    try {
        const { id, imei } = req.params;
        const companyId = req.user.company;

        const product = await Product.findOne({
            _id: id,
            company: companyId,
            category: 'Phones'
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Phone not found'
            });
        }

        const unitIndex = product.units.findIndex(u => u.identifier === imei);
        if (unitIndex === -1) {
            return res.status(404).json({
                success: false,
                message: 'IMEI not found'
            });
        }

        if (product.units[unitIndex].status !== 'available') {
            return res.status(400).json({
                success: false,
                message: 'Only available IMEIs can be deleted'
            });
        }

        product.units.splice(unitIndex, 1);
        product.updatedAt = new Date();

        product.markModified('units');
        await product.save();

        res.json({
            success: true,
            message: 'IMEI deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting IMEI:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete IMEI'
        });
    }
});

module.exports = router;