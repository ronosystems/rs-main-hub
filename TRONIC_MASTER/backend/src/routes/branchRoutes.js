// /home/kk/RS/TRONIC_MASTER/backend/src/routes/branchRoutes.js

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Branch = require('../models/Branch');
const Product = require('../models/Product');

// ============================================
// GET COUNTRIES WITH CURRENCIES
// ============================================
router.get('/countries', protect, async (req, res) => {
    try {
        const countries = await Branch.getCountriesWithCurrencies();
        res.json({
            success: true,
            data: countries
        });
    } catch (error) {
        console.error('Error fetching countries:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching countries',
            error: error.message
        });
    }
});

// ============================================
// GET CURRENCY FOR A COUNTRY
// ============================================
router.get('/currency/:countryCode', protect, async (req, res) => {
    try {
        const { countryCode } = req.params;
        const currency = await Branch.getCurrencyForCountry(countryCode);
        res.json({
            success: true,
            data: currency
        });
    } catch (error) {
        console.error('Error fetching currency:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching currency',
            error: error.message
        });
    }
});

// ============================================
// GET STATS - SPECIFIC ROUTE
// ============================================
router.get('/stats', protect, async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'No company associated with this user'
            });
        }

        const total = await Branch.countDocuments({ company: companyId, isActive: true });
        const mainBranches = await Branch.countDocuments({ company: companyId, isMainBranch: true, isActive: true });
        const countries = await Branch.distinct('country', { company: companyId, isActive: true });

        console.log('📊 Stats calculated:', { total, mainBranches, countries: countries.length });

        res.json({
            success: true,
            data: {
                total,
                mainBranches,
                countries: countries.length
            }
        });
    } catch (error) {
        console.error('Error fetching branch stats:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching branch stats',
            error: error.message
        });
    }
});

// ============================================
// GET MAIN BRANCH - SPECIFIC ROUTE
// ============================================
router.get('/main', protect, async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'No company associated with this user'
            });
        }

        const mainBranch = await Branch.findOne({ 
            company: companyId, 
            isMainBranch: true,
            isActive: true 
        });
        
        res.json({
            success: true,
            data: mainBranch
        });
    } catch (error) {
        console.error('Error fetching main branch:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching main branch',
            error: error.message
        });
    }
});

// ============================================
// ===== GET USER BRANCHES - SPECIFIC ROUTE ====
// ============================================
// ✅ MOVED HERE - MUST BE BEFORE /:id
router.get('/user', protect, async (req, res) => {
    try {
        const user = req.user;
        const companyId = user.company?._id || user.company;
        
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'User has no company assigned'
            });
        }
        
        let branches = [];
        const userRole = user.companyRole || 'company_staff';
        
        console.log(`👤 Getting branches for user: ${user.email}`);
        console.log(`📋 Role: ${userRole}`);
        console.log(`🏢 Company: ${companyId}`);
        
        // ===== SUPER ADMIN =====
        if (user.role === 'super_admin') {
            branches = await Branch.find({ 
                company: companyId, 
                isActive: true 
            })
            .select('name code city country currency currencySymbol address phone email isActive')
            .sort({ name: 1 });
            console.log(`👑 Super Admin: ${branches.length} branches found`);
        }
        
        // ===== COMPANY ADMIN =====
        else if (userRole === 'company_admin') {
            branches = await Branch.find({ 
                company: companyId, 
                isActive: true 
            })
            .select('name code city country currency currencySymbol address phone email isActive')
            .sort({ name: 1 });
            console.log(`👑 Company Admin: ${branches.length} branches found`);
        }
        
        // ===== COMPANY MANAGER =====
        else if (userRole === 'company_manager') {
            // Check if manager has assigned branches
            if (user.assignedBranches && user.assignedBranches.length > 0) {
                branches = await Branch.find({
                    _id: { $in: user.assignedBranches },
                    isActive: true
                })
                .select('name code city country currency currencySymbol address phone email isActive')
                .sort({ name: 1 });
                console.log(`👔 Manager: ${branches.length} assigned branches found`);
            } else {
                console.log(`👔 Manager: No branches assigned`);
                branches = [];
            }
        }
        
        // ===== COMPANY AGENT, CASHIER, STAFF =====
        else {
            // Get their assigned branch
            if (user.branch) {
                const branch = await Branch.findOne({
                    _id: user.branch,
                    isActive: true
                })
                .select('name code city country currency currencySymbol address phone email isActive');
                
                if (branch) {
                    branches = [branch];
                    console.log(`👤 ${userRole}: 1 branch found`);
                } else {
                    console.log(`👤 ${userRole}: No branch found`);
                    branches = [];
                }
            } else {
                console.log(`👤 ${userRole}: No branch assigned`);
                branches = [];
            }
        }
        
        res.json({
            success: true,
            data: branches,
            userRole: userRole,
            count: branches.length
        });
        
    } catch (error) {
        console.error('Error fetching user branches:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch branches',
            error: error.message
        });
    }
});

