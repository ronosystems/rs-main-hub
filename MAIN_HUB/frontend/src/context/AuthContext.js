// /home/kk/RS/MAIN HUB/frontend/src/context/AuthContext.js

import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

const API_URL = 'https://main-hub-api-ea52e89c5128.herokuapp.com/api';

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // ✅ Start as true
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Set axios headers when token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [token]);

  // Load user when token is available
  useEffect(() => {
    const loadUser = async () => {
      if (!token) {
        console.log('🔐 No token found, user not authenticated');
        setLoading(false); // ✅ Set to false when no token
        return;
      }

      try {
        console.log('🔐 Loading user with token...');
        const response = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('🔐 Auth/me response:', response.data);
        
        const userData = response.data.user || response.data.data;
        console.log('👤 Loaded user data:', userData);
        console.log('👤 User role:', userData?.role);
        
        if (userData && !userData._id && userData.id) {
          userData._id = userData.id;
        }
        
        setUser(userData);
      } catch (error) {
        console.error('Error loading user:', error);
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false); // ✅ Set to false after loading completes
      }
    };

    loadUser();
  }, [token]);

  const login = async (email, password) => {
    try {
      console.log('🔑 Attempting login for:', email);
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      console.log('🔑 Login response:', response.data);
      
      const { token, user } = response.data;
      
      console.log('🔑 User data from login:', user);
      console.log('🔑 User role:', user?.role);
      
      localStorage.setItem('token', token);
      setToken(token);
      setUser(user);
      
      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const getDashboardPath = () => {
    if (!user) return '/login';
    
    const role = user.role?.toLowerCase();
    const paths = {
      'super_admin': '/super-admin',
      'admin': '/admin',
      'manager': '/manager',
      'staff': '/staff'
    };
    
    return paths[role] || '/login';
  };

  const value = {
    user,
    loading,
    token,
    login,
    logout,
    getDashboardPath,
    isAuthenticated: !!user && !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};