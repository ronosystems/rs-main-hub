const mongoose = require('mongoose');
const Role = require('../models/Role');

// Get all roles
exports.getRoles = async (req, res) => {
    try {
        const roles = await Role.find({ isActive: true }).sort({ createdAt: -1 });
        res.json({ success: true, data: roles });
    } catch (error) {
        console.error('Get roles error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Get single role
exports.getRole = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('🔍 Getting role with ID/name:', id);
        
        let role;
        const isValidObjectId = mongoose.Types.ObjectId.isValid(id);
        
        if (isValidObjectId) {
            role = await Role.findById(id);
        } else {
            role = await Role.findOne({ name: id });
        }
        
        if (!role) {
            console.log('❌ Role not found:', id);
            return res.status(404).json({ message: 'Role not found' });
        }
        
        console.log('✅ Role found:', role.name);
        res.json({ success: true, data: role });
    } catch (error) {
        console.error('Get role error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Create role
exports.createRole = async (req, res) => {
    try {
        const { name, description, permissions, isDefault } = req.body;
        
        const existingRole = await Role.findOne({ name });
        if (existingRole) {
            return res.status(400).json({ message: 'Role with this name already exists' });
        }

        const role = await Role.create({
            name,
            description,
            permissions: permissions || {},
            isDefault: isDefault || false
        });

        res.status(201).json({ 
            success: true, 
            message: 'Role created successfully',
            data: role 
        });
    } catch (error) {
        console.error('Create role error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Update role - FIXED: Uses save() to trigger pre-save middleware
exports.updateRole = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;
        
        // Find the role first
        const role = await Role.findById(id);
        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }

        // Update fields manually
        if (updateData.name) role.name = updateData.name;
        if (updateData.description) role.description = updateData.description;
        if (updateData.permissions) role.permissions = updateData.permissions;
        if (updateData.isDefault !== undefined) role.isDefault = updateData.isDefault;
        if (updateData.isActive !== undefined) role.isActive = updateData.isActive;

        // Save the role - this triggers pre('save') middleware
        await role.save();

        res.json({ 
            success: true, 
            message: 'Role updated successfully',
            data: role 
        });
    } catch (error) {
        console.error('Update role error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Delete role
exports.deleteRole = async (req, res) => {
    try {
        const role = await Role.findById(req.params.id);
        if (!role) {
            return res.status(404).json({ message: 'Role not found' });
        }
        if (role.isDefault) {
            return res.status(400).json({ message: 'Cannot delete default role' });
        }
        role.isActive = false;
        await role.save();
        res.json({ 
            success: true, 
            message: 'Role deleted successfully' 
        });
    } catch (error) {
        console.error('Delete role error:', error);
        res.status(500).json({ message: error.message });
    }
};

// Seed default roles
exports.seedDefaultRoles = async (req, res) => {
    try {
        const defaultRoles = [
            {
                name: 'Super Admin',
                description: 'Full system access',
                permissions: {
                    viewDashboard: true,
                    viewProjects: true,
                    createProjects: true,
                    editProjects: true,
                    deleteProjects: true,
                    viewCompanies: true,
                    createCompanies: true,
                    editCompanies: true,
                    deleteCompanies: true,
                    viewUsers: true,
                    createUsers: true,
                    editUsers: true,
                    deleteUsers: true,
                    manageRoles: true,
                    viewReports: true,
                    exportReports: true,
                    viewSettings: true,
                    editSettings: true,
                    viewPlans: true
                },
                isDefault: true
            },
            {
                name: 'Admin',
                description: 'Manage companies and users',
                permissions: {
                    viewDashboard: true,
                    viewProjects: true,
                    createProjects: false,
                    editProjects: false,
                    deleteProjects: false,
                    viewCompanies: true,
                    createCompanies: true,
                    editCompanies: true,
                    deleteCompanies: false,
                    viewUsers: true,
                    createUsers: true,
                    editUsers: true,
                    deleteUsers: false,
                    manageRoles: false,
                    viewReports: true,
                    exportReports: false,
                    viewSettings: true,
                    editSettings: false,
                    viewPlans: true
                },
                isDefault: true
            },
            {
                name: 'Manager',
                description: 'Manage operations',
                permissions: {
                    viewDashboard: true,
                    viewProjects: true,
                    createProjects: false,
                    editProjects: false,
                    deleteProjects: false,
                    viewCompanies: true,
                    createCompanies: false,
                    editCompanies: false,
                    deleteCompanies: false,
                    viewUsers: true,
                    createUsers: false,
                    editUsers: false,
                    deleteUsers: false,
                    manageRoles: false,
                    viewReports: true,
                    exportReports: false,
                    viewSettings: false,
                    editSettings: false,
                    viewPlans: true
                },
                isDefault: true
            },
            {
                name: 'Staff',
                description: 'Basic operations',
                permissions: {
                    viewDashboard: true,
                    viewProjects: true,
                    createProjects: false,
                    editProjects: false,
                    deleteProjects: false,
                    viewCompanies: false,
                    createCompanies: false,
                    editCompanies: false,
                    deleteCompanies: false,
                    viewUsers: false,
                    createUsers: false,
                    editUsers: false,
                    deleteUsers: false,
                    manageRoles: false,
                    viewReports: false,
                    exportReports: false,
                    viewSettings: false,
                    editSettings: false,
                    viewPlans: true
                },
                isDefault: true
            },
            {
                name: 'Guest',
                description: 'View only access',
                permissions: {
                    viewDashboard: true,
                    viewProjects: false,
                    createProjects: false,
                    editProjects: false,
                    deleteProjects: false,
                    viewCompanies: false,
                    createCompanies: false,
                    editCompanies: false,
                    deleteCompanies: false,
                    viewUsers: false,
                    createUsers: false,
                    editUsers: false,
                    deleteUsers: false,
                    manageRoles: false,
                    viewReports: false,
                    exportReports: false,
                    viewSettings: false,
                    editSettings: false,
                    viewPlans: true
                },
                isDefault: true
            }
        ];

        let createdCount = 0;
        for (const roleData of defaultRoles) {
            const existing = await Role.findOne({ name: roleData.name });
            if (!existing) {
                await Role.create(roleData);
                createdCount++;
            }
        }

        res.json({ 
            success: true, 
            message: `${createdCount} default roles seeded successfully` 
        });
    } catch (error) {
        console.error('Seed roles error:', error);
        res.status(500).json({ message: error.message });
    }
};