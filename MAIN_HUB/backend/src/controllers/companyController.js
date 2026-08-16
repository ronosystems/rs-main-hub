// /home/kk/RS/MAIN HUB/backend/src/controllers/companyController.js

const Company = require('../models/Company');
const User = require('../models/User');
const Plan = require('../models/Plan');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { getAllProjects, getProjectByType } = require('../config/project');

// =============== GET COMPANY STATUSES ===============
const getCompanyStatuses = async (req, res) => {
    try {
        const statuses = await Company.distinct('status');
        const filtered = statuses.filter(s => s).sort();
        res.status(200).json({
            success: true,
            data: filtered
        });
    } catch (error) {
        console.error('Error fetching statuses:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching statuses',
            error: error.message
        });
    }
};

// =============== GET EXPIRING COMPANIES ===============
const getExpiringCompanies = async (req, res) => {
    try {
        const { days = 7 } = req.query;
        const companies = await Company.findExpiringSoon(parseInt(days))
            .populate('plan', 'name code price billingCycle');
        res.status(200).json({
            success: true,
            count: companies.length,
            data: companies
        });
    } catch (error) {
        console.error('Error fetching expiring companies:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching expiring companies',
            error: error.message
        });
    }
};


// =============== CREATE COMPANY WITH ADMIN USER ===============
const createCompany = async (req, res) => {
    try {
        console.log('📝 Received company creation request');
        console.log('📦 Request body:', JSON.stringify(req.body, null, 2));

        const {
            name,
            email,
            phone,
            address,
            pin,
            description,
            projectType,
            projectId,
            planId,
            planRenewal,
            adminUser,
            subscription
        } = req.body;

        // ===== STEP 1: VALIDATE REQUIRED FIELDS =====
        const errors = [];
        
        if (!name) errors.push('Company name is required');
        if (!email) errors.push('Company email is required');
        if (!adminUser) errors.push('Admin user details are required');
        if (!adminUser?.name) errors.push('Admin name is required');
        if (!adminUser?.email) errors.push('Admin email is required');
        if (!adminUser?.password) errors.push('Admin password is required');
        
        // ===== HANDLE PROJECT TYPE - ACCEPT BOTH projectType AND projectId =====
        let finalProjectType = projectType || projectId;
        
        if (!finalProjectType || finalProjectType === '0' || finalProjectType === '') {
            errors.push('Project type is required');
        } else {
            const projectExists = getAllProjects().some(p => p.type === finalProjectType);
            if (!projectExists) {
                errors.push(`Invalid project type: ${finalProjectType}. Available: ${getAllProjects().map(p => p.type).join(', ')}`);
            }
        }
        
        if (!planId || planId === '0' || planId === '') {
            errors.push('Plan selection is required');
        }

        if (errors.length > 0) {
            console.log('❌ Validation errors:', errors);
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors
            });
        }

        // ===== STEP 2: CHECK FOR DUPLICATES =====
        const existingCompany = await Company.findOne({ email: email.toLowerCase() });
        if (existingCompany) {
            return res.status(400).json({
                success: false,
                message: 'Company with this email already exists'
            });
        }

        const existingUser = await User.findOne({ email: adminUser.email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Admin user email already exists'
            });
        }

        // ===== STEP 3: VALIDATE REFERENCES =====
        const projectExists = getAllProjects().some(p => p.type === finalProjectType);
        if (!projectExists) {
            return res.status(404).json({
                success: false,
                message: `Project type "${finalProjectType}" not found in config. Available: ${getAllProjects().map(p => p.type).join(', ')}`
            });
        }

        if (planId) {
            const plan = await Plan.findById(planId);
            if (!plan) {
                return res.status(404).json({
                    success: false,
                    message: 'Plan not found'
                });
            }
        }

        // ===== STEP 4: CREATE ADMIN USER =====
        console.log('👤 Creating admin user...');
        
        // ✅ FIX: Assign company_admin role to the admin user
        const newAdminUser = new User({
            name: adminUser.name.trim(),
            email: adminUser.email.toLowerCase().trim(),
            password: adminUser.password,
            role: 'guest', // System role in MAIN HUB - always 'guest' for company users
            companyRole: 'company_admin', // ✅ Company-specific role for TRONIC_MASTER
            phone: adminUser.phone || phone || '',
            isActive: true,
            project: finalProjectType,
            projectRole: 'admin',
            settings: {
                theme: 'light',
                notifications: true,
                language: 'en'
            }
        });

        const savedAdminUser = await newAdminUser.save();
        console.log('✅ Admin user created with:', {
            name: savedAdminUser.name,
            email: savedAdminUser.email,
            role: savedAdminUser.role,
            companyRole: savedAdminUser.companyRole, // ✅ Should show 'company_admin'
            projectRole: savedAdminUser.projectRole,
            project: savedAdminUser.project,
            hasPassword: !!savedAdminUser.password
        });

        // ===== STEP 5: CREATE COMPANY =====
        console.log('🏢 Creating company...');

        let cleanProjectType = finalProjectType;
        if (!cleanProjectType || cleanProjectType === '0' || cleanProjectType === '') {
            cleanProjectType = 'RETAIL_MASTER';
        }

        const companyData = {
            name: name.trim(),
            email: email.toLowerCase().trim(),
            phone: phone || '',
            address: address || '',
            pin: pin || '',
            description: description || '',
            projectType: cleanProjectType,
            project: cleanProjectType,
            plan: planId || null,
            planRenewal: {
                type: planRenewal?.type || 'manual',
                autoRenewEnabled: planRenewal?.autoRenewEnabled || false,
                renewalDate: planRenewal?.renewalDate || null,
                lastRenewalDate: planRenewal?.lastRenewalDate || null,
                nextRenewalDate: planRenewal?.nextRenewalDate || null
            },
            adminUser: {
                name: adminUser.name.trim(),
                email: adminUser.email.toLowerCase().trim(),
                phone: adminUser.phone || phone || '',
                userId: savedAdminUser._id
            },
            subscription: {
                startDate: subscription?.startDate || new Date(),
                endDate: subscription?.endDate || null,
                trialEndDate: subscription?.trialEndDate || null,
                isTrial: subscription?.isTrial !== undefined ? subscription.isTrial : true,
                status: subscription?.status || 'trial'
            },
            status: 'active',
            isActive: true,
            createdBy: req.user?._id || null
        };

        console.log('📋 Company data:', JSON.stringify(companyData, null, 2));

        const company = new Company(companyData);
        const savedCompany = await company.save();
        console.log('✅ Company created:', savedCompany._id);

        // ===== STEP 6: UPDATE USER WITH COMPANY REFERENCE =====
        savedAdminUser.company = savedCompany._id;
        await savedAdminUser.save();
        console.log('✅ Admin user updated with company reference');

        // ===== STEP 7: POPULATE RESPONSE =====
        const populatedCompany = await Company.findById(savedCompany._id)
            .populate('plan', 'name code price billingCycle')
            .populate('createdBy', 'name email');

        const updatedAdminUser = await User.findById(savedAdminUser._id)
            .select('-password')
            .populate('company', 'name code');

        console.log('✅ Company creation complete!');

        res.status(201).json({
            success: true,
            message: 'Company created successfully',
            data: {
                company: populatedCompany,
                adminUser: updatedAdminUser
            }
        });

    } catch (error) {
        console.error('❌ Error creating company:', error);
        
        if (error.name === 'ValidationError') {
            const validationErrors = {};
            for (let field in error.errors) {
                validationErrors[field] = error.errors[field].message;
            }
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: validationErrors
            });
        }

        res.status(500).json({
            success: false,
            message: 'Error creating company',
            error: error.message
        });
    }
};

