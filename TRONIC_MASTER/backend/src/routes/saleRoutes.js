// /home/kk/RS/TRONIC_MASTER/backend/src/routes/saleRoutes.js

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Sale = require('../models/Sale');
const Counter = require('../models/Counter');
const Product = require('../models/Product');
const Branch = require('../models/Branch');

// ============================================
// GET ALL SALES
// ============================================
router.get('/', protect, async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'No company associated with this user'
            });
        }

        const { limit = 100, branch, status } = req.query;
        const query = { company: companyId };
        if (branch) query.branch = branch;
        if (status) query.status = status;

        const sales = await Sale.find(query)
            .populate('branch', 'name code currency currencySymbol')
            .populate('items.product', 'name sku category')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: sales,
            count: sales.length
        });
    } catch (error) {
        console.error('Error fetching sales:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching sales',
            error: error.message
        });
    }
});

// ============================================
// GET SINGLE SALE
// ============================================
router.get('/:id', protect, async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        const { id } = req.params;

        const sale = await Sale.findOne({
            _id: id,
            company: companyId
        })
        .populate('branch', 'name code currency currencySymbol')
        .populate('items.product', 'name sku category brand model');

        if (!sale) {
            return res.status(404).json({
                success: false,
                message: 'Sale not found'
            });
        }

        res.json({
            success: true,
            data: sale
        });
    } catch (error) {
        console.error('Error fetching sale:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching sale',
            error: error.message
        });
    }
});

// ============================================
// CREATE SALE (POS) - ✅ FIXED WITH COUNTER
// ============================================
router.post('/', protect, async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'No company associated with this user'
            });
        }

        const {
            branch,
            customer,
            items,
            payment,
            discount,
            notes
        } = req.body;

        console.log('📝 Creating sale for company:', companyId);
        console.log('📦 Items:', items?.length || 0);

        // Validate branch
        const branchExists = await Branch.findOne({
            _id: branch,
            company: companyId,
            isActive: true
        });

        if (!branchExists) {
            return res.status(404).json({
                success: false,
                message: 'Branch not found'
            });
        }

        // Validate items
        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No items in sale'
            });
        }

        // Validate items and check stock
        let subtotal = 0;
        const processedItems = [];
        const productsToUpdate = [];

        for (const item of items) {
            const product = await Product.findOne({
                _id: item.productId,
                company: companyId,
                status: 'active'
            });

            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product not found: ${item.productId}`
                });
            }

            // Check stock based on category
            if (product.category === 'Accessories') {
                // Accessories - check quantity
                if ((product.stock?.quantity || 0) < item.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient stock for ${product.name}. Available: ${product.stock?.quantity || 0}`
                    });
                }
                // Update stock later
                productsToUpdate.push({
                    product,
                    quantity: item.quantity,
                    type: 'accessory'
                });
            } else {
                // Phones/Electronics - check available units
                const availableUnits = product.units?.filter(u => u.status === 'available') || [];
                if (availableUnits.length < item.quantity) {
                    return res.status(400).json({
                        success: false,
                        message: `Insufficient units for ${product.name}. Available: ${availableUnits.length}`
                    });
                }
                // Get the unit identifiers to mark as sold
                const unitsToSell = availableUnits.slice(0, item.quantity);
                productsToUpdate.push({
                    product,
                    units: unitsToSell,
                    quantity: item.quantity,
                    type: 'single'
                });
            }

            const unitPrice = item.price || product.price?.sale || 0;
            const totalPrice = unitPrice * item.quantity;
            subtotal += totalPrice;

            processedItems.push({
                product: product._id,
                productName: product.name,
                sku: product.sku,
                category: product.category,
                quantity: item.quantity,
                unitPrice: unitPrice,
                totalPrice: totalPrice,
                unitIdentifiers: product.category !== 'Accessories' 
                    ? (item.unitIdentifiers || [])
                    : []
            });
        }

        // Calculate tax (if any)
        const taxRate = 0; // You can set this from settings
        const taxAmount = (subtotal * taxRate) / 100;

        // Calculate discount
        let discountAmount = 0;
        if (discount && discount.value > 0) {
            if (discount.type === 'percentage') {
                discountAmount = (subtotal * discount.value) / 100;
            } else {
                discountAmount = discount.value;
            }
        }

        const total = subtotal + taxAmount - discountAmount;

        // ✅ Generate sale number using Counter with retry logic
        let saleNumber;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
            try {
                // Get next sequence number for this company
                const seq = await Counter.increment(companyId);
                const paddedNumber = String(seq).padStart(6, '0');
                saleNumber = `SALE-${paddedNumber}`;
                console.log(`📝 Generated sale number: ${saleNumber}`);
                break;
            } catch (error) {
                retryCount++;
                console.log(`⚠️ Retry ${retryCount}/${maxRetries} for sale number generation`);
                if (retryCount >= maxRetries) {
                    throw new Error('Failed to generate unique sale number after multiple retries');
                }
                // Wait a bit before retry
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        // Create sale
        const sale = new Sale({
            company: companyId,
            branch: branch,
            saleNumber: saleNumber,
            customer: customer || {},
            items: processedItems,
            subtotal: subtotal,
            tax: {
                rate: taxRate,
                amount: taxAmount
            },
            discount: {
                type: discount?.type || 'percentage',
                value: discount?.value || 0,
                amount: discountAmount
            },
            total: total,
            payment: {
                method: payment.method,
                amount: payment.amount,
                reference: payment.reference || '',
                status: 'paid',
                change: payment.amount - total
            },
            status: 'completed',
            notes: notes || '',
            createdBy: req.user._id
        });

        console.log('💾 Saving sale...');
        await sale.save();
        console.log('✅ Sale saved with number:', sale.saleNumber);

        // Update product stock/units
        for (const update of productsToUpdate) {
            if (update.type === 'accessory') {
                // Accessories - reduce quantity
                update.product.stock.quantity -= update.quantity;
                await update.product.save();
                console.log(`📦 Updated stock for ${update.product.name}: ${update.product.stock.quantity}`);
            } else {
                // Phones/Electronics - mark units as sold
                for (const unit of update.units) {
                    await update.product.updateUnitStatus(unit.identifier, 'sold');
                    console.log(`📱 Marked unit ${unit.identifier} as sold`);
                }
            }
        }

        // Populate the sale response
        const populatedSale = await Sale.findById(sale._id)
            .populate('branch', 'name code currency currencySymbol')
            .populate('items.product', 'name sku category brand model');

        res.status(201).json({
            success: true,
            data: populatedSale,
            message: 'Sale completed successfully',
            receipt: {
                saleNumber: populatedSale.saleNumber,
                total: populatedSale.total,
                items: populatedSale.items,
                customer: populatedSale.customer,
                payment: populatedSale.payment
            }
        });

    } catch (error) {
        console.error('❌ Error creating sale:', error);
        
        // Handle duplicate key error specifically
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'Sale number conflict. Please try again.',
                error: 'DUPLICATE_SALE_NUMBER'
            });
        }
        
        // Check for validation errors
        if (error.name === 'ValidationError') {
            const errors = {};
            for (let field in error.errors) {
                errors[field] = error.errors[field].message;
            }
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors
            });
        }
        
        res.status(500).json({
            success: false,
            message: 'Error creating sale',
            error: error.message
        });
    }
});