// ============================================
// GET ALL BRANCHES WITH PRODUCT COUNTS
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

        const branches = await Branch.find({ 
            company: companyId, 
            isActive: true 
        }).sort({ isMainBranch: -1, name: 1 });
        
        // Get product counts for each branch
        const branchesWithCounts = await Promise.all(branches.map(async (branch) => {
            const productCount = await Product.countDocuments({
                company: companyId,
                branch: branch._id,
                status: 'active'
            });
            
            const branchObj = branch.toObject();
            branchObj.productCount = productCount;
            return branchObj;
        }));
        
        res.json({
            success: true,
            data: branchesWithCounts
        });
    } catch (error) {
        console.error('Error fetching branches:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching branches',
            error: error.message
        });
    }
});

// ============================================
// GET BRANCH BY ID - MUST COME AFTER ALL SPECIFIC ROUTES
// ============================================
router.get('/:id', protect, async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        const { id } = req.params;

        const branch = await Branch.findOne({
            _id: id,
            company: companyId
        });

        if (!branch) {
            return res.status(404).json({
                success: false,
                message: 'Branch not found'
            });
        }

        // Get product count for this branch
        const productCount = await Product.countDocuments({
            company: companyId,
            branch: branch._id,
            status: 'active'
        });

        const branchObj = branch.toObject();
        branchObj.productCount = productCount;

        res.json({
            success: true,
            data: branchObj
        });
    } catch (error) {
        console.error('Error fetching branch:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching branch',
            error: error.message
        });
    }
});

// ============================================
// CREATE BRANCH
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
            name,
            code,
            type,
            country,
            countryCode,
            currency,
            currencySymbol,
            city,
            address,
            phone,
            email,
            manager,
            isMainBranch,
            openingHours
        } = req.body;

        // Check if code already exists within the company
        const existingBranch = await Branch.findOne({
            company: companyId,
            code: code.trim().toUpperCase()
        });

        if (existingBranch) {
            return res.status(400).json({
                success: false,
                message: 'Branch with this code already exists in your company'
            });
        }

        // Check if name already exists within the company
        const existingName = await Branch.findOne({
            company: companyId,
            name: name.trim()
        });

        if (existingName) {
            return res.status(400).json({
                success: false,
                message: 'Branch with this name already exists in your company'
            });
        }

        // If setting as main branch, unset other main branches
        if (isMainBranch) {
            await Branch.updateMany(
                { company: companyId, isMainBranch: true },
                { isMainBranch: false }
            );
        }

        // Get currency from country code if not provided
        let finalCurrency = currency;
        let finalCurrencySymbol = currencySymbol;
        let finalCountry = country;
        let finalCountryCode = countryCode;

        if (countryCode && !currency) {
            const currencyData = await Branch.getCurrencyForCountry(countryCode);
            if (currencyData) {
                finalCurrency = currencyData.currency;
                finalCurrencySymbol = currencyData.currencySymbol;
                if (!finalCountry) {
                    finalCountry = currencyData.countryName;
                }
                finalCountryCode = countryCode;
            }
        }

        const branch = new Branch({
            company: companyId,
            name: name.trim(),
            code: code.trim().toUpperCase(),
            type: type || 'branch',
            country: finalCountry || country?.trim() || '',
            countryCode: finalCountryCode || '',
            currency: finalCurrency || 'KES',
            currencySymbol: finalCurrencySymbol || 'KSh',
            city: city.trim(),
            address: address || '',
            phone: phone || '',
            email: email || '',
            manager: manager || {},
            openingHours: openingHours || {},
            isMainBranch: isMainBranch || false,
            createdBy: req.user._id
        });

        await branch.save();

        // Get product count (will be 0 for new branch)
        const branchObj = branch.toObject();
        branchObj.productCount = 0;

        res.status(201).json({
            success: true,
            data: branchObj,
            message: 'Branch created successfully'
        });
    } catch (error) {
        console.error('Error creating branch:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating branch',
            error: error.message
        });
    }
});