// =============== GET ALL COMPANIES ===============
const getAllCompanies = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search,
            status,
            projectType,
            sortBy = 'createdAt',
            sortOrder = 'desc'
        } = req.query;

        const filter = {};
        if (status) filter.status = status;
        if (projectType) filter.projectType = projectType;
        if (search) {
            filter.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } }
            ];
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

        const companies = await Company.find(filter)
            .populate('plan', 'name code price billingCycle')
            .populate('createdBy', 'name email')
            .populate('adminUser.userId', 'name email phone role projectRole')
            .sort(sort)
            .skip(skip)
            .limit(parseInt(limit));

        const total = await Company.countDocuments(filter);

        const enrichedCompanies = companies.map(company => {
            const companyObj = company.toObject();
            const projectConfig = getProjectByType(companyObj.projectType);
            if (projectConfig) {
                companyObj.projectDetails = projectConfig;
            }
            return companyObj;
        });

        res.status(200).json({
            success: true,
            data: enrichedCompanies,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / parseInt(limit))
            }
        });

    } catch (error) {
        console.error('Error fetching companies:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching companies',
            error: error.message
        });
    }
};

// =============== GET SINGLE COMPANY ===============
const getCompanyById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid company ID'
            });
        }

        const company = await Company.findById(id)
            .populate('plan', 'name code price billingCycle features status')
            .populate('createdBy', 'name email phone')
            .populate('updatedBy', 'name email')
            .populate('adminUser.userId', 'name email phone role projectRole isActive');

        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        const projectConfig = getProjectByType(company.projectType);
        const companyObj = company.toObject();
        if (projectConfig) {
            companyObj.projectDetails = projectConfig;
        }

        const users = await User.find({ company: id })
            .select('name email role phone isActive lastLogin project projectRole')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            data: {
                company: companyObj,
                users: users || []
            }
        });

    } catch (error) {
        console.error('Error fetching company:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching company',
            error: error.message
        });
    }
};

