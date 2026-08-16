// /home/kk/RS/TRONIC_MASTER/frontend/src/components/PrivateRoute.js

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
    const { isAuthenticated, loading, isLoginAs } = useAuth();
    
    console.log('🔒 PrivateRoute - Loading:', loading);
    console.log('🔒 PrivateRoute - isAuthenticated:', isAuthenticated);
    console.log('🔒 PrivateRoute - isLoginAs:', isLoginAs);
    
    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                fontSize: '18px',
                color: '#6c757d'
            }}>
                Loading TRONIC_MASTER...
            </div>
        );
    }
    
    // ============================================
    // ✅ SUPPORT MODE - Allow access without validation
    // ============================================
    if (isLoginAs) {
        console.log('🔐 Support mode active - allowing full access');
        return children;
    }
    
    // Check if authenticated
    if (!isAuthenticated) {
        console.log('❌ Not authenticated, redirecting to login');
        return <Navigate to="/login" replace />;
    }
    
    console.log('✅ Authenticated, allowing access');
    return children;
};

export default PrivateRoute;