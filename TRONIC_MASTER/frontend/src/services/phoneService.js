// /home/kk/RS/TRONIC_MASTER/frontend/src/services/phoneService.js

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

export const phoneService = {
  // Get phones for current user (role-based)
  getUserPhones: async (branchId = null) => {
    try {
      const token = localStorage.getItem('token');
      let url = `${API_URL}/phones/user`;
      
      // Add branch filter if provided
      if (branchId) {
        url += `?branch=${branchId}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user phones:', error);
      throw error;
    }
  },

  // Get phones by branch (for managers)
  getPhonesByBranch: async (branchId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/phones/branch/${branchId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching branch phones:', error);
      throw error;
    }
  },

  // Get assigned phones for agent
  getAssignedPhones: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/phones/assigned`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching assigned phones:', error);
      throw error;
    }
  },

  // Search phones
  searchPhones: async (query) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/phones/search?q=${query}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error searching phones:', error);
      throw error;
    }
  }
};