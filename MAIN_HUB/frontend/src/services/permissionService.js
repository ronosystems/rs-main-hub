import axios from 'axios';

const API_URL = 'https://main-hub-api-ea52e89c5128.herokuapp.com/api';

const getToken = () => localStorage.getItem('token');

export const projectService = {
  // Get all projects
  getProjects: async () => {
    const response = await axios.get(`${API_URL}/projects`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  },

  // Get single project
  getProject: async (id) => {
    const response = await axios.get(`${API_URL}/projects/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  },

  // Get project types
  getProjectTypes: async () => {
    const response = await axios.get(`${API_URL}/projects/types`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  },

  // Create project
  createProject: async (projectData) => {
    const response = await axios.post(`${API_URL}/projects`, projectData, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  },

  // Update project
  updateProject: async (id, projectData) => {
    const response = await axios.put(`${API_URL}/projects/${id}`, projectData, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  },

  // Delete project
  deleteProject: async (id) => {
    const response = await axios.delete(`${API_URL}/projects/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  },

  // Get next project code
  getNextCode: async () => {
    const response = await axios.get(`${API_URL}/projects/next-code`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  }
};
