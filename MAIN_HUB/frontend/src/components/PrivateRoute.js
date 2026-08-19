// /home/kk/RS/MAIN HUB/frontend/src/components/PrivateRoute.js

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated, getDashboardPath } = useAuth();

  console.log('🔒 PrivateRoute - Loading:', loading);
  console.log('🔒 PrivateRoute - isAuthenticated:', isAuthenticated);
  console.log('🔒 PrivateRoute - User:', user);
  console.log('🔒 PrivateRoute - User role:', user?.role);
  console.log('🔒 PrivateRoute - Allowed roles:', allowedRoles);

  // ✅ NO SPINNER - Just return null while loading
  if (loading) {
    return null;
  }

  if (!isAuthenticated) {
    console.log('🔒 PrivateRoute - Not authenticated, redirecting to /login');
    return <Navigate to="/login" />;
  }

  // ============================================
  // ✅ SUPER ADMIN AND ADMIN HAVE FULL ACCESS
  // ============================================
  const userRole = user?.role?.toLowerCase();
  const isSuperAdmin = userRole === 'super_admin';
  const isAdmin = userRole === 'admin';
  
  // Super Admin and Admin can access ANY route
  if (isSuperAdmin || isAdmin) {
    console.log(`✅ ${userRole} has full access - allowing`);
    return children;
  }

  // ============================================
  // CHECK FOR SPECIFIC ROLES
  // ============================================
  if (allowedRoles && allowedRoles.length > 0) {
    // Check if user has one of the allowed roles
    const hasAllowedRole = allowedRoles.some(role => {
      const allowedRoleLower = role.toLowerCase();
      // Check main role
      if (allowedRoleLower === userRole) return true;
      // Check companyRole for company users
      if (user?.companyRole && allowedRoleLower === user.companyRole.toLowerCase()) return true;
      return false;
    });
    
    console.log('🔒 PrivateRoute - User role:', userRole);
    console.log('🔒 PrivateRoute - User companyRole:', user?.companyRole);
    console.log('🔒 PrivateRoute - Has allowed role:', hasAllowedRole);
    
    if (!hasAllowedRole) {
      const dashboardPath = getDashboardPath();
      console.log('🔒 PrivateRoute - Role not allowed, redirecting to:', dashboardPath);
      return <Navigate to={dashboardPath} />;
    }
  }

  console.log('🔒 PrivateRoute - Access granted');
  return children;
};

export default PrivateRoute;