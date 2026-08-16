// /home/kk/RS/MAIN HUB/backend/src/config/roles.js

// ============================================
// HARDCODED ROLES CONFIGURATION
// No database needed - roles are defined here
// ============================================

const ROLES = {
  // ============================================
  // SUPER ADMIN - Full System Access
  // ============================================
  SUPER_ADMIN: {
    name: 'Super Admin',
    key: 'super_admin',
    description: 'Full system access with all permissions',
    level: 5,
    permissions: {
      // Dashboard
      viewDashboard: true,
      
      // Projects
      viewProjects: true,
      createProjects: true,
      editProjects: true,
      deleteProjects: true,
      
      // Companies
      viewCompanies: true,
      createCompanies: true,
      editCompanies: true,
      deleteCompanies: true,
      
      // Users
      viewUsers: true,
      createUsers: true,
      editUsers: true,
      deleteUsers: true,
      
      // Roles
      viewRoles: true,
      createRoles: true,
      editRoles: true,
      deleteRoles: true,
      
      // Plans
      viewPlans: true,
      createPlans: true,
      editPlans: true,
      deletePlans: true,
      
      // Reports
      viewReports: true,
      exportReports: true,
      
      // Settings
      viewSettings: true,
      editSettings: true,
      
      // Project Users
      manageProjectUsers: true,
      viewProjectAnalytics: true,
      exportProjectData: true
    },
    isDefault: false,
    color: '#dc3545',
    icon: 'fa-crown'
  },

  // ============================================
  // ADMIN - Manage Companies and Users
  // ============================================
  ADMIN: {
    name: 'Admin',
    key: 'admin',
    description: 'Manage companies, users, and view reports',
    level: 4,
    permissions: {
      // Dashboard
      viewDashboard: true,
      
      // Projects
      viewProjects: true,
      createProjects: false,
      editProjects: false,
      deleteProjects: false,
      
      // Companies
      viewCompanies: true,
      createCompanies: true,
      editCompanies: true,
      deleteCompanies: false,
      
      // Users
      viewUsers: true,
      createUsers: true,
      editUsers: true,
      deleteUsers: false,
      
      // Roles
      viewRoles: false,
      createRoles: false,
      editRoles: false,
      deleteRoles: false,
      
      // Plans
      viewPlans: true,
      createPlans: false,
      editPlans: false,
      deletePlans: false,
      
      // Reports
      viewReports: true,
      exportReports: false,
      
      // Settings
      viewSettings: false,
      editSettings: false,
      
      // Project Users
      manageProjectUsers: true,
      viewProjectAnalytics: true,
      exportProjectData: false
    },
    isDefault: false,
    color: '#00d4ff',
    icon: 'fa-user-shield'
  },

  // ============================================
  // MANAGER - Manage Operations
  // ============================================
  MANAGER: {
    name: 'Manager',
    key: 'manager',
    description: 'Manage operations and view reports',
    level: 3,
    permissions: {
      // Dashboard
      viewDashboard: true,
      
      // Projects
      viewProjects: true,
      createProjects: false,
      editProjects: false,
      deleteProjects: false,
      
      // Companies
      viewCompanies: true,
      createCompanies: false,
      editCompanies: false,
      deleteCompanies: false,
      
      // Users
      viewUsers: false,
      createUsers: false,
      editUsers: false,
      deleteUsers: false,
      
      // Roles
      viewRoles: false,
      createRoles: false,
      editRoles: false,
      deleteRoles: false,
      
      // Plans
      viewPlans: false,
      createPlans: false,
      editPlans: false,
      deletePlans: false,
      
      // Reports
      viewReports: true,
      exportReports: false,
      
      // Settings
      viewSettings: false,
      editSettings: false,
      
      // Project Users
      manageProjectUsers: false,
      viewProjectAnalytics: true,
      exportProjectData: false
    },
    isDefault: false,
    color: '#f39c12',
    icon: 'fa-user-tie'
  },

  // ============================================
  // STAFF - Basic Operations
  // ============================================
  STAFF: {
    name: 'Staff',
    key: 'staff',
    description: 'Basic operations and project access',
    level: 2,
    permissions: {
      // Dashboard
      viewDashboard: true,
      
      // Projects
      viewProjects: true,
      createProjects: false,
      editProjects: false,
      deleteProjects: false,
      
      // Companies
      viewCompanies: false,
      createCompanies: false,
      editCompanies: false,
      deleteCompanies: false,
      
      // Users
      viewUsers: false,
      createUsers: false,
      editUsers: false,
      deleteUsers: false,
      
      // Roles
      viewRoles: false,
      createRoles: false,
      editRoles: false,
      deleteRoles: false,
      
      // Plans
      viewPlans: false,
      createPlans: false,
      editPlans: false,
      deletePlans: false,
      
      // Reports
      viewReports: false,
      exportReports: false,
      
      // Settings
      viewSettings: false,
      editSettings: false,
      
      // Project Users
      manageProjectUsers: false,
      viewProjectAnalytics: false,
      exportProjectData: false
    },
    isDefault: false,
    color: '#3498db',
    icon: 'fa-user'
  },

  // ============================================
  // GUEST - View Only
  // ============================================
  GUEST: {
    name: 'Guest',
    key: 'guest',
    description: 'View only access to basic information',
    level: 1,
    permissions: {
      // Dashboard
      viewDashboard: true,
      
      // Projects
      viewProjects: false,
      createProjects: false,
      editProjects: false,
      deleteProjects: false,
      
      // Companies
      viewCompanies: false,
      createCompanies: false,
      editCompanies: false,
      deleteCompanies: false,
      
      // Users
      viewUsers: false,
      createUsers: false,
      editUsers: false,
      deleteUsers: false,
      
      // Roles
      viewRoles: false,
      createRoles: false,
      editRoles: false,
      deleteRoles: false,
      
      // Plans
      viewPlans: false,
      createPlans: false,
      editPlans: false,
      deletePlans: false,
      
      // Reports
      viewReports: false,
      exportReports: false,
      
      // Settings
      viewSettings: false,
      editSettings: false,
      
      // Project Users
      manageProjectUsers: false,
      viewProjectAnalytics: false,
      exportProjectData: false
    },
    isDefault: true,
    color: '#6c757d',
    icon: 'fa-user-circle'
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get all roles
const getAllRoles = () => {
  return Object.values(ROLES);
};

// Get role by key
const getRoleByKey = (key) => {
  return ROLES[key.toUpperCase()] || null;
};

// Get role by name
const getRoleByName = (name) => {
  return Object.values(ROLES).find(role => role.name === name) || null;
};

// Check if role exists
const roleExists = (key) => {
  return !!ROLES[key.toUpperCase()];
};

// Get permissions for a role
const getPermissions = (key) => {
  const role = getRoleByKey(key);
  return role ? role.permissions : null;
};

// Check if user has permission
const hasPermission = (roleKey, permissionKey) => {
  const permissions = getPermissions(roleKey);
  return permissions ? permissions[permissionKey] === true : false;
};

// Get default role
const getDefaultRole = () => {
  return Object.values(ROLES).find(role => role.isDefault === true) || ROLES.GUEST;
};

// Get role level
const getRoleLevel = (key) => {
  const role = getRoleByKey(key);
  return role ? role.level : 0;
};

// Check if role has higher or equal level
const hasRoleLevel = (userRole, requiredLevel) => {
  const level = getRoleLevel(userRole);
  return level >= requiredLevel;
};

// Get roles with hierarchy (from highest to lowest)
const getRoleHierarchy = () => {
  return Object.values(ROLES).sort((a, b) => b.level - a.level);
};

// Get roles by level
const getRolesByLevel = (minLevel, maxLevel) => {
  return Object.values(ROLES).filter(role => 
    role.level >= minLevel && role.level <= maxLevel
  );
};

// Format role for display
const formatRole = (key) => {
  const role = getRoleByKey(key);
  if (!role) return key;
  return {
    ...role,
    displayName: role.name,
    displayColor: role.color,
    displayIcon: role.icon
  };
};

// Get role permissions summary
const getPermissionsSummary = (key) => {
  const role = getRoleByKey(key);
  if (!role) return null;
  
  const permissions = role.permissions;
  const summary = {
    total: Object.keys(permissions).length,
    enabled: Object.values(permissions).filter(v => v === true).length,
    disabled: Object.values(permissions).filter(v => v === false).length
  };
  
  return summary;
};

// ============================================
// PERMISSION GROUPS FOR UI
// ============================================

const PERMISSION_GROUPS = {
  dashboard: {
    label: 'Dashboard',
    icon: 'fa-chart-pie',
    permissions: ['viewDashboard']
  },
  projects: {
    label: 'Projects',
    icon: 'fa-project-diagram',
    permissions: ['viewProjects', 'createProjects', 'editProjects', 'deleteProjects']
  },
  companies: {
    label: 'Companies',
    icon: 'fa-building',
    permissions: ['viewCompanies', 'createCompanies', 'editCompanies', 'deleteCompanies']
  },
  users: {
    label: 'Users',
    icon: 'fa-users',
    permissions: ['viewUsers', 'createUsers', 'editUsers', 'deleteUsers']
  },
  roles: {
    label: 'Roles',
    icon: 'fa-user-tag',
    permissions: ['viewRoles', 'createRoles', 'editRoles', 'deleteRoles']
  },
  plans: {
    label: 'Plans',
    icon: 'fa-file-invoice',
    permissions: ['viewPlans', 'createPlans', 'editPlans', 'deletePlans']
  },
  reports: {
    label: 'Reports',
    icon: 'fa-chart-bar',
    permissions: ['viewReports', 'exportReports']
  },
  settings: {
    label: 'Settings',
    icon: 'fa-cog',
    permissions: ['viewSettings', 'editSettings']
  },
  projectUsers: {
    label: 'Project Users',
    icon: 'fa-user-friends',
    permissions: ['manageProjectUsers', 'viewProjectAnalytics', 'exportProjectData']
  }
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
  ROLES,
  getAllRoles,
  getRoleByKey,
  getRoleByName,
  roleExists,
  getPermissions,
  hasPermission,
  getDefaultRole,
  getRoleLevel,
  hasRoleLevel,
  getRoleHierarchy,
  getRolesByLevel,
  formatRole,
  getPermissionsSummary,
  PERMISSION_GROUPS
};