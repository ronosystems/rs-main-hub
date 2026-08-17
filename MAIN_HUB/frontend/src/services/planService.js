// /home/kk/RS/MAIN HUB/frontend/src/services/planService.js

import axios from 'axios';

const API_URL = 'https://main-hub-api-ea52e89c5128.herokuapp.com/api';

const getToken = () => localStorage.getItem('token');

export const planService = {
  // Get all plans
  getPlans: async () => {
    try {
      const response = await axios.get(`${API_URL}/plans`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching plans:', error);
      throw error;
    }
  },

  // Get single plan
  getPlan: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/plans/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching plan:', error);
      throw error;
    }
  },

  // Create plan
  createPlan: async (planData) => {
    try {
      const response = await axios.post(`${API_URL}/plans`, planData, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating plan:', error);
      throw error;
    }
  },

  // Update plan
  updatePlan: async (id, planData) => {
    try {
      const response = await axios.put(`${API_URL}/plans/${id}`, planData, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating plan:', error);
      throw error;
    }
  },

  // Delete plan
  deletePlan: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/plans/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting plan:', error);
      throw error;
    }
  }
};

export default planService;
