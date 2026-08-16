const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const City = require('../models/City');
const Country = require('../models/Country');

// GET all cities
router.get('/', protect, async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'No company associated with this user'
            });
        }

        const cities = await City.getCitiesByCompany(companyId);
        
        res.json({
            success: true,
            data: cities
        });
    } catch (error) {
        console.error('Error fetching cities:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching cities',
            error: error.message
        });
    }
});

// GET cities by country
router.get('/country/:countryId', protect, async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        const { countryId } = req.params;

        const cities = await City.getCitiesByCountry(companyId, countryId);
        
        res.json({
            success: true,
            data: cities
        });
    } catch (error) {
        console.error('Error fetching cities by country:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching cities',
            error: error.message
        });
    }
});

// GET single city
router.get('/:id', protect, async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        const { id } = req.params;

        const city = await City.findOne({
            _id: id,
            company: companyId
        }).populate('country', 'name code');

        if (!city) {
            return res.status(404).json({
                success: false,
                message: 'City not found'
            });
        }

        res.json({
            success: true,
            data: city
        });
    } catch (error) {
        console.error('Error fetching city:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching city',
            error: error.message
        });
    }
});

// CREATE city
router.post('/', protect, async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        
        if (!companyId) {
            return res.status(400).json({
                success: false,
                message: 'No company associated with this user'
            });
        }

        const { name, code, countryId } = req.body;

        const country = await Country.findOne({
            _id: countryId,
            company: companyId,
            isActive: true
        });

        if (!country) {
            return res.status(404).json({
                success: false,
                message: 'Country not found'
            });
        }

        const existingCity = await City.findOne({
            company: companyId,
            country: countryId,
            name: { $regex: new RegExp('^' + name.trim() + '$', 'i') }
        });

        if (existingCity) {
            return res.status(400).json({
                success: false,
                message: 'City already exists in this country'
            });
        }

        const city = new City({
            company: companyId,
            country: countryId,
            name: name.trim(),
            code: code || '',
            createdBy: req.user._id
        });

        await city.save();

        const populatedCity = await City.findById(city._id)
            .populate('country', 'name code');

        res.status(201).json({
            success: true,
            data: populatedCity,
            message: 'City created successfully'
        });
    } catch (error) {
        console.error('Error creating city:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating city',
            error: error.message
        });
    }
});

// UPDATE city
router.put('/:id', protect, async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        const { id } = req.params;
        const updates = req.body;

        const city = await City.findOne({
            _id: id,
            company: companyId
        });

        if (!city) {
            return res.status(404).json({
                success: false,
                message: 'City not found'
            });
        }

        if (updates.countryId) {
            const country = await Country.findOne({
                _id: updates.countryId,
                company: companyId,
                isActive: true
            });

            if (!country) {
                return res.status(404).json({
                    success: false,
                    message: 'Country not found'
                });
            }
            city.country = updates.countryId;
        }

        if (updates.name) {
            const existingCity = await City.findOne({
                company: companyId,
                country: city.country,
                name: { $regex: new RegExp('^' + updates.name.trim() + '$', 'i') },
                _id: { $ne: id }
            });

            if (existingCity) {
                return res.status(400).json({
                    success: false,
                    message: 'City already exists in this country'
                });
            }
            city.name = updates.name.trim();
        }

        if (updates.code !== undefined) city.code = updates.code;
        if (updates.isActive !== undefined) city.isActive = updates.isActive;
        
        city.updatedAt = Date.now();
        await city.save();

        const populatedCity = await City.findById(city._id)
            .populate('country', 'name code');

        res.json({
            success: true,
            data: populatedCity,
            message: 'City updated successfully'
        });
    } catch (error) {
        console.error('Error updating city:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating city',
            error: error.message
        });
    }
});

// DELETE city
router.delete('/:id', protect, async (req, res) => {
    try {
        const companyId = req.user.company?._id || req.user.company;
        const { id } = req.params;

        const city = await City.findOne({
            _id: id,
            company: companyId
        });

        if (!city) {
            return res.status(404).json({
                success: false,
                message: 'City not found'
            });
        }

        city.isActive = false;
        await city.save();

        res.json({
            success: true,
            message: 'City deactivated successfully'
        });
    } catch (error) {
        console.error('Error deleting city:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting city',
            error: error.message
        });
    }
});

module.exports = router;