// ============================================
// UPDATE BRANCH
// ============================================
router.put('/:id', protect, async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        const { id } = req.params;
        const updates = req.body;

        const branch = await Branch.findOne({
            _id: id,
            company: companyId
        });

        if (!branch) {
            return res.status(404).json({
                success: false,
                message: 'Branch not found'
            });
        }

        // Check for duplicate code
        if (updates.code) {
            const existingBranch = await Branch.findOne({
                company: companyId,
                code: updates.code.trim().toUpperCase(),
                _id: { $ne: id }
            });

            if (existingBranch) {
                return res.status(400).json({
                    success: false,
                    message: 'Branch with this code already exists in your company'
                });
            }
            branch.code = updates.code.trim().toUpperCase();
        }

        // Check for duplicate name
        if (updates.name) {
            const existingName = await Branch.findOne({
                company: companyId,
                name: updates.name.trim(),
                _id: { $ne: id }
            });

            if (existingName) {
                return res.status(400).json({
                    success: false,
                    message: 'Branch with this name already exists in your company'
                });
            }
            branch.name = updates.name.trim();
        }

        // If setting as main branch, unset other main branches
        if (updates.isMainBranch && !branch.isMainBranch) {
            await Branch.updateMany(
                { company: companyId, isMainBranch: true },
                { isMainBranch: false }
            );
        }

        // Update country and currency
        if (updates.countryCode) {
            const currencyData = await Branch.getCurrencyForCountry(updates.countryCode);
            branch.countryCode = updates.countryCode;
            branch.currency = currencyData.currency;
            branch.currencySymbol = currencyData.currencySymbol;
            if (updates.country) {
                branch.country = updates.country;
            } else {
                branch.country = currencyData.countryName;
            }
        } else if (updates.country) {
            branch.country = updates.country.trim();
        }

        // Update currency manually if provided
        if (updates.currency) branch.currency = updates.currency;
        if (updates.currencySymbol) branch.currencySymbol = updates.currencySymbol;

        // Update other fields
        if (updates.type) branch.type = updates.type;
        if (updates.city) branch.city = updates.city.trim();
        if (updates.address !== undefined) branch.address = updates.address;
        if (updates.phone !== undefined) branch.phone = updates.phone;
        if (updates.email !== undefined) branch.email = updates.email;
        if (updates.manager) branch.manager = updates.manager;
        if (updates.openingHours) branch.openingHours = updates.openingHours;
        if (updates.isMainBranch !== undefined) branch.isMainBranch = updates.isMainBranch;
        if (updates.isActive !== undefined) branch.isActive = updates.isActive;
        
        branch.updatedAt = Date.now();
        await branch.save();

        // Get product count
        const productCount = await Product.countDocuments({
            company: companyId,
            branch: branch._id,
            status: 'active'
        });

        const branchObj = branch.toObject();
        branchObj.productCount = productCount;

        res.json({
            success: true,
            data: branchObj,
            message: 'Branch updated successfully'
        });
    } catch (error) {
        console.error('Error updating branch:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating branch',
            error: error.message
        });
    }
});

// ============================================
// DELETE BRANCH (Soft Delete)
// ============================================
router.delete('/:id', protect, async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        const { id } = req.params;

        const branch = await Branch.findOne({
            _id: id,
            company: companyId
        });

        if (!branch) {
            return res.status(404).json({
                success: false,
                message: 'Branch not found'
            });
        }

        // Prevent deleting main branch
        if (branch.isMainBranch) {
            return res.status(400).json({
                success: false,
                message: 'Cannot deactivate the main branch'
            });
        }

        branch.isActive = false;
        await branch.save();

        res.json({
            success: true,
            message: 'Branch deactivated successfully'
        });
    } catch (error) {
        console.error('Error deleting branch:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting branch',
            error: error.message
        });
    }
});

// ============================================
// SEARCH BRANCHES
// ============================================
router.get('/search/:term', protect, async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        const { term } = req.params;

        const branches = await Branch.find({
            company: companyId,
            isActive: true,
            $or: [
                { name: { $regex: term, $options: 'i' } },
                { code: { $regex: term, $options: 'i' } },
                { city: { $regex: term, $options: 'i' } },
                { country: { $regex: term, $options: 'i' } }
            ]
        }).sort({ name: 1 });

        res.json({
            success: true,
            data: branches
        });
    } catch (error) {
        console.error('Error searching branches:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching branches',
            error: error.message
        });
    }
});

module.exports = router;