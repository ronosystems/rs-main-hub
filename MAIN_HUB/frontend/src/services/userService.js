// /home/kk/RS/MAIN HUB/frontend/src/services/userService.js

import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('token');

// Helper to handle API errors
const handleApiError = (error) => {
  if (error.response) {
    // The request was made and the server responded with a status code
    // that falls out of the range of 2xx
    console.error('API Error Response:', error.response.data);
    console.error('Status:', error.response.status);
    return {
      success: false,
      status: error.response.status,
      message: error.response.data?.message || 'Server error',
      data: null
    };
  } else if (error.request) {
    // The request was made but no response was received
    console.error('API No Response:', error.request);
    return {
      success: false,
      message: 'No response from server',
      data: null
    };
  } else {
    // Something happened in setting up the request that triggered an Error
    console.error('API Request Error:', error.message);
    return {
      success: false,
      message: error.message || 'Request failed',
      data: null
    };
  }
};

export const userService = {
  // Get all users
  getUsers: async () => {
    try {
      const response = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get users by company ID
  getUsersByCompany: async (companyId) => {
    try {
      const response = await axios.get(`${API_URL}/users/company/${companyId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get users by project ID
  getUsersByProject: async (projectId) => {
    try {
      const response = await axios.get(`${API_URL}/users/project/${projectId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get single user
  getUser: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/users/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Create user
  createUser: async (userData) => {
    try {
      const response = await axios.post(`${API_URL}/users`, userData, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update user (includes password if provided)
  updateUser: async (id, userData) => {
    try {
      const response = await axios.put(`${API_URL}/users/${id}`, userData, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Delete user
  deleteUser: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/users/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update user status
  updateStatus: async (id, isActive) => {
    try {
      const response = await axios.patch(`${API_URL}/users/${id}/status`, { isActive }, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update user role
  updateRole: async (id, role) => {
    try {
      const response = await axios.patch(`${API_URL}/users/${id}/role`, { role }, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update user profile
  updateProfile: async (id, profileData) => {
    try {
      const response = await axios.patch(`${API_URL}/users/${id}/profile`, profileData, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get current user's profile
  getProfile: async () => {
    try {
      const response = await axios.get(`${API_URL}/users/profile`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Get user statistics
  getStats: async () => {
    try {
      const response = await axios.get(`${API_URL}/users/stats`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Bulk create users
  bulkCreateUsers: async (usersData) => {
    try {
      const response = await axios.post(`${API_URL}/users/bulk`, usersData, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Safe version of getUsers that returns empty data on error
  getUsersSafe: async () => {
    try {
      const response = await axios.get(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    } catch (error) {
      // Use the handleApiError helper
      const errorResult = handleApiError(error);
      console.warn('⚠️ Safe getUsers failed:', errorResult.message);
      return { 
        success: false, 
        data: [], 
        message: errorResult.message || 'Failed to load users' 
      };
    }
  },

  // Safe version of getUsersByCompany
  getUsersByCompanySafe: async (companyId) => {
    try {
      const response = await axios.get(`${API_URL}/users/company/${companyId}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    } catch (error) {
      const errorResult = handleApiError(error);
      console.warn('⚠️ Safe getUsersByCompany failed:', errorResult.message);
      return { 
        success: false, 
        data: [], 
        message: errorResult.message || 'Failed to load company users' 
      };
    }
  }
};

// Export helpers
export const userHelpers = {
  // Check if user has access
  canUserAccess: (user, requiredRole) => {
    if (!user) return false;
    if (user.role === 'super_admin' || user.role === 'Super Admin') return true;
    return user.role === requiredRole;
  },

  // Filter users by company
  filterUsersByCompany: (users, companyId) => {
    if (!users || !Array.isArray(users)) return [];
    return users.filter(user => {
      const userCompanyId = user.company?._id || user.company;
      return userCompanyId === companyId;
    });
  },

  // Filter users by role
  filterUsersByRole: (users, role) => {
    if (!users || !Array.isArray(users)) return [];
    return users.filter(user => user.role === role);
  },

  // Get user full name
  getUserFullName: (user) => {
    if (!user) return 'Unknown User';
    return user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown';
  },

  // Get user initials
  getUserInitials: (user) => {
    const name = userHelpers.getUserFullName(user);
    if (!name) return 'U';
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  },

  // Format user role for display
  formatUserRole: (role) => {
    if (!role) return 'User';
    return role
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  },

  // Check if user is active
  isUserActive: (user) => {
    return user?.isActive !== false;
  },

  // Get user status label
  getUserStatusLabel: (user) => {
    return userHelpers.isUserActive(user) ? 'Active' : 'Inactive';
  },

  // Get user status color
  getUserStatusColor: (user) => {
    return userHelpers.isUserActive(user) ? '#48bb78' : '#fc8181';
  }
};

// Also export individual helpers for backward compatibility
export const canUserAccess = userHelpers.canUserAccess;
export const filterUsersByCompany = userHelpers.filterUsersByCompany;
export const filterUsersByRole = userHelpers.filterUsersByRole;
export const getUserFullName = userHelpers.getUserFullName;
export const getUserInitials = userHelpers.getUserInitials;
export const formatUserRole = userHelpers.formatUserRole;
export const isUserActive = userHelpers.isUserActive;
export const getUserStatusLabel = userHelpers.getUserStatusLabel;
export const getUserStatusColor = userHelpers.getUserStatusColor;

export default userService;