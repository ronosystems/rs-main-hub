// /home/kk/RS/TRONIC_MASTER/backend/src/models/User.js

const mongoose = require('mongoose');

// Company-specific roles for TRONIC_MASTER
const COMPANY_ROLES = {
  COMPANY_ADMIN: 'company_admin',
  COMPANY_MANAGER: 'company_manager',
  COMPANY_CASHIER: 'company_cashier',
  COMPANY_AGENT: 'company_agent',
  COMPANY_STAFF: 'company_staff'
};

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    
    // ========== MAIN HUB SYSTEM ROLE ==========
    role: { 
        type: String, 
        enum: ['super_admin', 'admin', 'manager', 'staff', 'guest'],
        default: 'guest'
    },
    
    // ========== COMPANY-SPECIFIC ROLE ==========
    companyRole: {
        type: String,
        enum: ['company_admin', 'company_manager', 'company_cashier', 'company_agent', 'company_staff'],
        default: 'company_staff'
    },
    
    // ========== COMPANY REFERENCE ==========
    company: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Company' 
    },
    
    // ========== BRANCH REFERENCE ==========
    branch: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        default: null,
        index: true
    },
    
    // ============================================================
    // ========== ASSIGNED BRANCHES (for Managers) ================
    // ============================================================
    // Company Managers can be assigned to multiple branches
    assignedBranches: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Branch',
        default: []
    }],
    
    // ============================================================
    // ========== ASSIGNED PHONES (for Agents) ====================
    // ============================================================
    // Company Agents can be assigned specific phones
    assignedPhones: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        default: []
    }],
    
    project: { type: String },
    projectRole: { 
        type: String, 
        enum: ['admin', 'manager', 'staff'],
        default: 'staff'
    },
    phone: { type: String, default: '' },
    department: { type: String, default: '' },
    profilePicture: { type: String, default: '' },
    avatar: { type: String },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date, default: null },
    settings: {
        theme: { type: String, default: 'light' },
        notifications: { type: Boolean, default: true },
        language: { type: String, default: 'en' }
    }
}, { timestamps: true });

// ============================================
// INDEXES
// ============================================
userSchema.index({ company: 1, isActive: 1 });
userSchema.index({ company: 1, branch: 1 });
userSchema.index({ company: 1, companyRole: 1 });
userSchema.index({ branch: 1, isActive: 1 });
userSchema.index({ assignedBranches: 1 }); // NEW
userSchema.index({ assignedPhones: 1 });   // NEW

// ============================================
// STATIC METHODS
// ============================================

// Get company roles
userSchema.statics.getCompanyRoles = function() {
    return [
        { value: 'company_admin', label: 'Admin', description: 'Full access to company management' },
        { value: 'company_manager', label: 'Manager', description: 'Manage products, sales, and staff' },
        { value: 'company_cashier', label: 'Cashier', description: 'Process sales and manage POS' },
        { value: 'company_agent', label: 'Agent', description: 'View products and process sales' },
        { value: 'company_staff', label: 'Staff', description: 'Basic access to company features' }
    ];
};

// Get users by company
userSchema.statics.getUsersByCompany = async function(companyId) {
    return await this.find({ 
        company: companyId, 
        isActive: true 
    })
    .select('-password')
    .populate('branch', 'name code city country currency currencySymbol')
    .sort({ name: 1 });
};

// Get users by branch
userSchema.statics.getUsersByBranch = async function(branchId) {
    return await this.find({ 
        branch: branchId, 
        isActive: true 
    })
    .select('-password')
    .populate('branch', 'name code city country currency currencySymbol')
    .sort({ name: 1 });
};

// Get available users for transfer (exclude current user)
userSchema.statics.getAvailableUsers = async function(companyId, currentUserId) {
    return await this.find({
        company: companyId,
        isActive: true,
        _id: { $ne: currentUserId }
    })
    .select('name email phone profilePicture companyRole role branch')
    .populate('branch', 'name code city')
    .sort({ name: 1 });
};

// Get users by role
userSchema.statics.getUsersByRole = async function(companyId, role) {
    return await this.find({
        company: companyId,
        isActive: true,
        companyRole: role
    })
    .select('-password')
    .populate('branch', 'name code city')
    .sort({ name: 1 });
};

// Search users
userSchema.statics.searchUsers = async function(companyId, searchTerm) {
    return await this.find({
        company: companyId,
        isActive: true,
        $or: [
            { name: { $regex: searchTerm, $options: 'i' } },
            { email: { $regex: searchTerm, $options: 'i' } },
            { phone: { $regex: searchTerm, $options: 'i' } }
        ]
    })
    .select('-password')
    .populate('branch', 'name code city')
    .sort({ name: 1 });
};

// Get users who can receive transfers
userSchema.statics.getUsersWhoCanReceiveTransfer = async function(companyId, currentUserId) {
    return await this.find({
        company: companyId,
        isActive: true,
        _id: { $ne: currentUserId },
        companyRole: { 
            $in: ['company_admin', 'company_manager', 'company_agent'] 
        }
    })
    .select('name email phone profilePicture companyRole branch')
    .populate('branch', 'name code city')
    .sort({ name: 1 });
};