// =============== UPDATE COMPANY ===============
const updateCompany = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid company ID'
            });
        }

        const updates = req.body;
        console.log('📝 Update company request:', JSON.stringify(updates, null, 2));
        
        delete updates.code;
        delete updates._id;
        delete updates.createdAt;
        delete updates.adminUser?.userId;
        delete updates.subscription?.startDate;
        delete updates.createdBy;
        delete updates.updatedBy;
        delete updates.planType;

        const company = await Company.findById(id);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        // Handle project update
        if (updates.projectId !== undefined) {
            const projectValue = updates.projectId;
            if (!projectValue || projectValue === 'null' || projectValue === '') {
                company.project = null;
                company.projectType = null;
                if (company.adminUser?.userId) {
                    await User.findByIdAndUpdate(company.adminUser.userId, {
                        project: null
                    });
                }
            } else {
                const projectConfig = getProjectByType(projectValue);
                if (!projectConfig) {
                    return res.status(404).json({
                        success: false,
                        message: `Project "${projectValue}" not found`
                    });
                }
                company.project = projectValue;
                company.projectType = projectValue;
                if (company.adminUser?.userId) {
                    await User.findByIdAndUpdate(company.adminUser.userId, {
                        project: projectValue,
                        projectRole: 'admin'
                    });
                }
            }
            delete updates.projectId;
        }

        // Handle other updates
        const updateKeys = Object.keys(updates);
        for (let i = 0; i < updateKeys.length; i++) {
            const key = updateKeys[i];
            if (updates[key] !== undefined && updates[key] !== null) {
                company[key] = updates[key];
            }
        }

        company.updatedBy = req.user?._id || null;
        await company.save();

        const updatedCompany = await Company.findById(id)
            .populate('plan', 'name code price billingCycle')
            .populate('createdBy', 'name email')
            .populate('updatedBy', 'name email');

        res.status(200).json({
            success: true,
            message: 'Company updated successfully',
            data: updatedCompany
        });

    } catch (error) {
        console.error('❌ Error updating company:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating company',
            error: error.message
        });
    }
};

// =============== DELETE COMPANY (Permanent or Soft) ===============
const deleteCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const { permanent = false, soft = false } = req.query;

        console.log('🗑️ Delete company request:', { id, permanent, soft });

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid company ID'
            });
        }

        const company = await Company.findById(id);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        // ===== PERMANENT DELETE (Hard Delete) =====
        if (permanent === 'true') {
            console.log('🗑️ Performing PERMANENT delete...');
            
            // Delete all users associated with this company
            const deletedUsers = await User.deleteMany({ company: id });
            console.log(`👥 Deleted ${deletedUsers.deletedCount} users`);
            
            // Delete the company
            const deletedCompany = await Company.findByIdAndDelete(id);
            console.log(`🏢 Permanently deleted company: ${deletedCompany.name}`);
            
            return res.status(200).json({
                success: true,
                message: 'Company permanently deleted',
                data: {
                    company: deletedCompany,
                    usersDeleted: deletedUsers.deletedCount
                }
            });
        }

        // ===== SOFT DELETE (Deactivate) =====
        if (soft === 'true' || !permanent) {
            console.log('🔄 Performing SOFT delete (deactivation)...');
            
            company.status = 'inactive';
            company.isActive = false;
            company.updatedBy = req.user?._id || null;
            await company.save();

            // Deactivate all users
            await User.updateMany(
                { company: id },
                { isActive: false }
            );

            return res.status(200).json({
                success: true,
                message: 'Company deactivated successfully',
                data: company
            });
        }

        // Default: Soft delete
        company.status = 'inactive';
        company.isActive = false;
        company.updatedBy = req.user?._id || null;
        await company.save();

        await User.updateMany(
            { company: id },
            { isActive: false }
        );

        res.status(200).json({
            success: true,
            message: 'Company deactivated successfully',
            data: company
        });

    } catch (error) {
        console.error('Error deleting company:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting company',
            error: error.message
        });
    }
};

