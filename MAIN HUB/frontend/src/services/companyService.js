// /home/kk/RS/MAIN HUB/frontend/src/services/companyService.js

import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('token');

export const companyService = {
  // Get all companies with pagination and filters
  getCompanies: async (params = {}) => {
    try {
      const response = await axios.get(`${API_URL}/companies`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        params: params
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
  },

  // Get single company
  getCompany: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/companies/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching company:', error);
      throw error;
    }
  },

  
getCompaniesSafe: async () => {
  try {
    const response = await axios.get(`${API_URL}/companies`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  } catch (error) {
    console.warn('⚠️ Safe getCompanies failed:', error.message);
    return { 
      success: false, 
      data: [], 
      message: error.response?.data?.message || 'Failed to load companies' 
    };
  }
},

  // Create company
  createCompany: async (companyData) => {
    try {
      const response = await axios.post(`${API_URL}/companies`, companyData, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating company:', error);
      throw error;
    }
  },

  // Update company
  updateCompany: async (id, companyData) => {
    try {
      const response = await axios.put(`${API_URL}/companies/${id}`, companyData, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating company:', error);
      throw error;
    }
  },

  // Delete company
  deleteCompany: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/companies/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting company:', error);
      throw error;
    }
  },

  // ✅ ADD THIS - Get company statuses
  getStatuses: async () => {
    try {
      const response = await axios.get(`${API_URL}/companies/statuses`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching statuses:', error);
      throw error;
    }
  },

  // ✅ ADD THIS - Get expiring companies
  getExpiringCompanies: async (days = 7) => {
    try {
      const response = await axios.get(`${API_URL}/companies/expiring`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        params: { days }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching expiring companies:', error);
      throw error;
    }
  },

  // ✅ ADD THIS - Renew subscription
  renewSubscription: async (id, renewalPeriod = 'yearly') => {
    try {
      const response = await axios.post(`${API_URL}/companies/${id}/renew`, 
        { renewalPeriod },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Error renewing subscription:', error);
      throw error;
    }
  },

  // ✅ ADD THIS - Update subscription
  updateSubscription: async (id, data) => {
    try {
      const response = await axios.put(`${API_URL}/companies/${id}/subscription`, data, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }
};

export default companyService;