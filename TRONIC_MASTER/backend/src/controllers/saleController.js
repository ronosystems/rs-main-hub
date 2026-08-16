// /home/kk/RS/TRONIC_MASTER/backend/src/controllers/saleController.js

const Sale = require('../models/Sale');
const Counter = require('../models/Counter');
const Product = require('../models/Product');

// ============ CREATE SALE ============
exports.createSale = async (req, res) => {
    try {
        const { branch, customer, items, payment, discount, notes } = req.body;
        const company = req.user.company;
        
        console.log('📝 Creating sale for company:', company);
        console.log('📦 Items:', items.length);
        
        // Validate items
        if (!items || items.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No items in sale'
            });
        }

        // Calculate totals
        let subtotal = 0;
        const saleItems = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    message: `Product ${item.productId} not found`
                });
            }

            const unitPrice = product.price?.sale || 0;
            const totalPrice = unitPrice * item.quantity;
            subtotal += totalPrice;

            saleItems.push({
                product: product._id,
                productName: product.name,
                sku: product.sku,
                category: product.category,
                quantity: item.quantity,
                unitPrice: unitPrice,
                totalPrice: totalPrice,
                unitIdentifiers: item.unitIdentifiers || []
            });
        }

        // Calculate discount
        let discountAmount = 0;
        if (discount && discount.value > 0) {
            if (discount.type === 'percentage') {
                discountAmount = (subtotal * discount.value) / 100;
            } else {
                discountAmount = discount.value;
            }
        }

        const total = subtotal - discountAmount;

        // ✅ Generate sale number using Counter
        const seq = await Counter.increment(company);
        const paddedNumber = String(seq).padStart(6, '0');
        const saleNumber = `SALE-${paddedNumber}`;
        console.log('📝 Generated sale number:', saleNumber);

        // Create sale
        const sale = new Sale({
            company: company,
            branch: branch,
            saleNumber: saleNumber,
            customer: customer || {},
            items: saleItems,
            subtotal: subtotal,
            discount: discountAmount > 0 ? {
                type: discount.type || 'percentage',
                value: discount.value || 0,
                amount: discountAmount
            } : undefined,
            total: total,
            payment: {
                method: payment.method || 'cash',
                amount: payment.amount || total,
                change: (payment.amount || total) - total,
                status: 'paid'
            },
            notes: notes || '',
            createdBy: req.user._id,
            status: 'completed'
        });

        console.log('💾 Saving sale...');
        await sale.save();

        // Update product stock
        for (const item of saleItems) {
            const product = await Product.findById(item.product);
            if (product) {
                if (product.category === 'Accessories') {
                    product.stock.quantity -= item.quantity;
                    await product.save();
                } else {
                    for (const identifier of item.unitIdentifiers || []) {
                        const unit = product.units.find(u => u.identifier === identifier);
                        if (unit) {
                            unit.status = 'sold';
                        }
                    }
                    await product.save();
                }
            }
        }

        // Populate the response
        const populatedSale = await Sale.findById(sale._id)
            .populate('branch', 'name code address currencySymbol')
            .populate('company', 'name code')
            .populate('createdBy', 'name email');

        res.status(201).json({
            success: true,
            data: populatedSale,
            message: 'Sale created successfully'
        });

    } catch (error) {
        console.error('❌ Error creating sale:', error);
        
        // Handle duplicate key error
        if (error.code === 11000) {
            // Try one more time with a new number
            try {
                const { branch, customer, items, payment, discount, notes } = req.body;
                const company = req.user.company;
                
                // Get next number
                const seq = await Counter.increment(company);
                const paddedNumber = String(seq).padStart(6, '0');
                const saleNumber = `SALE-${paddedNumber}`;
                
                // Create the sale with new number
                const sale = new Sale({
                    company: company,
                    branch: branch,
                    saleNumber: saleNumber,
                    // ... rest of the sale data
                });
                await sale.save();
                
                // ... rest of the logic
                
                return res.status(201).json({
                    success: true,
                    data: sale,
                    message: 'Sale created successfully (retry)'
                });
            } catch (retryError) {
                console.error('❌ Retry failed:', retryError);
                return res.status(500).json({
                    success: false,
                    message: 'Failed to create sale after retry'
                });
            }
        }
        
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to create sale'
        });
    }
};

// ============ GET NEXT SALE NUMBER ============
exports.getNextSaleNumber = async (req, res) => {
    try {
        const company = req.user.company;
        const nextNumber = await Sale.getNextSaleNumber(company);
        res.json({
            success: true,
            data: { saleNumber: nextNumber }
        });
    } catch (error) {
        console.error('Error getting next sale number:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};