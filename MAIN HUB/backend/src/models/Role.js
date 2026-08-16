// /home/kk/RS/MAIN HUB/backend/src/models/Role.js

const mongoose = require('mongoose');
const { ROLES, getRoleByKey, getAllRoles, getPermissions, hasPermission } = require('../config/roles');

// ============================================
// ROLE SCHEMA
// ============================================

const RoleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    code: {
        type: String,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    permissions: {
        // Dashboard
        viewDashboard: { type: Boolean, default: true },
        
        // Projects
        viewProjects: { type: Boolean, default: false },
        createProjects: { type: Boolean, default: false },
        editProjects: { type: Boolean, default: false },
        deleteProjects: { type: Boolean, default: false },
        
        // Companies
        viewCompanies: { type: Boolean, default: false },
        createCompanies: { type: Boolean, default: false },
        editCompanies: { type: Boolean, default: false },
        deleteCompanies: { type: Boolean, default: false },
        
        // Users
        viewUsers: { type: Boolean, default: false },
        createUsers: { type: Boolean, default: false },
        editUsers: { type: Boolean, default: false },
        deleteUsers: { type: Boolean, default: false },
        manageRoles: { type: Boolean, default: false },
        
        // Reports
        viewReports: { type: Boolean, default: false },
        exportReports: { type: Boolean, default: false },
        
        // Settings
        viewSettings: { type: Boolean, default: false },
        editSettings: { type: Boolean, default: false },
        
        // Plans
        viewPlans: { type: Boolean, default: false },
        createPlans: { type: Boolean, default: false },
        editPlans: { type: Boolean, default: false },
        deletePlans: { type: Boolean, default: false },
        
        // Project Users
        manageProjectUsers: { type: Boolean, default: false },
        viewProjectAnalytics: { type: Boolean, default: false },
        exportProjectData: { type: Boolean, default: false }
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: true
    },
    level: {
        type: Number,
        default: 1
    },
    color: {
        type: String,
        default: '#6c757d'
    },
    icon: {
        type: String,
        default: 'fa-user'
    }
}, { timestamps: true });

// ============================================
// PRE-SAVE HOOK
// ============================================

RoleSchema.pre('save', async function(next) {
    if (this.isNew && !this.code) {
        const count = await mongoose.model('Role').countDocuments();
        this.code = `RL-${String(count + 1).padStart(3, '0')}`;
    }
    next();
});

// ============================================
// STATIC METHODS
// ============================================

// Get roles from config
RoleSchema.statics.getRolesFromConfig = function() {
    return getAllRoles();
};

// Get role from config by key
RoleSchema.statics.getRoleFromConfig = function(key) {
    return getRoleByKey(key);
};

// Get permissions from config
RoleSchema.statics.getPermissionsFromConfig = function(key) {
    return getPermissions(key);
};

// Check permission from config
RoleSchema.statics.hasPermissionFromConfig = function(roleKey, permissionKey) {
    return hasPermission(roleKey, permissionKey);
};

// Seed roles from config
RoleSchema.statics.seedFromConfig = async function() {
    const roles = getAllRoles();
    const results = [];
    
    for (const role of roles) {
        const existing = await this.findOne({ name: role.name });
        if (!existing) {
            const newRole = new this({
                name: role.name,
                code: role.key,
                description: role.description,
                permissions: role.permissions,
                isDefault: role.isDefault || false,
                level: role.level || 1,
                color: role.color || '#6c757d',
                icon: role.icon || 'fa-user',
                isActive: true
            });
            await newRole.save();
            results.push(newRole);
        } else {
            // Update existing role
            existing.code = role.key;
            existing.description = role.description;
            existing.permissions = role.permissions;
            existing.isDefault = role.isDefault || false;
            existing.level = role.level || 1;
            existing.color = role.color || '#6c757d';
            existing.icon = role.icon || 'fa-user';
            existing.isActive = true;
            await existing.save();
            results.push(existing);
        }
    }
    
    return results;
};