// ============================================================
// NEW: Get managers for a branch
// ============================================================
userSchema.statics.getManagersForBranch = async function(branchId) {
    return await this.find({
        companyRole: 'company_manager',
        assignedBranches: branchId,
        isActive: true
    })
    .select('name email phone profilePicture')
    .sort({ name: 1 });
};

// ============================================================
// NEW: Get agents for a branch
// ============================================================
userSchema.statics.getAgentsForBranch = async function(branchId) {
    return await this.find({
        companyRole: 'company_agent',
        branch: branchId,
        isActive: true
    })
    .select('name email phone profilePicture assignedPhones')
    .sort({ name: 1 });
};

// ============================================
// INSTANCE METHODS
// ============================================

// Get role display name
userSchema.methods.getCompanyRoleDisplay = function() {
    const roleMap = {
        'company_admin': 'Admin',
        'company_manager': 'Manager',
        'company_cashier': 'Cashier',
        'company_agent': 'Agent',
        'company_staff': 'Staff'
    };
    return roleMap[this.companyRole] || this.companyRole || 'Staff';
};

// Get role badge class
userSchema.methods.getCompanyRoleBadge = function() {
    const badgeMap = {
        'company_admin': 'badge-company-admin',
        'company_manager': 'badge-company-manager',
        'company_cashier': 'badge-company-cashier',
        'company_agent': 'badge-company-agent',
        'company_staff': 'badge-company-staff'
    };
    return badgeMap[this.companyRole] || 'badge-company-staff';
};

// Get role icon
userSchema.methods.getCompanyRoleIcon = function() {
    const iconMap = {
        'company_admin': '👑',
        'company_manager': '👔',
        'company_cashier': '💳',
        'company_agent': '🤝',
        'company_staff': '👤'
    };
    return iconMap[this.companyRole] || '👤';
};

// Check if user can transfer
userSchema.methods.canTransfer = function() {
    const allowedRoles = ['company_admin', 'company_manager', 'company_agent'];
    return allowedRoles.includes(this.companyRole) || this.role === 'admin';
};

// Check if user can receive transfers
userSchema.methods.canReceiveTransfer = function() {
    const allowedRoles = ['company_admin', 'company_manager', 'company_agent', 'company_cashier'];
    return allowedRoles.includes(this.companyRole) && this.isActive === true;
};

// Check if user has branch access
userSchema.methods.hasBranchAccess = function(branchId) {
    if (this.companyRole === 'company_admin' || this.role === 'super_admin') {
        return true;
    }
    if (this.companyRole === 'company_manager') {
        return this.assignedBranches?.some(id => id.toString() === branchId.toString());
    }
    if (this.branch) {
        return this.branch.toString() === branchId.toString();
    }
    return false;
};

// Check if user has access to a phone
userSchema.methods.hasPhoneAccess = function(phoneId) {
    if (this.companyRole === 'company_admin' || this.role === 'super_admin') {
        return true;
    }
    if (this.companyRole === 'company_manager') {
        // Manager has access to phones in their assigned branches
        return true; // Handled by branch filtering
    }
    if (this.companyRole === 'company_agent') {
        return this.assignedPhones?.some(id => id.toString() === phoneId.toString());
    }
    return false;
};

// Get user's branch name
userSchema.methods.getBranchName = async function() {
    if (!this.branch) return 'Not Assigned';
    const branch = await mongoose.model('Branch').findById(this.branch);
    return branch ? branch.name : 'Not Assigned';
};

// Get user's assigned branch names
userSchema.methods.getAssignedBranchNames = async function() {
    if (!this.assignedBranches?.length) return [];
    const branches = await mongoose.model('Branch').find({
        _id: { $in: this.assignedBranches }
    });
    return branches.map(b => b.name);
};

// Get user's full display info
userSchema.methods.getDisplayInfo = function() {
    return {
        id: this._id,
        name: this.name,
        email: this.email,
        phone: this.phone,
        role: this.getCompanyRoleDisplay(),
        roleIcon: this.getCompanyRoleIcon(),
        branch: this.branch,
        assignedBranches: this.assignedBranches,
        assignedPhones: this.assignedPhones,
        isActive: this.isActive,
        profilePicture: this.profilePicture
    };
};

// Get user's permissions
userSchema.methods.getPermissions = function() {
    const permissions = {
        canTransfer: this.canTransfer(),
        canReceiveTransfer: this.canReceiveTransfer(),
        isAdmin: this.companyRole === 'company_admin' || this.role === 'admin' || this.role === 'super_admin',
        isManager: this.companyRole === 'company_manager' || this.role === 'manager',
        isCashier: this.companyRole === 'company_cashier',
        isAgent: this.companyRole === 'company_agent',
        isStaff: this.companyRole === 'company_staff',
        hasAssignedBranches: this.assignedBranches?.length > 0,
        hasAssignedPhones: this.assignedPhones?.length > 0
    };
    return permissions;
};

module.exports = mongoose.model('User', userSchema);