// =============== PERMANENT DELETE COMPANY (Hard Delete) ===============
const permanentDeleteCompany = async (req, res) => {
    try {
        const { id } = req.params;

        console.log('🗑️ PERMANENT DELETE request for company:', id);

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid company ID'
            });
        }

        const company = await Company.findById(id);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        // Delete all users associated with this company
        const deletedUsers = await User.deleteMany({ company: id });
        console.log(`👥 Deleted ${deletedUsers.deletedCount} users`);

        // Delete the company
        const deletedCompany = await Company.findByIdAndDelete(id);
        console.log(`🏢 Permanently deleted company: ${deletedCompany.name}`);

        res.status(200).json({
            success: true,
            message: 'Company permanently deleted',
            data: {
                company: deletedCompany,
                usersDeleted: deletedUsers.deletedCount
            }
        });

    } catch (error) {
        console.error('Error permanently deleting company:', error);
        res.status(500).json({
            success: false,
            message: 'Error permanently deleting company',
            error: error.message
        });
    }
};

// =============== REACTIVATE COMPANY ===============
const reactivateCompany = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid company ID'
            });
        }

        const company = await Company.findById(id);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        company.status = 'active';
        company.isActive = true;
        company.updatedBy = req.user?._id || null;
        await company.save();

        await User.updateMany(
            { company: id },
            { isActive: true }
        );

        const updatedCompany = await Company.findById(id)
            .populate('plan', 'name code price billingCycle');

        res.status(200).json({
            success: true,
            message: 'Company reactivated successfully',
            data: updatedCompany
        });

    } catch (error) {
        console.error('Error reactivating company:', error);
        res.status(500).json({
            success: false,
            message: 'Error reactivating company',
            error: error.message
        });
    }
};

// =============== UPDATE COMPANY SUBSCRIPTION ===============
const updateSubscription = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            planId,
            startDate,
            endDate,
            status,
            isTrial,
            trialEndDate
        } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid company ID'
            });
        }

        const company = await Company.findById(id);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        if (planId) {
            const plan = await Plan.findById(planId);
            if (!plan) {
                return res.status(404).json({
                    success: false,
                    message: 'Plan not found'
                });
            }
            company.plan = planId;
        }

        if (startDate) company.subscription.startDate = new Date(startDate);
        if (endDate) company.subscription.endDate = new Date(endDate);
        if (trialEndDate) company.subscription.trialEndDate = new Date(trialEndDate);
        if (isTrial !== undefined) company.subscription.isTrial = isTrial;
        if (status) company.subscription.status = status;

        company.updatedBy = req.user?._id || null;
        await company.save();

        const updatedCompany = await Company.findById(id)
            .populate('plan', 'name code price billingCycle');

        res.status(200).json({
            success: true,
            message: 'Subscription updated successfully',
            data: updatedCompany
        });

    } catch (error) {
        console.error('Error updating subscription:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating subscription',
            error: error.message
        });
    }
};

