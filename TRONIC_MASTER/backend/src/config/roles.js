// /home/kk/RS/TRONIC_MASTER/frontend/src/config/roles.js

export const ROLE_PERMISSIONS = {
  // 👑 Full Access - Has Dashboard
  company_admin: {
    label: 'Company Admin',
    level: 5,
    menu: [
      { path: '/', label: 'Dashboard', icon: 'Dashboard' },
      { path: '/pos', label: 'POS', icon: 'POS' },
      { path: '/branches', label: 'Branches', icon: 'Branches' },
      { path: '/products', label: 'Products', icon: 'Products' },
      { path: '/phones', label: 'Phones', icon: 'Phones' },
      { path: '/sales', label: 'Sales', icon: 'Sales' },
      { path: '/users', label: 'Users', icon: 'Users' },
      { path: '/profile', label: 'Profile', icon: 'Profile' },
      { path: '/settings', label: 'Settings', icon: 'Settings' },
    ]
  },

  // 👔 Manager - Has Dashboard (needs analytics)
  company_manager: {
    label: 'Company Manager',
    level: 4,
    menu: [
      { path: '/', label: 'Dashboard', icon: 'Dashboard' },
      { path: '/pos', label: 'POS', icon: 'POS' },
      { path: '/products', label: 'Products', icon: 'Products' },
      { path: '/phones', label: 'Phones', icon: 'Phones' },
      { path: '/sales', label: 'Sales', icon: 'Sales' },
      { path: '/users', label: 'Users', icon: 'Users' },
      { path: '/profile', label: 'Profile', icon: 'Profile' },
    ]
  },

  // 💳 Cashier - NO Dashboard (only POS)
  company_cashier: {
    label: 'Company Cashier',
    level: 3,
    menu: [
      { path: '/pos', label: 'POS', icon: 'POS' },
      { path: '/sales', label: 'Sales', icon: 'Sales' },
      { path: '/profile', label: 'Profile', icon: 'Profile' },
    ]
  },

  // 🤝 Agent - NO Dashboard (only Phones)
  company_agent: {
    label: 'Company Agent',
    level: 2,
    menu: [
      { path: '/phones', label: 'Phones', icon: 'Phones' },
      { path: '/profile', label: 'Profile', icon: 'Profile' },
    ]
  },

  // 👤 Staff - NO Dashboard (only Profile)
  company_staff: {
    label: 'Company Staff',
    level: 1,
    menu: [
      { path: '/profile', label: 'Profile', icon: 'Profile' },
    ]
  }
};

// Helper: Get menu items for a role
export const getMenuForRole = (role) => {
  return ROLE_PERMISSIONS[role]?.menu || ROLE_PERMISSIONS.company_staff.menu;
};

// Helper: Check if user can access a path
export const canAccessPath = (role, path) => {
  const menu = getMenuForRole(role);
  return menu.some(item => item.path === path);
};

// Helper: Check if user has a specific permission level
export const hasMinLevel = (role, minLevel) => {
  return (ROLE_PERMISSIONS[role]?.level || 0) >= minLevel;
};