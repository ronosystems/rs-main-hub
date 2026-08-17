// /home/kk/RS/MAIN HUB/frontend/src/services/syncService.js

import axios from 'axios';

const API_URL = 'https://main-hub-api-ea52e89c5128.herokuapp.com/api';

const getToken = () => localStorage.getItem('token');

export const syncService = {
  syncProjects: async () => {
    try {
      const response = await axios.post(
        `${API_URL}/projects/sync`,
        {},
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Sync error:', error);
      throw error;
    }
  },

  createProjectFolder: async (projectName) => {
    try {
      const response = await axios.post(
        `${API_URL}/sync/create-folder`,
        { projectName },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      return response.data;
    } catch (error) {
      console.error('Create folder error:', error);
      throw error;
    }
  }
};

export default syncService;
