const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Product = require('../models/Product');
const Branch = require('../models/Branch');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ============================================
// MULTER CONFIGURATION FOR PRODUCT IMAGES
// ============================================

// Ensure uploads/products directory exists
const productUploadDir = path.join(__dirname, '../uploads/products');
if (!fs.existsSync(productUploadDir)) {
    fs.mkdirSync(productUploadDir, { recursive: true });
}

// Configure storage for product images
const productImageStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, productUploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `product-${uniqueSuffix}${ext}`);
    }
});

// File filter for images only
const productImageFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG, GIF, WEBP, and SVG are allowed.'), false);
    }
};

// Multer upload middleware for product images
const uploadProductImage = multer({
    storage: productImageStorage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: productImageFilter
});

// ============================================
// GET ALL PRODUCTS
// ============================================
router.get('/', protect, async (req, res) => {
    try {
        const companyId = req.user.company;
        
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'No company associated with this user'
            });
        }

        const products = await Product.getProductsByCompany(companyId);
        
        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching products',
            error: error.message
        });
    }
});

// ============================================
// GET ELECTRONICS PRODUCTS
// ============================================
router.get('/electronics', protect, async (req, res) => {
    try {
        const companyId = req.user.company;
        
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'No company associated with this user'
            });
        }

        const products = await Product.find({
            company: companyId,
            category: 'Electronics',
            status: 'active'
        })
        .populate('branch', 'name code city country currency currencySymbol')
        .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: products,
            count: products.length
        });
    } catch (error) {
        console.error('Error fetching electronics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching electronics',
            error: error.message
        });
    }
});

// ============================================
// GET ACCESSORIES PRODUCTS
// ============================================
router.get('/accessories', protect, async (req, res) => {
    try {
        const companyId = req.user.company;
        
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'No company associated with this user'
            });
        }

        const products = await Product.find({
            company: companyId,
            category: 'Accessories',
            status: 'active'
        })
        .populate('branch', 'name code city country currency currencySymbol')
        .sort({ createdAt: -1 });

        res.json({
            success: true,
            data: products,
            count: products.length
        });
    } catch (error) {
        console.error('Error fetching accessories:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching accessories',
            error: error.message
        });
    }
});

// ============================================
// UPLOAD PRODUCT IMAGE - ✅ NEW
// ============================================
router.post('/:id/image', protect, uploadProductImage.single('image'), async (req, res) => {
    try {
        const companyId = req.user.company;
        const { id } = req.params;

        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'No company associated with this user'
            });
        }

        const product = await Product.findOne({
            _id: id,
            company: companyId,
            status: 'active'
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        // Delete old image if exists
        if (product.image) {
            const oldPath = path.join(__dirname, '../uploads/products', path.basename(product.image));
            if (fs.existsSync(oldPath)) {
                try {
                    fs.unlinkSync(oldPath);
                    console.log(`🗑️ Deleted old product image: ${oldPath}`);
                } catch (err) {
                    console.error('Error deleting old image:', err);
                }
            }
        }

        // Save new image path
        const imagePath = `/uploads/products/${req.file.filename}`;
        product.image = imagePath;
        product.updatedAt = Date.now();
        await product.save();

        const updatedProduct = await Product.findById(product._id)
            .populate('branch', 'name code city country');

        res.json({
            success: true,
            data: updatedProduct,
            message: 'Product image uploaded successfully',
            imageUrl: imagePath
        });

    } catch (error) {
        console.error('Error uploading product image:', error);
        res.status(500).json({
            success: false,
            message: 'Error uploading product image',
            error: error.message
        });
    }
});

// ============================================
// DELETE PRODUCT IMAGE - ✅ NEW
// ============================================
router.delete('/:id/image', protect, async (req, res) => {
    try {
        const companyId = req.user.company;
        const { id } = req.params;

        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'No company associated with this user'
            });
        }

        const product = await Product.findOne({
            _id: id,
            company: companyId,
            status: 'active'
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (!product.image) {
            return res.status(400).json({
                success: false,
                message: 'Product has no image to delete'
            });
        }

        // Delete image file
        const imagePath = path.join(__dirname, '../uploads/products', path.basename(product.image));
        if (fs.existsSync(imagePath)) {
            try {
                fs.unlinkSync(imagePath);
                console.log(`🗑️ Deleted product image: ${imagePath}`);
            } catch (err) {
                console.error('Error deleting image:', err);
            }
        }

        product.image = '';
        product.updatedAt = Date.now();
        await product.save();

        const updatedProduct = await Product.findById(product._id)
            .populate('branch', 'name code city country');

        res.json({
            success: true,
            data: updatedProduct,
            message: 'Product image removed successfully'
        });

    } catch (error) {
        console.error('Error deleting product image:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting product image',
            error: error.message
        });
    }
});

