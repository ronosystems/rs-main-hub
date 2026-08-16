const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Country = require('../models/Country');

// GET all countries
router.get('/', protect, async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'No company associated with this user'
            });
        }

        const countries = await Country.getCountriesByCompany(companyId);
        
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

// GET single country
router.get('/:id', protect, async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        const { id } = req.params;

        const country = await Country.findOne({
            _id: id,
            company: companyId
        });

        if (!country) {
            return res.status(404).json({
                success: false,
                message: 'Country not found'
            });
        }

        res.json({
            success: true,
            data: country
        });
    } catch (error) {
        console.error('Error fetching country:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching country',
            error: error.message
        });
    }
});

// CREATE country
router.post('/', protect, async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'No company associated with this user'
            });
        }

        const { name, code, dialCode, currency, currencySymbol } = req.body;

        const existingCountry = await Country.findOne({
            company: companyId,
            $or: [
                { name: { $regex: new RegExp('^' + name.trim() + '$', 'i') } },
                { code: { $regex: new RegExp('^' + code.trim() + '$', 'i') } }
            ]
        });

        if (existingCountry) {
            return res.status(400).json({
                success: false,
                message: 'Country with this name or code already exists'
            });
        }

        const country = new Country({
            company: companyId,
            name: name.trim(),
            code: code.trim().toUpperCase(),
            dialCode: dialCode || '',
            currency: currency || '',
            currencySymbol: currencySymbol || '',
            createdBy: req.user._id
        });

        await country.save();

        res.status(201).json({
            success: true,
            data: country,
            message: 'Country created successfully'
        });
    } catch (error) {
        console.error('Error creating country:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating country',
            error: error.message
        });
    }
});

// UPDATE country
router.put('/:id', protect, async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        const { id } = req.params;
        const updates = req.body;

        const country = await Country.findOne({
            _id: id,
            company: companyId
        });

        if (!country) {
            return res.status(404).json({
                success: false,
                message: 'Country not found'
            });
        }

        if (updates.name) country.name = updates.name.trim();
        if (updates.code) country.code = updates.code.trim().toUpperCase();
        if (updates.dialCode !== undefined) country.dialCode = updates.dialCode;
        if (updates.currency !== undefined) country.currency = updates.currency;
        if (updates.currencySymbol !== undefined) country.currencySymbol = updates.currencySymbol;
        if (updates.isActive !== undefined) country.isActive = updates.isActive;
        
        country.updatedAt = Date.now();
        await country.save();

        res.json({
            success: true,
            data: country,
            message: 'Country updated successfully'
        });
    } catch (error) {
        console.error('Error updating country:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating country',
            error: error.message
        });
    }
});

// DELETE country
router.delete('/:id', protect, async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        const { id } = req.params;

        const country = await Country.findOne({
            _id: id,
            company: companyId
        });

        if (!country) {
            return res.status(404).json({
                success: false,
                message: 'Country not found'
            });
        }

        country.isActive = false;
        await country.save();

        res.json({
            success: true,
            message: 'Country deactivated successfully'
        });
    } catch (error) {
        console.error('Error deleting country:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting country',
            error: error.message
        });
    }
});

// SEARCH countries
router.get('/search/:term', protect, async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        const { term } = req.params;

        const countries = await Country.searchCountries(companyId, term);

        res.json({
            success: true,
            data: countries
        });
    } catch (error) {
        console.error('Error searching countries:', error);
        res.status(500).json({
            success: false,
            message: 'Error searching countries',
            error: error.message
        });
    }
});

module.exports = router;
