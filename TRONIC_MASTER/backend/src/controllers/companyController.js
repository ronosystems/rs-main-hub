// /home/kk/RS/TRONIC_MASTER/backend/src/controllers/companyController.js

const Company = require('../models/Company');
const fs = require('fs');
const path = require('path');

exports.getCurrentCompany = async (req, res) => {
    try {
        const companyId = req.user.company;
        
        if (!companyId) {
            return res.status(404).json({
                success: false,
                message: 'No company assigned to this user'
            });
        }

        const company = await Company.findById(companyId);
        
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        res.json({
            success: true,
            data: {
                _id: company._id,
                name: company.name,
                code: company.code,
                description: company.description,
                email: company.email,
                phone: company.phone,
                address: company.address,
                pin: company.pin,
                logo: company.logo,
                project: company.project,
                projectType: company.projectType,
                status: company.status,
                isActive: company.isActive,
                settings: company.settings,
                adminUser: company.adminUser,
                subscription: company.subscription,
                createdAt: company.createdAt,
                updatedAt: company.updatedAt
            }
        });
    } catch (error) {
        console.error('Error fetching current company:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch company details'
        });
    }
};


// ============================================
// EXISTING FUNCTION - Get Company Settings
// ============================================
exports.getCompanySettings = async (req, res) => {
    try {
        const companyId = req.user.company;
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        res.json({
            success: true,
            data: company
        });
    } catch (error) {
        console.error('Error fetching company settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch company settings'
        });
    }
};


exports.updateCompanySettings = async (req, res) => {
    try {
        const companyId = req.user.company;
        const updates = req.body;

        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        if (updates.name) company.name = updates.name;
        if (updates.email) company.email = updates.email;
        if (updates.phone) company.phone = updates.phone;
        if (updates.address) company.address = updates.address;
        if (updates.pin) company.pin = updates.pin;
        if (updates.description) company.description = updates.description;
        
        if (updates.settings) {
            company.settings = {
                ...company.settings,
                ...updates.settings
            };
        }

        company.updatedAt = Date.now();
        await company.save();

        res.json({
            success: true,
            data: company,
            message: 'Company settings updated successfully'
        });
    } catch (error) {
        console.error('Error updating company settings:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update company settings'
        });
    }
};

exports.uploadCompanyLogo = async (req, res) => {
    try {
        console.log('📸 Upload logo endpoint hit!');
        console.log('File:', req.file);

        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        const companyId = req.user.company;
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        // Delete old logo if exists
        if (company.logo) {
            const oldPath = path.join(__dirname, '../uploads/logos', path.basename(company.logo));
            if (fs.existsSync(oldPath)) {
                try {
                    fs.unlinkSync(oldPath);
                    console.log('🗑️ Deleted old logo:', oldPath);
                } catch (err) {
                    console.error('Error deleting old logo:', err);
                }
            }
        }

        // ✅ Save relative path
        const relativePath = `/uploads/logos/${req.file.filename}`;
        company.logo = relativePath;
        company.updatedAt = Date.now();
        await company.save();

        // ✅ Return the full URL
        const fullUrl = `${req.protocol}://${req.get('host')}${relativePath}`;

        res.json({
            success: true,
            data: company,
            logoUrl: fullUrl,
            message: 'Company logo updated successfully'
        });
    } catch (error) {
        console.error('Error uploading company logo:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to upload company logo: ' + error.message
        });
    }
};


exports.removeCompanyLogo = async (req, res) => {
    try {
        const companyId = req.user.company;
        const company = await Company.findById(companyId);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        if (company.logo) {
            const oldPath = path.join(__dirname, '../uploads/logos', path.basename(company.logo));
            if (fs.existsSync(oldPath)) {
                try {
                    fs.unlinkSync(oldPath);
                    console.log('🗑️ Deleted logo:', oldPath);
                } catch (err) {
                    console.error('Error deleting logo:', err);
                }
            }
        }

        company.logo = '';
        company.updatedAt = Date.now();
        await company.save();

        res.json({
            success: true,
            data: company,
            message: 'Company logo removed successfully'
        });
    } catch (error) {
        console.error('Error removing company logo:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to remove company logo'
        });
    }
};