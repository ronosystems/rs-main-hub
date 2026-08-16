// /home/kk/RS/TRONIC_MASTER/frontend/src/services/productService.js

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

export const productService = {
  // ============================================
  // PRODUCT OPERATIONS
  // ============================================

  // Get all products
  async getProducts() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/products`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch products');
    return data;
  },

  // Get single product
  async getProduct(id) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/products/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch product');
    return data;
  },

  // Create product
  async createProduct(productData) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to create product');
    return data;
  },

  // Update product
  async updateProduct(id, productData) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update product');
    return data;
  },

  // Delete product
  async deleteProduct(id) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/products/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to delete product');
    return data;
  },

  // ============================================
  // PRICE OPERATIONS
  // ============================================

  // Update product prices
  async updatePrice(productId, priceData) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/products/${productId}/price`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(priceData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update price');
    return data;
  },

  // ============================================
  // UNIT OPERATIONS (IMEI / Serial Numbers)
  // ============================================

  // Add a unit to a product
  async addUnit(productId, unitData) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/products/${productId}/units`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(unitData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to add unit');
    return data;
  },

  // Update a unit
  async updateUnit(productId, identifier, unitData) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/products/${productId}/units/${encodeURIComponent(identifier)}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(unitData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update unit');
    return data;
  },

  // Delete a unit
  async deleteUnit(productId, identifier) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/products/${productId}/units/${encodeURIComponent(identifier)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to delete unit');
    return data;
  },

  // ============================================
  // STOCK OPERATIONS (Accessories only)
  // ============================================

  // Update stock for accessories
  async updateStock(productId, stockData) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/products/${productId}/stock`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(stockData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to update stock');
    return data;
  },

  // ============================================
  // BULK OPERATIONS
  // ============================================

  // Bulk add units to a product
  async bulkAddUnits(productId, units) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/products/${productId}/units/bulk`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ units })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to bulk add units');
    return data;
  },

  // ============================================
  // SEARCH & FILTER OPERATIONS
  // ============================================

  // Search products
  async searchProducts(searchTerm) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/products/search/${encodeURIComponent(searchTerm)}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to search products');
    return data;
  },

  // Get products by category
  async getProductsByCategory(category) {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/products/category/${category}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch products by category');
    return data;
  },

  // Get low stock products
  async getLowStockProducts() {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/products/low-stock`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to fetch low stock products');
    return data;
  }
};