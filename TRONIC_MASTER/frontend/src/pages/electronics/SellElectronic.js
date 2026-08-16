import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import './SellElectronic.css';

const SellElectronic = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { product, unit, branch } = location.state || {};

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerId: '',
    kinName: '',
    kinPhone: '',
    sellingPrice: unit?.product?.price?.sale || '',
    saleType: 'credit'
  });

  const [loading, setLoading] = useState(false);
  const [companyDetails, setCompanyDetails] = useState(null);
  const [userDetails, setUserDetails] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
  const STATIC_URL = process.env.REACT_APP_STATIC_URL || 'http://localhost:5002';

  useEffect(() => {
    fetchCompanyDetails();
    fetchUserDetails();
  }, []);

  const fetchCompanyDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/companies/settings`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setCompanyDetails(data.data);
    } catch (error) {
      console.error('Error fetching company details:', error);
    }
  };

  const fetchUserDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setUserDetails(data.data);
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  if (!product || !unit) {
    return (
      <MainLayout title="Sell Electronic" breadcrumbs={['Home', 'Products', 'Electronics', 'Sell']}>
        <div className="error-state">
          <p>❌ Product or Serial not found</p>
          <button onClick={() => navigate('/products/electronics')}>Go Back</button>
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
    
    if (!formData.customerName || !formData.customerPhone || !formData.customerId) {
      alert('Please fill in all required customer details');
      return;
    }

    if (!formData.sellingPrice || parseFloat(formData.sellingPrice) <= 0) {
      alert('Please enter a valid selling price');
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const saleData = {
        serial: unit.identifier,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerId: formData.customerId,
        kinName: formData.kinName || '',
        kinPhone: formData.kinPhone || '',
        sellingPrice: parseFloat(formData.sellingPrice),
        saleType: formData.saleType
      };

      console.log('📤 Sending sale data:', saleData);

      const response = await fetch(`${API_URL}/products/electronics/${product._id}/sell`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(saleData)
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Sale successful:', data);
        
        const updatedProductResponse = await fetch(`${API_URL}/products/${product._id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const updatedProductData = await updatedProductResponse.json();
        
        const receiptData = {
          company: {
            name: companyDetails?.name || 'TRONIC MASTER',
            address: companyDetails?.address || 'Nairobi, Kenya',
            phone: companyDetails?.phone || '+254 700 000 000',
            email: companyDetails?.email || 'info@tronicmaster.com',
            pin: companyDetails?.pin || 'A000000000A',
            logo: companyDetails?.logo || null
          },
          receiptNo: data.receiptNo || `RCP-${Date.now().toString().slice(-6)}`,
          date: new Date().toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
          }),
          time: new Date().toLocaleTimeString('en-GB', { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit' 
          }),
          agent: userDetails?.name || 'Admin',
          customer: {
            name: formData.customerName,
            phone: formData.customerPhone,
            id: formData.customerId,
            kinName: formData.kinName || 'N/A',
            kinPhone: formData.kinPhone || 'N/A'
          },
          product: {
            name: `${product.brand} ${product.model}`,
            serial: unit.identifier,
            ram: product.ram || 'N/A',
            rom: product.rom || 'N/A',
            price: parseFloat(formData.sellingPrice),
            quantity: 1
          },
          saleType: formData.saleType,
          grandTotal: parseFloat(formData.sellingPrice),
          branch: branch?.name || 'Not Assigned',
          product: product,
          unit: unit,
          branch: branch
        };

        navigate(`/products/electronics/receipt/${product._id}`, { 
          state: { 
            receiptData: receiptData,
            product: updatedProductData.success ? updatedProductData.data : product,
            unit: unit,
            branch: branch,
            fromSale: true
          } 
        });
        
      } else {
        alert('❌ ' + data.message);
        setLoading(false);
      }
    } catch (error) {
      console.error('❌ Error selling:', error);
      alert('❌ Failed to sell: ' + error.message);
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(`/products/electronics/serials/${product._id}`, { 
      state: { product, branch } 
    });
  };

  return (
    <MainLayout title="New Electronic Sale" breadcrumbs={['Home', 'Products', 'Electronics', 'Sell']}>
      <div className="sell-page">
        <div className="sell-header">
          <button className="btn-back" onClick={handleBack}>← Back</button>
          <h2>💰 Sell Electronic</h2>
          <p>Complete the sale transaction for this serial number</p>
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

        <form onSubmit={handleSubmit} className="sell-form">
          <div className="form-grid">
            <div className="form-column">
              <div className="form-section">
                <h4>👤 Customer Details</h4>
                <div className="form-group">
                  <label>Full Names *</label>
                  <input
                    type="text"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    placeholder="Enter customer full names"
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Phone Number *</label>
                    <input
                      type="tel"
                      name="customerPhone"
                      value={formData.customerPhone}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>ID Number *</label>
                    <input
                      type="text"
                      name="customerId"
                      value={formData.customerId}
                      onChange={handleChange}
                      placeholder="Enter ID number"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h4>👨‍👩‍👧‍👦 Next of Kin</h4>
                <div className="form-group">
                  <label>Full Names</label>
                  <input
                    type="text"
                    name="kinName"
                    value={formData.kinName}
                    onChange={handleChange}
                    placeholder="Enter next of kin full names"
                  />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    name="kinPhone"
                    value={formData.kinPhone}
                    onChange={handleChange}
                    placeholder="Enter next of kin phone number"
                  />
                </div>
              </div>
            </div>

            <div className="form-column">
              <div className="form-section">
                <h4>💰 Sale Details</h4>
                <div className="form-group">
                  <label>Selling Price *</label>
                  <input
                    type="number"
                    name="sellingPrice"
                    value={formData.sellingPrice}
                    onChange={handleChange}
                    placeholder="Enter selling price"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Sale Type *</label>
                  <select
                    name="saleType"
                    value={formData.saleType}
                    onChange={handleChange}
                    required
                  >
                    <option value="credit">💳 Credit</option>
                    <option value="cash">💵 Cash</option>
                  </select>
                </div>
              </div>

              <div className="sale-summary">
                <h4>📋 Sale Summary</h4>
                <div className="summary-row">
                  <span>Product</span>
                  <span>{product.brand} {product.model}</span>
                </div>
                <div className="summary-row">
                  <span>Serial</span>
                  <span>{unit.identifier}</span>
                </div>
                <div className="summary-row">
                  <span>Sale Type</span>
                  <span className={`type-badge ${formData.saleType}`}>
                    {formData.saleType === 'cash' ? '💵 Cash' : '💳 Credit'}
                  </span>
                </div>
                <div className="summary-row total">
                  <span>Total Amount</span>
                  <span className="total-amount">
                    {formData.sellingPrice ? `KSh ${parseFloat(formData.sellingPrice).toLocaleString()}` : 'KSh 0'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={handleBack}>Cancel</button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Processing...' : '✅ Complete Sale'}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default SellElectronic;