// =============== RENEW COMPANY SUBSCRIPTION ===============
const renewSubscription = async (req, res) => {
    try {
        const { id } = req.params;
        const { renewalPeriod = 'yearly' } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid company ID'
            });
        }

        const company = await Company.findById(id);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }

        let newEndDate = new Date();
        if (renewalPeriod === 'monthly') {
            newEndDate.setMonth(newEndDate.getMonth() + 1);
        } else {
            newEndDate.setFullYear(newEndDate.getFullYear() + 1);
        }

        company.subscription.startDate = new Date();
        company.subscription.endDate = newEndDate;
        company.subscription.status = 'active';
        company.subscription.isTrial = false;

        company.planRenewal.lastRenewalDate = new Date();
        company.planRenewal.nextRenewalDate = newEndDate;

        company.status = 'active';
        company.isActive = true;
        company.updatedBy = req.user?._id || null;

        await company.save();

        const updatedCompany = await Company.findById(id)
            .populate('plan', 'name code price billingCycle');

        res.status(200).json({
            success: true,
            message: 'Subscription renewed successfully',
            data: updatedCompany
        });

    } catch (error) {
        console.error('Error renewing subscription:', error);
        res.status(500).json({
            success: false,
            message: 'Error renewing subscription',
            error: error.message
        });
    }
};


// /home/kk/RS/MAIN HUB/backend/src/controllers/companyController.js

// =============== LOGIN AS COMPANY (Super Admin Only) ===============
const loginAsCompany = async (req, res) => {
    try {
        const { id } = req.params;
        const user = req.user;
        
        console.log(`🔐 Login as company request: User ${user.email} (${user.role}) attempting to login as company ${id}`);
        
        // Check if user is super admin
        if (user.role !== 'super_admin') {
            return res.status(403).json({
                success: false,
                message: 'Only super admins can login as company'
            });
        }
        
        // Find company
        const company = await Company.findById(id);
        if (!company) {
            return res.status(404).json({
                success: false,
                message: 'Company not found'
            });
        }
        
        console.log(`📋 Company found: ${company.name} (${company.code})`);
        
        // Check if company is active
        if (company.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: `Cannot login to company with status: ${company.status}`
            });
        }
        
        // Get the company admin user
        const adminUser = await User.findById(company.adminUser?.userId);
        if (!adminUser) {
            return res.status(404).json({
                success: false,
                message: 'Company admin user not found'
            });
        }
        
        console.log(`👤 Admin user found: ${adminUser.email}`);
        console.log(`👤 Admin user role: ${adminUser.role}`);
        console.log(`👤 Admin user companyRole: ${adminUser.companyRole}`);
        
        // ✅ Use companyRole for TRONIC_MASTER
        const tronicRole = adminUser.companyRole || 'company_admin';
        
        console.log(`🔑 Using role for TRONIC_MASTER: ${tronicRole}`);
        
        // Generate JWT token for TRONIC_MASTER
        const jwt = require('jsonwebtoken');
        const token = jwt.sign(
            {
                id: adminUser._id,
                email: adminUser.email,
                name: adminUser.name,
                role: tronicRole,
                companyRole: tronicRole,
                projectRole: adminUser.projectRole || 'admin',
                companyId: company._id,
                companyCode: company.code,
                companyName: company.name,
                projectType: company.projectType,
                loginAs: true,
                originalUserId: user._id,
                originalUserEmail: user.email,
                originalUserRole: user.role,
                source: 'MAIN_HUB'
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );
        
        console.log(`✅ Successfully logged in as ${company.name} with role: ${tronicRole}`);
        
        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: adminUser._id,
                    name: adminUser.name,
                    email: adminUser.email,
                    role: tronicRole,
                    companyRole: tronicRole,
                    projectRole: adminUser.projectRole || 'admin',
                    company: {
                        id: company._id,
                        name: company.name,
                        code: company.code,
                        email: company.email,
                        projectType: company.projectType
                    }
                },
                company: {
                    id: company._id,
                    name: company.name,
                    code: company.code,
                    email: company.email,
                    status: company.status,
                    projectType: company.projectType,
                    subscription: company.subscription,
                    settings: company.settings
                },
                loginAs: {
                    isLoginAs: true,
                    originalUser: {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        role: user.role
                    }
                }
            },
            message: `Successfully logged in as ${company.name}`
        });
    } catch (error) {
        console.error('❌ Error logging in as company:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Failed to login as company'
        });
    }
};


// =============== EXPORT ALL FUNCTIONS ===============
module.exports = {
    getCompanyStatuses,
    getExpiringCompanies,
    createCompany,
    getAllCompanies,
    getCompanyById,
    updateCompany,
    deleteCompany,
    permanentDeleteCompany,
    reactivateCompany,
    updateSubscription,
    renewSubscription,
    loginAsCompany 
};