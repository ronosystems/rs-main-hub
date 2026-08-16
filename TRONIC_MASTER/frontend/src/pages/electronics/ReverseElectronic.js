import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import './ReverseElectronic.css';

const ReverseElectronic = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { product, unit, branch } = location.state || {};

  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

  if (!product || !unit) {
    return (
      <MainLayout title="Reverse Sale" breadcrumbs={['Home', 'Products', 'Electronics', 'Reverse']}>
        <div className="error-state">
          <p>❌ Product or Serial not found</p>
          <button onClick={() => navigate('/products/electronics')}>Go Back</button>
        </div>
      </MainLayout>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      alert('Please provide a reason for reversing this sale');
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/products/electronics/${product._id}/reverse`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          serial: unit.identifier,
          reason: reason
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`✅ Sale reversed successfully for Serial: ${unit.identifier}`);
        
        const updatedProductResponse = await fetch(`${API_URL}/products/${product._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const updatedProductData = await updatedProductResponse.json();
        
        if (updatedProductData.success) {
          navigate(`/products/electronics/serials/${product._id}`, { 
            state: { 
              product: updatedProductData.data,
              branch: branch 
            } 
          });
        } else {
          navigate(`/products/electronics/serials/${product._id}`, { 
            state: { 
              product: product,
              branch: branch 
            } 
          });
        }
      } else {
        alert('❌ ' + data.message);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error reversing sale:', error);
      alert('❌ Failed to reverse sale: ' + error.message);
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(`/products/electronics/serials/${product._id}`, { 
      state: { product, branch } 
    });
  };

  return (
    <MainLayout title="Reverse Sale" breadcrumbs={['Home', 'Products', 'Electronics', 'Reverse']}>
      <div className="reverse-page">
        <div className="reverse-header">
          <button className="btn-back" onClick={handleBack}>← Back</button>
          <h2>↩️ Reverse Sale</h2>
          <p>Reverse the sale transaction for this serial number</p>
        </div>

        <div className="product-info-card">
          <div className="product-icon">💻</div>
          <div className="product-details">
            <h3>{product.brand} {product.model}</h3>
            <div className="product-specs">
              <span>Serial: {unit.identifier}</span>
              <span>RAM: {product.ram || 'N/A'}</span>
              <span>ROM: {product.rom || 'N/A'}</span>
              <span>Branch: {branch?.name || 'Not Assigned'}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="reverse-form">
          <div className="reverse-info-box">
            <div className="info-row">
              <span>Current Status</span>
              <span className="status-badge sold">Sold</span>
            </div>
            {unit.customer && (
              <>
                <div className="info-row">
                  <span>Customer</span>
                  <span>{unit.customer.name}</span>
                </div>
                <div className="info-row">
                  <span>Phone</span>
                  <span>{unit.customer.phone}</span>
                </div>
                <div className="info-row">
                  <span>ID Number</span>
                  <span>{unit.customer.id || 'N/A'}</span>
                </div>
                <div className="info-row">
                  <span>Sale Price</span>
                  <span>KSh {unit.salePrice?.toLocaleString() || '0'}</span>
                </div>
                <div className="info-row">
                  <span>Sale Type</span>
                  <span className={`sale-type-badge ${unit.saleType || 'cash'}`}>
                    {unit.saleType === 'cash' ? '💵 Cash' : '💳 Credit'}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="form-group">
            <label>Reason for Reversal *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Please explain why this sale is being reversed..."
              rows="4"
              required
            />
          </div>

          <div className="warning-box">
            ⚠️ This action will return the product to inventory as available
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={handleBack}>Cancel</button>
            <button type="submit" className="btn-reverse" disabled={loading}>
              {loading ? 'Processing...' : '↩️ Confirm Reverse'}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default ReverseElectronic;