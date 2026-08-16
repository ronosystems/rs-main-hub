// /home/kk/RS/TRONIC_MASTER/frontend/src/services/saleService.js

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

export const saleService = {
  // Get all sales
  async getSales(params = {}) {
    const token = localStorage.getItem('token');
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_URL}/sales${queryString ? '?' + queryString : ''}`;
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch sales');
    return data;
  },

  // Get single sale
  async getSale(id) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/sales/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch sale');
    return data;
  },

  // Create sale (POS)
  async createSale(saleData) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/sales`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(saleData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to create sale');
    return data;
  },

  // Get sales stats
  async getSalesStats(period = 'today') {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/sales/stats/${period}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch stats');
    return data;
  },

  // Get today's sales
  async getTodaySales() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/sales/today`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch today sales');
    return data;
  },

  // Get branch sales
  async getBranchSales(branchId, limit = 50) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/sales/branch/${branchId}?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch branch sales');
    return data;
  },

  // Search sales
  async searchSales(term) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/sales/search/${encodeURIComponent(term)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to search sales');
    return data;
  }
};