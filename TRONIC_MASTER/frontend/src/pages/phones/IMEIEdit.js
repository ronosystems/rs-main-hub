import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import './IMEIEdit.css';

const IMEIEdit = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { phone, unit, branch } = location.state || {};

  const [formData, setFormData] = useState({
    imeiNumber: unit?.identifier || '',
    status: unit?.status || 'available'
  });

  const [loading, setLoading] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

  if (!phone || !unit) {
    return (
      <MainLayout title="Edit IMEI" breadcrumbs={['Home', 'Phones', 'Edit IMEI']}>
        <div className="error-state">
          <p>❌ Phone or IMEI not found</p>
          <button onClick={() => navigate('/phones')}>Go Back</button>
        </div>
      </MainLayout>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.imeiNumber.trim()) {
      alert('Please enter a valid IMEI number');
      return;
    }

    // Check if IMEI changed
    if (formData.imeiNumber.trim() === unit.identifier && formData.status === unit.status) {
      alert('No changes to save');
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // API call to update the IMEI
      const response = await fetch(`${API_URL}/phones/${phone._id}/unit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          oldImei: unit.identifier,
          newImei: formData.imeiNumber.trim(),
          status: formData.status
        })
      });

      const data = await response.json();
      
      if (data.success) {
        alert(`✅ IMEI updated successfully!`);
        
        // ============================================
        // Fetch updated phone data before navigating back
        // ============================================
        const updatedPhoneResponse = await fetch(`${API_URL}/phones/${phone._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const updatedPhoneData = await updatedPhoneResponse.json();
        
        // Navigate back to IMEI list with updated phone data
        if (updatedPhoneData.success) {
          navigate(`/phones/imeis/${phone._id}`, { 
            state: { 
              phone: updatedPhoneData.data,
              branch: branch 
            } 
          });
        } else {
          // Fallback: use the original phone data
          navigate(`/phones/imeis/${phone._id}`, { 
            state: { 
              phone: phone,
              branch: branch 
            } 
          });
        }
      } else {
        alert('❌ ' + data.message);
      }
    } catch (error) {
      console.error('Error updating IMEI:', error);
      alert('❌ Failed to update IMEI: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'available': 'Available',
      'sold': 'Sold',
      'reserved': 'Reserved',
      'repair': 'In Repair'
    };
    return labels[status] || status || 'Unknown';
  };

  const handleBack = () => {
    // Navigate back to IMEI list
    navigate(`/phones/imeis/${phone._id}`, { 
      state: { 
        phone, 
        branch 
      } 
    });
  };

  return (
    <MainLayout title="Edit IMEI" breadcrumbs={['Home', 'Phones', 'Edit IMEI']}>
      <div className="imei-edit-page">
        <div className="imei-edit-header">
          <button className="btn-back" onClick={handleBack}>
            ← Back
          </button>
          <h2>✏️ Edit IMEI</h2>
          <p>Update IMEI details for this phone</p>
        </div>

        {/* Product Info */}
        <div className="product-info-card">
          <div className="product-icon">📱</div>
          <div className="product-details">
            <h3>{phone.brand} {phone.model}</h3>
            <div className="product-specs">
              <span>Current IMEI: {unit.identifier}</span>
              <span>RAM: {phone.ram || 'N/A'}</span>
              <span>ROM: {phone.rom || 'N/A'}</span>
              <span>Branch: {branch?.name || 'Not Assigned'}</span>
              <span className={`status-badge current-status ${unit.status}`}>
                Current Status: {getStatusLabel(unit.status)}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="edit-form">
          <div className="form-group">
            <label>IMEI Number *</label>
            <input
              type="text"
              name="imeiNumber"
              value={formData.imeiNumber}
              onChange={handleChange}
              placeholder="Enter IMEI number"
              required
            />
          </div>

          <div className="form-group">
            <label>Status</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="reserved">Reserved</option>
              <option value="repair">In Repair</option>
            </select>
          </div>

          <div className="current-info">
            <h4>Current IMEI Info</h4>
            <div className="info-row">
              <span>IMEI</span>
              <span className="imei-value">{unit.identifier}</span>
            </div>
            <div className="info-row">
              <span>Status</span>
              <span className={`status-badge ${unit.status}`}>
                {getStatusLabel(unit.status)}
              </span>
            </div>
            {unit.customer && unit.customer.name && (
              <div className="info-row">
                <span>Customer</span>
                <span>{unit.customer.name}</span>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={handleBack}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Saving...' : '💾 Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default IMEIEdit;