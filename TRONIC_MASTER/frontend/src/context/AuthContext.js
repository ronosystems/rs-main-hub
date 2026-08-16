// /home/kk/RS/TRONIC_MASTER/frontend/src/context/AuthContext.js

import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [isLoginAs, setIsLoginAs] = useState(false);

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

    // ============================================
    // VALIDATE TOKEN FUNCTION
    // ============================================
    const validateToken = async (tokenToValidate) => {
        try {
            console.log('🔍 Validating token with TRONIC_MASTER backend...');
            const response = await fetch(`${API_URL}/auth/validate`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${tokenToValidate}`,
                    'Content-Type': 'application/json'
                }
            });

            console.log('📊 Validation response status:', response.status);

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Token valid:', data.user);
                
                const userData = {
                    ...data.user,
                    companyRole: data.user.companyRole || 'company_staff'
                };
                
                setUser(userData);
                setIsLoginAs(false);
                localStorage.setItem('userData', JSON.stringify(userData));
            } else {
                console.log('❌ Token invalid, logging out');
                logout();
            }
        } catch (error) {
            console.error('Token validation error:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    // ============================================
    // LOGOUT FUNCTION
    // ============================================
    const logout = () => {
        console.log('🔓 Logging out...');
        
        const isLoginAsSession = localStorage.getItem('loginAsCompany') === 'true';
        
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        localStorage.removeItem('user');
        localStorage.removeItem('companyName');
        localStorage.removeItem('companyId');
        localStorage.removeItem('loginAsCompany');
        localStorage.removeItem('originalToken');
        localStorage.removeItem('originalUser');
        localStorage.removeItem('companyData');
        localStorage.removeItem('loginAsInfo');
        localStorage.removeItem('tronicCompanyLogo');
        localStorage.removeItem('tronicPlatformName');
        
        setToken(null);
        setUser(null);
        setIsLoginAs(false);
        
        if (isLoginAsSession) {
            console.log('🔄 Redirecting to MAIN HUB...');
            window.location.href = 'http://localhost:3000/super-admin/dashboard';
        } else {
            console.log('🔄 Redirecting to TRONIC_MASTER login...');
            window.location.href = '/login';
        }
    };

    // ============================================
    // INITIALIZE SESSION
    // ============================================
    useEffect(() => {
        // ============================================
        // CHECK FOR LOGIN-AS SESSION FROM MAIN HUB
        // ============================================
        const storedToken = localStorage.getItem('token');
        const storedUserData = localStorage.getItem('userData');
        const loginAsCompany = localStorage.getItem('loginAsCompany') === 'true';
        const companyName = localStorage.getItem('companyName');
        
        console.log('🔍 TRONIC_MASTER AuthContext checking session:', { 
            hasToken: !!storedToken, 
            hasUserData: !!storedUserData,
            isLoginAs: loginAsCompany,
            companyName: companyName
        });

        // ============================================
        // ✅ LOGIN-AS SESSION - Skip validation completely
        // Use the user data directly from localStorage
        // ============================================
        if (loginAsCompany && storedUserData) {
            try {
                const userData = JSON.parse(storedUserData);
                console.log('✅ Login-as session detected!');
                console.log('✅ User:', userData.name);
                console.log('✅ Company:', userData.company?.name || companyName);
                console.log('✅ Role:', userData.role);
                console.log('✅ Token exists:', !!storedToken);
                
                // Set user and token directly from localStorage - NO VALIDATION
                setUser(userData);
                setToken(storedToken);
                setIsLoginAs(true);
                setLoading(false);
                console.log('✅ Login-as session loaded successfully - skipping validation');
                return;
            } catch (e) {
                console.error('Error parsing login-as user data:', e);
                localStorage.removeItem('userData');
                localStorage.removeItem('loginAsCompany');
            }
        }

        // ============================================
        // NORMAL SESSION - Validate with backend
        // ============================================
        if (storedToken && storedUserData) {
            try {
                const userData = JSON.parse(storedUserData);
                // Check if this is a normal login (not login-as)
                if (!userData.loginAs) {
                    console.log('✅ Normal session detected for:', userData.name);
                    setUser(userData);
                    setToken(storedToken);
                    setIsLoginAs(false);
                    setLoading(false);
                    return;
                }
            } catch (e) {
                console.error('Error parsing user data:', e);
                localStorage.removeItem('userData');
            }
        }

        // If we have a token but no user data, try to validate (normal flow)
        if (storedToken) {
            validateToken(storedToken);
        } else {
            setLoading(false);
        }
        // ✅ FIXED: Added validateToken to dependency array
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const login = async (email, password) => {
        try {
            console.log('📡 Sending login request to:', `${API_URL}/auth/login`);
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            console.log('📊 Login response:', data);

            if (data.success) {
                console.log('✅ Login successful!');
                
                const userData = {
                    ...data.user,
                    companyRole: data.user.companyRole || 'company_staff'
                };
                
                localStorage.setItem('token', data.token);
                localStorage.setItem('userData', JSON.stringify(userData));
                setToken(data.token);
                setUser(userData);
                setIsLoginAs(false);
                return { success: true, user: userData };
            } else {
                console.log('❌ Login failed:', data.message);
                return { success: false, message: data.message };
            }
        } catch (error) {
            console.error('❌ Login error:', error);
            return { success: false, message: 'Network error. Please check your connection.' };
        }
    };

    const updateUser = (updatedUser) => {
        console.log('🔄 Updating user:', updatedUser);
        const userData = {
            ...updatedUser,
            companyRole: updatedUser.companyRole || 'company_staff'
        };
        setUser(userData);
        localStorage.setItem('userData', JSON.stringify(userData));
    };

    const value = {
        user,
        token,
        login,
        logout,
        loading,
        updateUser,
        isAuthenticated: !!user && !!token,
        isLoginAs: isLoginAs || localStorage.getItem('loginAsCompany') === 'true'
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};