// ============================================
// GET PRODUCTS BY BRANCH
// ============================================
router.get('/branch/:branchId', protect, async (req, res) => {
    try {
        const companyId = req.user.company;
        const { branchId } = req.params;
        
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

        const products = await Product.find({
            company: companyId,
            category: { $in: ['Phones', 'Electronics'] },
            status: 'active'
        })
        .populate('branch', 'name code city country currency currencySymbol')
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
            data: finalProducts,
            branch: branch
        });
    } catch (error) {
        console.error('Error fetching products by branch:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching products by branch',
            error: error.message
        });
    }
});

// ============================================
// GET PRODUCTS BY CATEGORY
// ============================================
router.get('/category/:category', protect, async (req, res) => {
    try {
        const companyId = req.user.company;
        const { category } = req.params;
        
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'No company associated with this user'
            });
        }

        const products = await Product.getProductsByCategory(companyId, category);
        
        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Error fetching products by category:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching products',
            error: error.message
        });
    }
});

// ============================================
// GET BRANCH STOCK SUMMARY
// ============================================
router.get('/branch-stock/:branchId', protect, async (req, res) => {
    try {
        const companyId = req.user.company;
        const { branchId } = req.params;

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

        const products = await Product.find({
            company: companyId,
            category: { $in: ['Phones', 'Electronics'] },
            status: 'active'
        }).lean();

        let totalUnits = 0;
        let availableUnits = 0;
        const branchProducts = [];

        for (const product of products) {
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
                const available = unitsInBranch.filter(u => u.status === 'available').length;
                totalUnits += unitsInBranch.length;
                availableUnits += available;
                branchProducts.push({
                    ...product,
                    units: unitsInBranch
                });
            }
        }

        const stats = {
            branch: {
                id: branch._id,
                name: branch.name,
                code: branch.code,
                city: branch.city,
                country: branch.country
            },
            totalProducts: branchProducts.length,
            totalUnits: totalUnits,
            availableUnits: availableUnits,
            products: branchProducts
        };

        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching branch stock summary:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching branch stock summary',
            error: error.message
        });
    }
});

// ============================================
// UPDATE PRODUCT BRANCH
// ============================================
router.put('/:id/branch', protect, async (req, res) => {
    try {
        const companyId = req.user.company;
        const { id } = req.params;
        const { branchId } = req.body;

        const product = await Product.findOne({
            _id: id,
            company: companyId
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (branchId) {
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
        }

        product.branch = branchId || null;
        product.updatedAt = Date.now();
        await product.save();

        const updatedProduct = await Product.findById(product._id)
            .populate('branch', 'name code city country');

        res.json({
            success: true,
            data: updatedProduct,
            message: branchId ? 'Product assigned to branch successfully' : 'Product removed from branch'
        });
    } catch (error) {
        console.error('Error updating product branch:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating product branch',
            error: error.message
        });
    }
});

// ============================================
// GET SINGLE PRODUCT
// ============================================
router.get('/:id', protect, async (req, res) => {
    try {
        const companyId = req.user.company;
        const { id } = req.params;
        
        const product = await Product.findOne({ 
            _id: id, 
            company: companyId,
            status: 'active'
        }).populate('branch', 'name code city country');
        
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
        console.error('Error fetching product:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching product',
            error: error.message
        });
    }
});

