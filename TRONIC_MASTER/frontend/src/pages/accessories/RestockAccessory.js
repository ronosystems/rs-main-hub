// /home/kk/RS/TRONIC_MASTER/frontend/src/pages/accessories/RestockAccessory.js

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import { productService } from '../../services/productService';
import './RestockAccessory.css';

const RestockAccessory = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { product, branch, currentStock, minLevel } = location.state || {};
  
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [restockData, setRestockData] = useState({
    note: '',
    supplier: ''
  });

  if (!product) {
    return (
      <MainLayout title="Restock Accessory" breadcrumbs={['Home', 'Accessories', 'Restock']}>
        <div className="restock-error">
          <h2>❌ Product Not Found</h2>
          <p>No product data available for restocking.</p>
          <button onClick={() => navigate('/products/accessories')}>Back to Accessories</button>
        </div>
      </MainLayout>
    );
  }

  const handleRestock = async () => {
    if (quantity < 1) {
      setMessage({ type: 'error', text: 'Please enter a valid quantity' });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5002/api'}/products/${product._id}/stock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          quantity: currentStock + quantity
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ 
          type: 'success', 
          text: `✅ Successfully restocked ${quantity} units of ${product.name}!` 
        });
        setTimeout(() => {
          navigate('/products/accessories');
        }, 2000);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to restock' });
      }
    } catch (error) {
      console.error('Error restocking:', error);
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout title="Restock Accessory" breadcrumbs={['Home', 'Accessories', 'Restock']}>
      <div className="restock-page">
        <div className="restock-container">
          <div className="restock-header">
            <h2>📦 Restock Accessory</h2>
            <p>Add stock to {product.name || product.brand}</p>
          </div>

          <div className="restock-product-info">
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Product</span>
                <span className="info-value">{product.name || product.brand}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Model</span>
                <span className="info-value">{product.model || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">SKU</span>
                <span className="info-value">{product.sku || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Barcode</span>
                <span className="info-value">{product.barcode || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Current Stock</span>
                <span className={`info-value ${currentStock === 0 ? 'zero-stock' : ''}`}>
                  {currentStock} units
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Min Level</span>
                <span className="info-value">{minLevel || 5} units</span>
              </div>
              <div className="info-item">
                <span className="info-label">Branch</span>
                <span className="info-value">{branch?.name || 'N/A'}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Status</span>
                <span className={`status-badge ${currentStock === 0 ? 'out' : currentStock <= minLevel ? 'low' : 'good'}`}>
                  {currentStock === 0 ? 'Out of Stock' : currentStock <= minLevel ? 'Low Stock' : 'In Stock'}
                </span>
              </div>
            </div>
          </div>

          {message.text && (
            <div className={`restock-message ${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="restock-form">
            <div className="form-group">
              <label htmlFor="quantity">Quantity to Add *</label>
              <div className="quantity-input-group">
                <button 
                  className="qty-btn"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  −
                </button>
                <input
                  type="number"
                  id="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  className="quantity-input"
                />
                <button 
                  className="qty-btn"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </button>
              </div>
              <p className="field-hint">New stock will be: <strong>{currentStock + quantity} units</strong></p>
            </div>

            <div className="form-group">
              <label htmlFor="supplier">Supplier (Optional)</label>
              <input
                type="text"
                id="supplier"
                value={restockData.supplier}
                onChange={(e) => setRestockData({ ...restockData, supplier: e.target.value })}
                placeholder="Enter supplier name"
                className="restock-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="note">Note (Optional)</label>
              <textarea
                id="note"
                value={restockData.note}
                onChange={(e) => setRestockData({ ...restockData, note: e.target.value })}
                placeholder="Add a note about this restock"
                className="restock-textarea"
                rows="3"
              />
            </div>

            <div className="restock-actions">
              <button 
                className="btn-cancel"
                onClick={() => navigate('/products/accessories')}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="btn-restock"
                onClick={handleRestock}
                disabled={loading || quantity < 1}
              >
                {loading ? (
                  <span className="spinner-small"></span>
                ) : (
                  `✅ Restock ${quantity} Units`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default RestockAccessory;