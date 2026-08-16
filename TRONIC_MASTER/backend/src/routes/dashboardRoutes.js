// /home/kk/RS/TRONIC_MASTER/backend/src/routes/dashboardRoutes.js

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Company = require('../models/Company');

router.get('/stats', protect, async (req, res) => {
    try {
        // ✅ Get company from req.company (set by auth middleware)
        // Fallback to req.user.company if not set
        const company = req.company || req.user?.company;
        
        if (!company) {
            return res.status(400).json({
                success: false,
                message: 'No company associated with this user'
            });
        }

        const companyId = company._id;

        console.log('📊 Fetching stats for company:', company.name);

        // Product stats
        const totalProducts = await Product.countDocuments({ 
            company: companyId, 
            status: 'active' 
        });
        
        // Get all products to calculate low stock
        const products = await Product.find({ 
            company: companyId, 
            status: 'active' 
        }).select('stock category units name');
        
        let lowStockProducts = 0;
        let outOfStockProducts = 0;
        
        for (const product of products) {
            if (product.category === 'Accessories') {
                // Accessories use stock.quantity
                if (product.stock?.quantity === 0) {
                    outOfStockProducts++;
                } else if (product.stock?.quantity <= product.stock?.minLevel) {
                    lowStockProducts++;
                }
            } else {
                // Phones/Electronics use units
                const availableUnits = product.units?.filter(u => u.status === 'available').length || 0;
                if (availableUnits === 0) {
                    outOfStockProducts++;
                } else if (availableUnits <= 2) {
                    lowStockProducts++;
                }
            }
        }

        // Today's sales
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todaySales = await Order.aggregate([
            { 
                $match: { 
                    company: companyId, 
                    status: 'completed', 
                    createdAt: { $gte: today } 
                } 
            },
            { 
                $group: { 
                    _id: null, 
                    total: { $sum: '$total' }, 
                    count: { $sum: 1 } 
                } 
            }
        ]);

        // Recent orders
        const recentOrders = await Order.find({ company: companyId })
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        // Category distribution
        const categoryDistribution = await Product.aggregate([
            {
                $match: {
                    company: companyId,
                    status: 'active'
                }
            },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 }
                }
            }
        ]);

        res.json({
            success: true,
            data: {
                company: {
                    id: company._id,
                    name: company.name,
                    code: company.code,
                    projectType: company.projectType
                },
                overview: {
                    totalProducts,
                    lowStockProducts,
                    outOfStockProducts,
                    categories: categoryDistribution.length
                },
                sales: {
                    today: {
                        total: todaySales[0]?.total || 0,
                        count: todaySales[0]?.count || 0
                    }
                },
                recentOrders,
                categoryDistribution
            }
        });

    } catch (error) {
        console.error('❌ Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard stats',
            error: error.message
        });
    }
});

// Get low stock products
router.get('/low-stock', protect, async (req, res) => {
    try {
        const company = req.company || req.user?.company;
        
        if (!company) {
            return res.status(400).json({
                success: false,
                message: 'No company associated with this user'
            });
        }

        const companyId = company._id;

        const lowStockProducts = await Product.find({
            company: companyId,
            status: 'active'
        }).where('stock.quantity').lte('stock.minLevel');

        res.json({
            success: true,
            data: lowStockProducts,
            count: lowStockProducts.length
        });
    } catch (error) {
        console.error('❌ Low stock error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching low stock products',
            error: error.message
        });
    }
});

// Get out of stock products
router.get('/out-of-stock', protect, async (req, res) => {
    try {
        const company = req.company || req.user?.company;
        
        if (!company) {
            return res.status(400).json({
                success: false,
                message: 'No company associated with this user'
            });
        }

        const companyId = company._id;

        const outOfStockProducts = await Product.find({
            company: companyId,
            status: 'active',
            'stock.quantity': 0
        });

        res.json({
            success: true,
            data: outOfStockProducts,
            count: outOfStockProducts.length
        });
    } catch (error) {
        console.error('❌ Out of stock error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching out of stock products',
            error: error.message
        });
    }
});

module.exports = router;