// ============================================
// GET SALES STATS
// ============================================
router.get('/stats/:period?', protect, async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        const { period = 'today' } = req.params;

        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'No company associated with this user'
            });
        }

        const stats = await Sale.getSalesStats(companyId, period);

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching sales stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching sales stats',
            error: error.message
        });
    }
});

// ============================================
// GET TODAY'S SALES
// ============================================
router.get('/today', protect, async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;

        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'No company associated with this user'
            });
        }

        const sales = await Sale.getTodaySales(companyId)
            .populate('branch', 'name code currency currencySymbol')
            .populate('items.product', 'name sku category');

        const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);

        res.json({
            success: true,
            data: {
                sales,
                count: sales.length,
                totalRevenue
            }
        });
    } catch (error) {
        console.error('Error fetching today sales:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching today sales',
            error: error.message
        });
    }
});

// ============================================
// GET BRANCH SALES
// ============================================
router.get('/branch/:branchId', protect, async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        const { branchId } = req.params;
        const { limit = 50 } = req.query;

        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'No company associated with this user'
            });
        }

        const branch = await Branch.findOne({
            _id: branchId,
            company: companyId,
            isActive: true
        });

        if (!branch) {
            return res.status(404).json({
                success: false,
                message: 'Branch not found'
            });
        }

        const sales = await Sale.getSalesByBranch(branchId, parseInt(limit));

        res.json({
            success: true,
            data: sales,
            branch: branch
        });
    } catch (error) {
        console.error('Error fetching branch sales:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching branch sales',
            error: error.message
        });
    }
});