// Get all roles with hierarchy
RoleSchema.statics.getAllWithHierarchy = function() {
    return this.find({ isActive: true })
        .sort({ level: -1 })
        .select('-__v');
};

// Get default role
RoleSchema.statics.getDefault = function() {
    return this.findOne({ isDefault: true, isActive: true });
};

// Get roles by level
RoleSchema.statics.getByLevel = function(minLevel, maxLevel) {
    return this.find({
        level: { $gte: minLevel, $lte: maxLevel },
        isActive: true
    }).sort({ level: -1 });
};

// Get higher level roles
RoleSchema.statics.getHigherLevels = function(level) {
    return this.find({
        level: { $gt: level },
        isActive: true
    }).sort({ level: -1 });
};

// Get lower level roles
RoleSchema.statics.getLowerLevels = function(level) {
    return this.find({
        level: { $lt: level },
        isActive: true
    }).sort({ level: -1 });
};

// ============================================
// INSTANCE METHODS
// ============================================

// Get permissions from config
RoleSchema.methods.getConfigPermissions = function() {
    const role = getRoleByKey(this.code || this.name.toLowerCase());
    return role ? role.permissions : this.permissions;
};

// Check if role has a specific permission
RoleSchema.methods.hasPermission = function(permissionKey) {
    // First check from config
    const configPermissions = this.getConfigPermissions();
    if (configPermissions) {
        return configPermissions[permissionKey] === true;
    }
    // Fallback to stored permissions
    return this.permissions[permissionKey] === true;
};

// Check if role has any of the given permissions
RoleSchema.methods.hasAnyPermission = function(permissionKeys) {
    return permissionKeys.some(key => this.hasPermission(key));
};

// Check if role has all of the given permissions
RoleSchema.methods.hasAllPermissions = function(permissionKeys) {
    return permissionKeys.every(key => this.hasPermission(key));
};

// Get permission summary
RoleSchema.methods.getPermissionSummary = function() {
    const permissions = this.getConfigPermissions() || this.permissions;
    const total = Object.keys(permissions).length;
    const enabled = Object.values(permissions).filter(v => v === true).length;
    const disabled = total - enabled;
    
    return { total, enabled, disabled };
};

// Check if role is higher than another role
RoleSchema.methods.isHigherThan = function(roleLevel) {
    return this.level > roleLevel;
};

// Check if role is lower than another role
RoleSchema.methods.isLowerThan = function(roleLevel) {
    return this.level < roleLevel;
};

// Check if role is equal to another role
RoleSchema.methods.isEqual = function(roleLevel) {
    return this.level === roleLevel;
};

// Get role display info
RoleSchema.methods.getDisplayInfo = function() {
    return {
        name: this.name,
        code: this.code,
        description: this.description,
        color: this.color || '#6c757d',
        icon: this.icon || 'fa-user',
        level: this.level,
        isDefault: this.isDefault,
        isActive: this.isActive
    };
};

// ============================================
// VIRTUAL PROPERTIES
// ============================================

// Get role level name
RoleSchema.virtual('levelName').get(function() {
    const levels = {
        5: 'Highest',
        4: 'High',
        3: 'Medium',
        2: 'Low',
        1: 'Lowest'
    };
    return levels[this.level] || 'Unknown';
});

// Get formatted role name
RoleSchema.virtual('formattedName').get(function() {
    return this.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
});

// Get permission count
RoleSchema.virtual('permissionCount').get(function() {
    const perms = this.getConfigPermissions() || this.permissions;
    return Object.values(perms).filter(v => v === true).length;
});

// Ensure virtuals are included in JSON
RoleSchema.set('toJSON', { virtuals: true });
RoleSchema.set('toObject', { virtuals: true });

// ============================================
// EXPORT
// ============================================

module.exports = mongoose.model('Role', RoleSchema);