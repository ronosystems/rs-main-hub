// /home/kk/RS/TRONIC_MASTER/frontend/src/services/branchService.js

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

export const branchService = {
  // Get branches for current user (based on role)
  getUserBranches: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/branches/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user branches:', error);
      throw error;
    }
  },

  // Get all branches (Admin only)
  getAllBranches: async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/branches`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching branches:', error);
      throw error;
    }
  },

  // Get branch by ID
  getBranchById: async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/branches/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching branch:', error);
      throw error;
    }
  }
};