// ============================================
// SEARCH SALES
// ============================================
router.get('/search/:term', protect, async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        const { term } = req.params;

        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'No company associated with this user'
            });
        }

        const sales = await Sale.find({
            company: companyId,
            $or: [
                { saleNumber: { $regex: term, $options: 'i' } },
                { 'customer.name': { $regex: term, $options: 'i' } },
                { 'customer.phone': { $regex: term, $options: 'i' } }
            ]
        })
        .populate('branch', 'name code currency currencySymbol')
        .populate('items.product', 'name sku category')
        .sort({ createdAt: -1 })
        .limit(50);

        res.json({
            success: true,
            data: sales
        });
    } catch (error) {
        console.error('Error searching sales:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching sales',
            error: error.message
        });
    }
});

// ============================================
// GET NEXT SALE NUMBER (Preview)
// ============================================
router.get('/next-number', protect, async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;

        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'No company associated with this user'
            });
        }

        const currentSeq = await Counter.getCurrent(companyId);
        const nextSeq = currentSeq + 1;
        const paddedNumber = String(nextSeq).padStart(6, '0');
        const nextNumber = `SALE-${paddedNumber}`;

        res.json({
            success: true,
            data: {
                saleNumber: nextNumber,
                sequence: nextSeq
            }
        });
    } catch (error) {
        console.error('Error getting next sale number:', error);
        res.status(500).json({
            success: false,
            message: 'Error getting next sale number',
            error: error.message
        });
    }
});

// ============================================
// GET SALES BY COMPANY (Admin only)
// ============================================
router.get('/company/:companyId', protect, async (req, res) => {
    try {
        const currentUser = req.user;
        const { companyId } = req.params;
        const { limit = 100 } = req.query;

        // Only allow super_admin or admin to view other companies' sales
        if (!['super_admin', 'admin'].includes(currentUser.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Only administrators can view other companies sales.'
            });
        }

        const sales = await Sale.find({ company: companyId })
            .populate('branch', 'name code currency currencySymbol')
            .populate('items.product', 'name sku category')
            .populate('company', 'name code')
            .sort({ createdAt: -1 })
            .limit(parseInt(limit));

        res.json({
            success: true,
            data: sales,
            count: sales.length
        });
    } catch (error) {
        console.error('Error fetching company sales:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching company sales',
            error: error.message
        });
    }
});

// ============================================
// UPDATE SALE STATUS
// ============================================
router.patch('/:id/status', protect, async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        const { id } = req.params;
        const { status } = req.body;

        if (!['pending', 'completed', 'cancelled', 'refunded'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }

        const sale = await Sale.findOne({
            _id: id,
            company: companyId
        });

        if (!sale) {
            return res.status(404).json({
                success: false,
                message: 'Sale not found'
            });
        }

        sale.status = status;
        sale.updatedAt = Date.now();
        await sale.save();

        const updatedSale = await Sale.findById(sale._id)
            .populate('branch', 'name code currency currencySymbol')
            .populate('items.product', 'name sku category');

        res.json({
            success: true,
            data: updatedSale,
            message: `Sale status updated to ${status}`
        });
    } catch (error) {
        console.error('Error updating sale status:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating sale status',
            error: error.message
        });
    }
});

// ============================================
// REFUND SALE
// ============================================
router.post('/:id/refund', protect, async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        const { id } = req.params;
        const { reason } = req.body;

        const sale = await Sale.findOne({
            _id: id,
            company: companyId
        });

        if (!sale) {
            return res.status(404).json({
                success: false,
                message: 'Sale not found'
            });
        }

        if (sale.status === 'refunded') {
            return res.status(400).json({
                success: false,
                message: 'Sale is already refunded'
            });
        }

        // Restore stock for refunded items
        for (const item of sale.items) {
            const product = await Product.findById(item.product);
            if (product) {
                if (product.category === 'Accessories') {
                    product.stock.quantity += item.quantity;
                    await product.save();
                } else {
                    // For phones/electronics, mark units as available again
                    for (const identifier of item.unitIdentifiers || []) {
                        const unit = product.units.find(u => u.identifier === identifier);
                        if (unit) {
                            unit.status = 'available';
                        }
                    }
                    await product.save();
                }
            }
        }

        sale.status = 'refunded';
        sale.updatedAt = Date.now();
        sale.notes = sale.notes ? `${sale.notes}\nRefunded: ${reason || 'No reason provided'}` : `Refunded: ${reason || 'No reason provided'}`;
        await sale.save();

        const updatedSale = await Sale.findById(sale._id)
            .populate('branch', 'name code currency currencySymbol')
            .populate('items.product', 'name sku category');

        res.json({
            success: true,
            data: updatedSale,
            message: 'Sale refunded successfully'
        });
    } catch (error) {
        console.error('Error refunding sale:', error);
        res.status(500).json({
            success: false,
            message: 'Error refunding sale',
            error: error.message
        });
    }
});

module.exports = router;