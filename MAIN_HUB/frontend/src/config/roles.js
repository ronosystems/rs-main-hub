// /home/kk/RS/MAIN HUB/frontend/src/config/roles.js

// ============================================
// HARDCODED ROLES CONFIGURATION
// Mirror of backend/src/config/roles.js
// ============================================

export const ROLES = {
  // ============================================
  // SUPER ADMIN - Full System Access
  // ============================================
  super_admin: {
    name: 'Super Admin',
    key: 'super_admin',
    description: 'Full system access with all permissions',
    level: 5,
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
      viewRoles: true,
      createRoles: true,
      editRoles: true,
      deleteRoles: true,
      viewPlans: true,
      createPlans: true,
      editPlans: true,
      deletePlans: true,
      viewReports: true,
      exportReports: true,
      viewSettings: true,
      editSettings: true,
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
  admin: {
    name: 'Admin',
    key: 'admin',
    description: 'Manage companies, users, and view reports',
    level: 4,
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
      viewRoles: false,
      createRoles: false,
      editRoles: false,
      deleteRoles: false,
      viewPlans: true,
      createPlans: false,
      editPlans: false,
      deletePlans: false,
      viewReports: true,
      exportReports: false,
      viewSettings: false,
      editSettings: false,
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
  manager: {
    name: 'Manager',
    key: 'manager',
    description: 'Manage operations and view reports',
    level: 3,
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
      viewUsers: false,
      createUsers: false,
      editUsers: false,
      deleteUsers: false,
      viewRoles: false,
      createRoles: false,
      editRoles: false,
      deleteRoles: false,
      viewPlans: false,
      createPlans: false,
      editPlans: false,
      deletePlans: false,
      viewReports: true,
      exportReports: false,
      viewSettings: false,
      editSettings: false,
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
  staff: {
    name: 'Staff',
    key: 'staff',
    description: 'Basic operations and project access',
    level: 2,
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
      viewRoles: false,
      createRoles: false,
      editRoles: false,
      deleteRoles: false,
      viewPlans: false,
      createPlans: false,
      editPlans: false,
      deletePlans: false,
      viewReports: false,
      exportReports: false,
      viewSettings: false,
      editSettings: false,
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
  guest: {
    name: 'Guest',
    key: 'guest',
    description: 'View only access to basic information',
    level: 1,
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
      viewRoles: false,
      createRoles: false,
      editRoles: false,
      deleteRoles: false,
      viewPlans: false,
      createPlans: false,
      editPlans: false,
      deletePlans: false,
      viewReports: false,
      exportReports: false,
      viewSettings: false,
      editSettings: false,
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

export const getAllRoles = () => {
  return Object.values(ROLES);
};

export const getRoleByKey = (key) => {
  if (!key) return null;
  const roleKey = key.toLowerCase();
  return ROLES[roleKey] || null;
};

export const getPermissions = (key) => {
  const role = getRoleByKey(key);
  return role ? role.permissions : null;
};

export const hasPermission = (roleKey, permissionKey) => {
  const permissions = getPermissions(roleKey);
  return permissions ? permissions[permissionKey] === true : false;
};

export const getDefaultRole = () => {
  return Object.values(ROLES).find(role => role.isDefault === true) || ROLES.guest;
};

export const getRoleLevel = (key) => {
  const role = getRoleByKey(key);
  return role ? role.level : 0;
};

export const getRoleHierarchy = () => {
  return Object.values(ROLES).sort((a, b) => b.level - a.level);
};

export const formatRole = (key) => {
  const role = getRoleByKey(key);
  if (!role) {
    return {
      displayName: key || 'Unknown',
      displayColor: '#6c757d',
      displayIcon: 'fa-user',
      level: 0
    };
  }
  return {
    ...role,
    displayName: role.name,
    displayColor: role.color,
    displayIcon: role.icon
  };
};

export const PERMISSION_GROUPS = {
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