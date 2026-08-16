import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import './sellPhone.css';

const SellPhone = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { phone, unit, branch } = location.state || {};

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerId: '',
    kinName: '',
    kinPhone: '',
    sellingPrice: unit?.phoneData?.price?.sale || '',
    saleType: 'credit'
  });

  const [loading, setLoading] = useState(false);
  const [companyDetails, setCompanyDetails] = useState(null);
  const [userDetails, setUserDetails] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
  const STATIC_URL = process.env.REACT_APP_STATIC_URL || 'http://localhost:5002';

  // ============================================
  // FETCH COMPANY AND USER DETAILS
  // ============================================
  useEffect(() => {
    fetchCompanyDetails();
    fetchUserDetails();
  }, []);

  const fetchCompanyDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/companies/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setCompanyDetails(data.data);
      }
    } catch (error) {
      console.error('Error fetching company details:', error);
    }
  };

  const fetchUserDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setUserDetails(data.data);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    }
  };

  if (!phone || !unit) {
    return (
      <MainLayout title="Sell Phone" breadcrumbs={['Home', 'Phones', 'Sell']}>
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
    
    // Validate
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
        imei: unit.identifier,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerId: formData.customerId,
        kinName: formData.kinName || '',
        kinPhone: formData.kinPhone || '',
        sellingPrice: parseFloat(formData.sellingPrice),
        saleType: formData.saleType
      };

      console.log('📤 Sending sale data:', saleData);

      // API call to sell the phone
      const response = await fetch(`${API_URL}/phones/${phone._id}/sell`, {
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
        
        // ============================================
        // FETCH UPDATED PHONE DATA AFTER SALE
        // ============================================
        const updatedPhoneResponse = await fetch(`${API_URL}/phones/${phone._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const updatedPhoneData = await updatedPhoneResponse.json();
        
        if (updatedPhoneData.success) {
          console.log('📱 Updated phone data fetched');
        }

        // ============================================
        // PREPARE RECEIPT DATA WITH ALL VALUES
        // ============================================
        const receiptData = {
          // Company details from database
          company: {
            name: companyDetails?.name || 'Fieldmax Electronics',
            address: companyDetails?.address || 'KENYATTA STREET, NAIROBI, Kenya',
            phone: companyDetails?.phone || '0700000000',
            email: companyDetails?.email || 'fieldmax@gmail.com',
            pin: companyDetails?.pin || '---',
            logo: companyDetails?.logo || null
          },
          // Receipt details
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
          // Customer details - PASS ALL VALUES
          customer: {
            name: formData.customerName,
            phone: formData.customerPhone,
            id: formData.customerId,
            kinName: formData.kinName || 'N/A',
            kinPhone: formData.kinPhone || 'N/A'
          },
          // Product details - PASS PRICE
          product: {
            name: `${phone.brand} ${phone.model}`,
            imei: unit.identifier,
            ram: phone.ram || 'N/A',
            rom: phone.rom || 'N/A',
            price: parseFloat(formData.sellingPrice), // ENSURE PRICE IS PASSED
            quantity: 1
          },
          // Sale details
          saleType: formData.saleType,
          grandTotal: parseFloat(formData.sellingPrice), // ENSURE TOTAL IS PASSED
          branch: branch?.name || 'Not Assigned',
          // Original data for reference
          phone: phone,
          unit: unit,
          branch: branch
        };

        console.log('📋 Receipt data being sent:', receiptData);

        // ============================================
        // NAVIGATE TO PHONE RECEIPT PAGE
        // ============================================
        navigate(`/phones/receipt/${phone._id}`, { 
          state: { 
            receiptData: receiptData,
            phone: updatedPhoneData.success ? updatedPhoneData.data : phone,
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
      console.error('❌ Error selling phone:', error);
      alert('❌ Failed to sell phone: ' + error.message);
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(`/phones/imeis/${phone._id}`, { 
      state: { 
        phone, 
        branch 
      } 
    });
  };

  return (
    <MainLayout title="New Phone Sale" breadcrumbs={['Home', 'Phones', 'Sell']}>
      <div className="sell-page">
        <div className="sell-header">
          <button className="btn-back" onClick={handleBack}>
            ← Back
          </button>
          <h2>💰 Sell Phone</h2>
          <p>Complete the sale transaction for this IMEI</p>
        </div>

        {/* Product Info */}
        <div className="product-info-card">
          <div className="product-icon">📱</div>
          <div className="product-details">
            <h3>{phone.brand} {phone.model}</h3>
            <div className="product-specs">
              <span>IMEI: {unit.identifier}</span>
              <span>RAM: {phone.ram || 'N/A'}</span>
              <span>ROM: {phone.rom || 'N/A'}</span>
              <span>Branch: {branch?.name || 'Not Assigned'}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="sell-form">
          <div className="form-grid">
            {/* Left Column - Customer Details */}
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

            {/* Right Column - Sale Details */}
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
                  <span>{phone.brand} {phone.model}</span>
                </div>
                <div className="summary-row">
                  <span>IMEI</span>
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
            <button type="button" className="btn-cancel" onClick={handleBack}>
              Cancel
            </button>
            <button type="submit" className="btn-submit" disabled={loading}>
              {loading ? 'Processing...' : '✅ Complete Sale'}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default SellPhone;