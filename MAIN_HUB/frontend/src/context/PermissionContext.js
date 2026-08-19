// /home/kk/RS/MAIN HUB/frontend/src/context/PermissionContext.js

import React, { createContext, useState, useContext, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext';
import { ROLES, getRoleByKey, getRoleLevel } from '../config/roles';

const PermissionContext = createContext();

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

// ============================================
// PERMISSION PROVIDER
// ============================================

export const PermissionProvider = ({ children }) => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState({});
  const [loading, setLoading] = useState(false); // ✅ Changed to false
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const isMountedRef = useRef(true);

  // ✅ Get permissions based on system role from config
  const getPermissionsForRole = useCallback((role) => {
    // Normalize role name - this is the SYSTEM role
    const normalizedRole = role?.toLowerCase()?.replace(/\s+/g, '_') || 'guest';
    
    // Get role from config
    const roleConfig = getRoleByKey(normalizedRole);
    
    if (roleConfig) {
      return roleConfig.permissions;
    }
    
    // Fallback to guest permissions
    const guestRole = getRoleByKey('guest');
    return guestRole ? guestRole.permissions : {};
  }, []);

  // Load permissions from config
  const loadPermissions = useCallback(async () => {
    try {
      // ✅ No loading state - just load immediately
      setError(null);
      
      console.log('🔄 Loading permissions from config for user:', user?._id || user?.email);
      console.log('👤 User SYSTEM role:', user?.role);
      console.log('📋 User PROJECT role:', user?.projectRole);
      
      if (!user) {
        if (isMountedRef.current) {
          setPermissions({});
          setIsInitialized(true);
        }
        return;
      }

      // Get permissions for the user's SYSTEM role from config
      const rolePermissions = getPermissionsForRole(user?.role);
      
      console.log('📋 System permissions from config:', rolePermissions);
      
      if (isMountedRef.current) {
        setPermissions(rolePermissions);
        setIsInitialized(true);
      }

    } catch (error) {
      console.error('❌ Error loading permissions:', error);
      if (isMountedRef.current) {
        // Fallback to guest permissions
        const guestRole = getRoleByKey('guest');
        setPermissions(guestRole ? guestRole.permissions : {});
        setIsInitialized(true);
        setError(error.message);
      }
    }
  }, [user, getPermissionsForRole]);

  // Load permissions when user changes
  useEffect(() => {
    isMountedRef.current = true;
    
    if (user) {
      loadPermissions();
    } else {
      setPermissions({});
      setIsInitialized(true);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [user, loadPermissions]);

  // ✅ Check if user has a specific permission
  const hasPermission = useCallback((permissionKey) => {
    // Super admin has all permissions (check from config)
    const userRole = user?.role?.toLowerCase();
    const roleConfig = getRoleByKey(userRole);
    
    if (roleConfig && roleConfig.key === 'super_admin') {
      return true;
    }

    if (!permissions) {
      return false;
    }

    return permissions[permissionKey] === true;
  }, [permissions, user?.role]);

  // ✅ Check if user has any of the given permissions
  const hasAnyPermission = useCallback((permissionKeys) => {
    const userRole = user?.role?.toLowerCase();
    const roleConfig = getRoleByKey(userRole);
    
    if (roleConfig && roleConfig.key === 'super_admin') {
      return true;
    }

    if (!permissions || !permissionKeys || permissionKeys.length === 0) {
      return false;
    }

    return permissionKeys.some(key => permissions[key] === true);
  }, [permissions, user?.role]);

  // ✅ Check if user has all of the given permissions
  const hasAllPermissions = useCallback((permissionKeys) => {
    const userRole = user?.role?.toLowerCase();
    const roleConfig = getRoleByKey(userRole);
    
    if (roleConfig && roleConfig.key === 'super_admin') {
      return true;
    }

    if (!permissions || !permissionKeys || permissionKeys.length === 0) {
      return false;
    }

    return permissionKeys.every(key => permissions[key] === true);
  }, [permissions, user?.role]);

  // ✅ Get user's role level
  const getUserRoleLevel = useCallback(() => {
    const userRole = user?.role?.toLowerCase();
    return getRoleLevel(userRole);
  }, [user?.role]);

  // ✅ Check if user has role level or higher
  const hasRoleLevel = useCallback((requiredLevel) => {
    const userLevel = getUserRoleLevel();
    return userLevel >= requiredLevel;
  }, [getUserRoleLevel]);

  // ✅ Get user's role info
  const getUserRoleInfo = useCallback(() => {
    const userRole = user?.role?.toLowerCase();
    return getRoleByKey(userRole);
  }, [user?.role]);

  // Refresh permissions (reload from config)
  const refreshPermissions = useCallback(async () => {
    console.log('🔄 Refreshing permissions from config...');
    await loadPermissions();
  }, [loadPermissions]);

  // Memoize the context value
  const value = useMemo(() => ({
    permissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refreshPermissions,
    isInitialized,
    getUserRoleLevel,
    hasRoleLevel,
    getUserRoleInfo,
    // Helper to get role from config
    getRoleConfig: getRoleByKey,
    // Helper to get all roles
    getAllRoles: () => Object.values(ROLES)
  }), [permissions, loading, error, hasPermission, hasAnyPermission, hasAllPermissions, refreshPermissions, isInitialized, getUserRoleLevel, hasRoleLevel, getUserRoleInfo]);

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

// ============================================
// CUSTOM HOOKS
// ============================================

// Custom hook for component-level permission checks
export const usePermissionCheck = (permissionKey) => {
  const { hasPermission, loading } = usePermissions();
  
  return useMemo(() => ({
    hasAccess: hasPermission(permissionKey),
    loading
  }), [hasPermission, permissionKey, loading]);
};

// Custom hook for multiple permission checks
export const usePermissionsCheck = (permissionKeys) => {
  const { hasAnyPermission, hasAllPermissions, loading } = usePermissions();
  
  return useMemo(() => ({
    hasAny: hasAnyPermission(permissionKeys),
    hasAll: hasAllPermissions(permissionKeys),
    loading
  }), [hasAnyPermission, hasAllPermissions, permissionKeys, loading]);
};

// Custom hook to get user role info
export const useUserRole = () => {
  const { getUserRoleInfo, getUserRoleLevel } = usePermissions();
  
  return useMemo(() => {
    const roleInfo = getUserRoleInfo();
    return {
      ...roleInfo,
      level: getUserRoleLevel(),
      isSuperAdmin: roleInfo?.key === 'super_admin',
      isAdmin: roleInfo?.key === 'admin',
      isManager: roleInfo?.key === 'manager',
      isStaff: roleInfo?.key === 'staff',
      isGuest: roleInfo?.key === 'guest'
    };
  }, [getUserRoleInfo, getUserRoleLevel]);
};

// Custom hook to check if user has required role level
export const useRequireRoleLevel = (requiredLevel) => {
  const { hasRoleLevel, loading } = usePermissions();
  
  return useMemo(() => ({
    hasAccess: hasRoleLevel(requiredLevel),
    loading
  }), [hasRoleLevel, requiredLevel, loading]);
};

// ✅ Custom hook to get permission summary for a role
export const usePermissionSummary = (roleKey) => {
  return useMemo(() => {
    const role = getRoleByKey(roleKey);
    if (!role) return null;
    
    const permissions = role.permissions;
    const total = Object.keys(permissions).length;
    const enabled = Object.values(permissions).filter(v => v === true).length;
    const disabled = total - enabled;
    
    return {
      total,
      enabled,
      disabled,
      permissions
    };
  }, [roleKey]);
};

export default PermissionContext;