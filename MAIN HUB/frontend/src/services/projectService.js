// /home/kk/RS/MAIN HUB/frontend/src/services/projectService.js

import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('token');

export const projectService = {
  // Get all projects
  getProjects: async (params = {}) => {
    try {
      const response = await axios.get(`${API_URL}/projects`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        params
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching projects:', error);
      throw error;
    }
  },


  // Add this safe method
getProjectsSafe: async () => {
  try {
    const response = await axios.get(`${API_URL}/projects`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  } catch (error) {
    console.warn('⚠️ Safe getProjects failed:', error.message);
    return { 
      success: false, 
      data: [], 
      message: error.response?.data?.message || 'Failed to load projects' 
    };
  }
},
  // Get project types
  getProjectTypes: async () => {
    try {
      const response = await axios.get(`${API_URL}/projects/types`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching project types:', error);
      throw error;
    }
  },

  // Get single project
  getProject: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/projects/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching project:', error);
      throw error;
    }
  },

  // Get projects by type
  getProjectsByType: async (type) => {
    try {
      const response = await axios.get(`${API_URL}/projects/type/${type}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching projects by type:', error);
      throw error;
    }
  }
};

export default projectService;