// ============================================
// CREATE PRODUCT WITH DUPLICATE CHECK
// ============================================
router.post('/', protect, async (req, res) => {
    try {
        const companyId = req.user.company;
        
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'No company associated with this user'
            });
        }

        const productData = {
            ...req.body,
            company: companyId,
            createdBy: req.user._id
        };

        console.log('📝 Creating/Checking product:', productData.name);

        const existingProduct = await Product.findDuplicate(companyId, productData);
        
        if (existingProduct) {
            console.log('🔍 Duplicate found! Adding to existing product:', existingProduct.name);
            
            const isSingleItem = productData.category !== 'Accessories';
            
            if (isSingleItem) {
                if (!productData.units || productData.units.length === 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'At least one unit is required for phones and electronics'
                    });
                }

                let addedCount = 0;
                let duplicateCount = 0;
                const addedUnits = [];
                const duplicateUnits = [];
                
                for (const unit of productData.units) {
                    try {
                        await existingProduct.addUnit(unit.identifier, unit.status || 'available');
                        addedCount++;
                        addedUnits.push(unit.identifier);
                    } catch (error) {
                        if (error.message === 'Identifier already exists') {
                            duplicateCount++;
                            duplicateUnits.push(unit.identifier);
                        } else {
                            throw error;
                        }
                    }
                }

                existingProduct.markModified('units');
                await existingProduct.save();
                console.log(`💾 Saved product with ${addedCount} new units`);
                
                const updatedProduct = await Product.findById(existingProduct._id)
                    .populate('branch', 'name code city country');
                console.log(`📊 Updated product has ${updatedProduct.units.length} total units`);

                return res.status(200).json({
                    success: true,
                    data: updatedProduct,
                    message: `${addedCount} unit(s) added to existing product ${existingProduct.name}`,
                    duplicate: true,
                    addedCount,
                    duplicateCount,
                    addedUnits,
                    duplicateUnits,
                    product: updatedProduct
                });
            } else {
                if (!productData.stock || productData.stock.quantity === undefined) {
                    return res.status(400).json({
                        success: false,
                        message: 'Stock quantity is required for accessories'
                    });
                }

                const currentStock = existingProduct.stock?.quantity || 0;
                const addedStock = parseInt(productData.stock.quantity);
                const newQuantity = currentStock + addedStock;
                
                existingProduct.stock.quantity = newQuantity;
                existingProduct.updatedAt = Date.now();
                await existingProduct.save();

                const updatedProduct = await Product.findById(existingProduct._id)
                    .populate('branch', 'name code city country');

                return res.status(200).json({
                    success: true,
                    data: updatedProduct,
                    message: `Stock updated for existing product ${existingProduct.name}. Added: ${addedStock}, New stock: ${newQuantity}`,
                    duplicate: true,
                    newStock: newQuantity,
                    addedStock,
                    product: updatedProduct
                });
            }
        }

        console.log('🆕 No duplicate found. Creating new product:', productData.name);
        
        if (productData.category === 'Accessories') {
            if (!productData.stock || productData.stock.quantity === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Stock quantity is required for accessories'
                });
            }
            delete productData.units;
        } else {
            if (!productData.units || productData.units.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'At least one unit is required for phones and electronics'
                });
            }
            delete productData.stock;
        }

        if (productData.units && productData.units.length > 0) {
            const identifiers = productData.units.map(u => u.identifier);
            const duplicates = identifiers.filter((id, index) => identifiers.indexOf(id) !== index);
            if (duplicates.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Duplicate identifiers found: ${duplicates.join(', ')}`
                });
            }
        }

        const product = new Product(productData);
        await product.save();

        const populatedProduct = await Product.findById(product._id)
            .populate('branch', 'name code city country');

        res.status(201).json({
            success: true,
            data: populatedProduct,
            message: 'Product created successfully',
            duplicate: false
        });
    } catch (error) {
        console.error('❌ Error creating product:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating product',
            error: error.message
        });
    }
});

// ============================================
// UPDATE PRODUCT
// ============================================
router.put('/:id', protect, async (req, res) => {
    try {
        const companyId = req.user.company;
        const { id } = req.params;
        const updates = req.body;

        const product = await Product.findOne({ 
            _id: id, 
            company: companyId 
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (updates.category === 'Accessories') {
            if (updates.stock && updates.stock.quantity === undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'Stock quantity is required for accessories'
                });
            }
            delete updates.units;
        } else {
            if (updates.units && updates.units.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'At least one unit is required for phones and electronics'
                });
            }
            delete updates.stock;
        }

        if (updates.units && updates.units.length > 0) {
            const identifiers = updates.units.map(u => u.identifier);
            const duplicates = identifiers.filter((id, index) => identifiers.indexOf(id) !== index);
            if (duplicates.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: `Duplicate identifiers found: ${duplicates.join(', ')}`
                });
            }
        }

        Object.keys(updates).forEach(key => {
            product[key] = updates[key];
        });
        product.updatedAt = Date.now();

        if (updates.units) {
            product.markModified('units');
        }
        await product.save();

        const updatedProduct = await Product.findById(product._id)
            .populate('branch', 'name code city country');

        res.json({
            success: true,
            data: updatedProduct,
            message: 'Product updated successfully'
        });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating product',
            error: error.message
        });
    }
});

// ============================================
// DELETE PRODUCT (Soft Delete)
// ============================================
router.delete('/:id', protect, async (req, res) => {
    try {
        const companyId = req.user.company;
        const { id } = req.params;

        const product = await Product.findOne({ 
            _id: id, 
            company: companyId 
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        product.status = 'inactive';
        await product.save();

        res.json({
            success: true,
            message: 'Product deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting product',
            error: error.message
        });
    }
});

// ============================================
// ADD UNIT TO PRODUCT
// ============================================
router.post('/:id/units', protect, async (req, res) => {
    try {
        const companyId = req.user.company;
        const { id } = req.params;
        const { identifier, status = 'available' } = req.body;

        const product = await Product.findOne({ 
            _id: id, 
            company: companyId 
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (product.category === 'Accessories') {
            return res.status(400).json({
                success: false,
                message: 'Cannot add units to accessories'
            });
        }

        await product.addUnit(identifier, status);
        product.markModified('units');
        await product.save();

        const updatedProduct = await Product.findById(product._id)
            .populate('branch', 'name code city country');

        res.json({
            success: true,
            data: updatedProduct,
            message: 'Unit added successfully'
        });
    } catch (error) {
        console.error('Error adding unit:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding unit',
            error: error.message
        });
    }
});

// ============================================
// BULK ADD UNITS TO PRODUCT
// ============================================
router.post('/:id/units/bulk', protect, async (req, res) => {
    try {
        const companyId = req.user.company;
        const { id } = req.params;
        const { units } = req.body;

        const product = await Product.findOne({ 
            _id: id, 
            company: companyId 
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (product.category === 'Accessories') {
            return res.status(400).json({
                success: false,
                message: 'Cannot add units to accessories'
            });
        }

        if (!units || !Array.isArray(units) || units.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide at least one unit'
            });
        }

        let addedCount = 0;
        let duplicateCount = 0;
        const addedUnits = [];
        const duplicateUnits = [];
        
        for (const unit of units) {
            try {
                await product.addUnit(unit.identifier, unit.status || 'available');
                addedCount++;
                addedUnits.push(unit.identifier);
            } catch (error) {
                if (error.message === 'Identifier already exists') {
                    duplicateCount++;
                    duplicateUnits.push(unit.identifier);
                } else {
                    throw error;
                }
            }
        }

        product.markModified('units');
        await product.save();

        const updatedProduct = await Product.findById(product._id)
            .populate('branch', 'name code city country');

        res.json({
            success: true,
            data: updatedProduct,
            message: `${addedCount} units added, ${duplicateCount} duplicate(s) skipped`,
            addedCount,
            duplicateCount,
            addedUnits,
            duplicateUnits
        });
    } catch (error) {
        console.error('Error bulk adding units:', error);
        res.status(500).json({
            success: false,
            message: 'Error bulk adding units',
            error: error.message
        });
    }
});

// ============================================
// UPDATE UNIT
// ============================================
router.put('/:id/units/:identifier', protect, async (req, res) => {
    try {
        const companyId = req.user.company;
        const { id, identifier } = req.params;
        const { newIdentifier, status } = req.body;

        const product = await Product.findOne({ 
            _id: id, 
            company: companyId 
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (newIdentifier && newIdentifier !== identifier) {
            const existingUnit = product.units.find(u => u.identifier === newIdentifier);
            if (existingUnit) {
                return res.status(400).json({
                    success: false,
                    message: 'Identifier already exists'
                });
            }
        }

        const unit = product.units.find(u => u.identifier === identifier);
        if (!unit) {
            return res.status(404).json({
                success: false,
                message: 'Unit not found'
            });
        }

        if (newIdentifier) unit.identifier = newIdentifier;
        if (status) unit.status = status;
        
        product.markModified('units');
        await product.save();

        const updatedProduct = await Product.findById(product._id)
            .populate('branch', 'name code city country');

        res.json({
            success: true,
            data: updatedProduct,
            message: 'Unit updated successfully'
        });
    } catch (error) {
        console.error('Error updating unit:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating unit',
            error: error.message
        });
    }
});

// ============================================
// DELETE UNIT
// ============================================
router.delete('/:id/units/:identifier', protect, async (req, res) => {
    try {
        const companyId = req.user.company;
        const { id, identifier } = req.params;

        const product = await Product.findOne({ 
            _id: id, 
            company: companyId 
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        await product.removeUnit(identifier);
        product.markModified('units');
        await product.save();

        const updatedProduct = await Product.findById(product._id)
            .populate('branch', 'name code city country');

        res.json({
            success: true,
            data: updatedProduct,
            message: 'Unit removed successfully'
        });
    } catch (error) {
        console.error('Error removing unit:', error);
        res.status(500).json({
            success: false,
            message: 'Error removing unit',
            error: error.message
        });
    }
});

// ============================================
// UPDATE STOCK (Accessories Only)
// ============================================
router.put('/:id/stock', protect, async (req, res) => {
    try {
        const companyId = req.user.company;
        const { id } = req.params;
        const { quantity } = req.body;

        const product = await Product.findOne({ 
            _id: id, 
            company: companyId 
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (product.category !== 'Accessories') {
            return res.status(400).json({
                success: false,
                message: 'Stock updates only available for accessories'
            });
        }

        if (quantity === undefined || quantity === null || quantity < 0) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a valid quantity'
            });
        }

        product.stock.quantity = quantity;
        product.updatedAt = Date.now();
        await product.save();

        const updatedProduct = await Product.findById(product._id)
            .populate('branch', 'name code city country');

        res.json({
            success: true,
            data: updatedProduct,
            message: 'Stock updated successfully'
        });
    } catch (error) {
        console.error('Error updating stock:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating stock',
            error: error.message
        });
    }
});

// ============================================
// GET LOW STOCK PRODUCTS
// ============================================
router.get('/low-stock', protect, async (req, res) => {
    try {
        const companyId = req.user.company;
        const products = await Product.getLowStockProducts(companyId);

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Error fetching low stock products:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching low stock products',
            error: error.message
        });
    }
});

// ============================================
// GET LOW STOCK PRODUCTS BY BRANCH
// ============================================
router.get('/low-stock/branch/:branchId', protect, async (req, res) => {
    try {
        const companyId = req.user.company;
        const { branchId } = req.params;

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

        const products = await Product.getLowStockProductsByBranch(branchId);

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Error fetching low stock products by branch:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching low stock products',
            error: error.message
        });
    }
});

// ============================================
// SEARCH PRODUCTS
// ============================================
router.get('/search/:term', protect, async (req, res) => {
    try {
        const companyId = req.user.company;
        const { term } = req.params;

        const products = await Product.searchProducts(companyId, term);

        res.json({
            success: true,
            data: products
        });
    } catch (error) {
        console.error('Error searching products:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching products',
            error: error.message
        });
    }
});

// ============================================
// UPDATE PRODUCT PRICE
// ============================================
router.put('/:id/price', protect, async (req, res) => {
    try {
        const companyId = req.user.company;
        const { id } = req.params;
        
        let purchase, sale, best;
        
        if (req.body.price) {
            purchase = req.body.price.purchase;
            sale = req.body.price.sale;
            best = req.body.price.best;
        } else {
            purchase = req.body.purchase;
            sale = req.body.sale;
            best = req.body.best;
        }

        console.log('📝 Updating price for product:', id);
        console.log('📊 New prices:', { purchase, sale, best });

        const product = await Product.findOne({ 
            _id: id, 
            company: companyId 
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found'
            });
        }

        if (sale === undefined || sale === null || parseFloat(sale) <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid selling price is required'
            });
        }

        product.price.purchase = parseFloat(purchase) || 0;
        product.price.sale = parseFloat(sale) || 0;
        product.price.best = parseFloat(best) || 0;
        
        product.updatedAt = Date.now();
        await product.save();

        const updatedProduct = await Product.findById(product._id)
            .populate('branch', 'name code city country');

        console.log('✅ Price updated successfully');

        res.json({
            success: true,
            data: updatedProduct,
            message: 'Price updated successfully'
        });
    } catch (error) {
        console.error('Error updating price:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating price',
            error: error.message
        });
    }
});

// ============================================
// FIND DUPLICATE PRODUCT
// ============================================
router.post('/check-duplicate', protect, async (req, res) => {
    try {
        const companyId = req.user.company;
        const productData = req.body;

        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'No company associated with this user'
            });
        }

        const existingProduct = await Product.findDuplicate(companyId, productData);

        res.json({
            success: true,
            duplicate: !!existingProduct,
            product: existingProduct || null
        });
    } catch (error) {
        console.error('Error checking duplicate:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking duplicate',
            error: error.message
        });
    }
});

module.exports = router;