const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Category = require('../models/Category');

router.get('/', protect, async (req, res) => {
    try {
        const companyId = req.user.company?._id;
        const categories = await Category.find({ company: companyId, isActive: true });
        
        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching categories'
        });
    }
});

module.exports = router;
