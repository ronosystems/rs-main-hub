import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const getToken = () => localStorage.getItem('token');

export const roleService = {
  // Get all roles
  getRoles: async () => {
    const response = await axios.get(`${API_URL}/roles`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  },

  // Get single role
  getRole: async (id) => {
    if (!id) {
      return { data: { permissions: {} } };
    }
    const response = await axios.get(`${API_URL}/roles/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  },

  // Create role
  createRole: async (roleData) => {
    const response = await axios.post(`${API_URL}/roles`, roleData, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  },

  // Update role
  updateRole: async (id, roleData) => {
    const response = await axios.put(`${API_URL}/roles/${id}`, roleData, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  },

  // Delete role
  deleteRole: async (id) => {
    const response = await axios.delete(`${API_URL}/roles/${id}`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  },

  // Seed default roles
  seedRoles: async () => {
    const response = await axios.get(`${API_URL}/roles/seed`, {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    return response.data;
  }
};