import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import './PhoneReceipt.css';

const PhoneReceipt = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { receiptData: locationReceiptData, phone, unit, branch, fromSale } = location.state || {};

  const [loading, setLoading] = useState(true);
  const [receiptData, setReceiptData] = useState(null);
  const [companyDetails, setCompanyDetails] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [soldByUser, setSoldByUser] = useState(null);
  const [soldByName, setSoldByName] = useState('');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
  const STATIC_URL = process.env.REACT_APP_STATIC_URL || 'http://localhost:5002';

  useEffect(() => {
    fetchCompanyDetails();
    fetchUserDetails();
    
    if (locationReceiptData) {
      console.log('📋 Received receipt data:', locationReceiptData);
      setReceiptData(locationReceiptData);
      
      // ✅ Check for soldBy in multiple places
      const soldById = locationReceiptData?.soldBy || 
                       locationReceiptData?.soldByUser?._id || 
                       locationReceiptData?.createdBy ||
                       unit?.soldBy;
      
      // ✅ Also check if soldByName is directly provided
      if (locationReceiptData?.soldByName) {
        setSoldByName(locationReceiptData.soldByName);
      }
      
      if (soldById) {
        fetchSoldByUser(soldById);
      }
    }
  }, []);

  useEffect(() => {
    if (companyDetails && receiptData) {
      setReceiptData(prev => ({
        ...prev,
        company: {
          name: companyDetails.name || prev?.company?.name || 'Company Name',
          address: companyDetails.address || prev?.company?.address || 'Address',
          phone: companyDetails.phone || prev?.company?.phone || 'Phone',
          email: companyDetails.email || prev?.company?.email || 'Email',
          pin: companyDetails.pin || prev?.company?.pin || '---',
          logo: companyDetails.logo || prev?.company?.logo || null
        }
      }));
      setLoading(false);
    } else if (companyDetails && !receiptData) {
      buildReceiptFromData();
    }
  }, [companyDetails]);

  const fetchSoldByUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        console.log('👤 Sold by user:', data.data);
        setSoldByUser(data.data);
        setSoldByName(data.data.name);
      }
    } catch (error) {
      console.error('Error fetching sold by user:', error);
      // Fallback: use the name from receipt data if available
      if (locationReceiptData?.soldByName) {
        setSoldByName(locationReceiptData.soldByName);
      }
    }
  };

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
        console.log('🏢 Company details fetched:', data.data);
        setCompanyDetails(data.data);
      } else {
        const userResponse = await fetch(`${API_URL}/users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const userData = await userResponse.json();
        if (userData.success && userData.data.company) {
          setCompanyDetails(userData.data.company);
        }
      }
    } catch (error) {
      console.error('Error fetching company details:', error);
      setLoading(false);
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

  const buildReceiptFromData = () => {
    if (!phone || !unit) {
      setLoading(false);
      return;
    }

    const customerData = locationReceiptData?.customer || unit?.customer || {
      name: 'N/A',
      phone: 'N/A',
      id: 'N/A'
    };

    const receiptNumber = locationReceiptData?.receiptNumber || 
                          locationReceiptData?.receiptNo || 
                          '000001';

    // ✅ Get sold by info from multiple sources
    const soldById = locationReceiptData?.soldBy || 
                     locationReceiptData?.soldByUser?._id || 
                     locationReceiptData?.createdBy ||
                     unit?.soldBy;

    const soldByNameFromData = locationReceiptData?.soldByName || 
                                locationReceiptData?.agent ||
                                unit?.soldByName;

    const newReceiptData = {
      company: {
        name: companyDetails?.name || 'Company Name',
        address: companyDetails?.address || 'Address',
        phone: companyDetails?.phone || 'Phone',
        email: companyDetails?.email || 'Email',
        pin: companyDetails?.pin || '---',
        logo: companyDetails?.logo || null
      },
      receiptNo: receiptNumber,
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
      soldBy: soldById || userDetails?._id,
      soldByName: soldByNameFromData || userDetails?.name || 'Unknown',
      customer: {
        name: customerData.name || 'N/A',
        phone: customerData.phone || 'N/A',
        id: customerData.id || 'N/A',
        kinName: customerData.kinName || 'N/A',
        kinPhone: customerData.kinPhone || 'N/A'
      },
      product: {
        name: `${phone.brand} ${phone.model}`,
        imei: unit.identifier,
        ram: phone.ram || 'N/A',
        rom: phone.rom || 'N/A',
        price: locationReceiptData?.product?.price || unit?.salePrice || 0,
        quantity: 1
      },
      saleType: locationReceiptData?.saleType || unit?.saleType || 'credit',
      grandTotal: locationReceiptData?.grandTotal || unit?.salePrice || 0,
      branch: branch?.name || 'Not Assigned'
    };

    setReceiptData(newReceiptData);
    
    if (newReceiptData.soldBy) {
      fetchSoldByUser(newReceiptData.soldBy);
    } else if (newReceiptData.soldByName) {
      setSoldByName(newReceiptData.soldByName);
    }
    
    setLoading(false);
  };

  if (!phone || !unit) {
    return (
      <MainLayout title="Receipt" breadcrumbs={['Home', 'Phones', 'Receipt']}>
        <div className="error-state">
          <p>❌ Phone or IMEI not found</p>
          <button onClick={() => navigate('/phones')}>Go Back</button>
        </div>
      </MainLayout>
    );
  }

  const getLogoUrl = (logoPath) => {
    if (!logoPath) return null;
    if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
      return logoPath;
    }
    return `${STATIC_URL}${logoPath}`;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    if (fromSale) {
      const fetchLatestPhone = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${API_URL}/phones/${phone._id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const data = await response.json();
          if (data.success) {
            navigate(`/phones/imeis/${phone._id}`, { 
              state: { 
                phone: data.data,
                branch: branch 
              } 
            });
          } else {
            navigate(`/phones/imeis/${phone._id}`, { 
              state: { 
                phone: phone,
                branch: branch 
              } 
            });
          }
        } catch (error) {
          console.error('Error fetching latest phone data:', error);
          navigate(`/phones/imeis/${phone._id}`, { 
            state: { 
              phone: phone,
              branch: branch 
            } 
          });
        }
      };
      fetchLatestPhone();
    } else {
      navigate(`/phones/imeis/${phone._id}`, { 
        state: { 
          phone, 
          branch 
        } 
      });
    }
  };

  if (loading) {
    return (
      <MainLayout title="Receipt" breadcrumbs={['Home', 'Phones', 'Receipt']}>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading receipt...</p>
        </div>
      </MainLayout>
    );
  }

  const displayData = receiptData || {
    company: companyDetails || {
      name: 'Company Name',
      address: 'Address',
      phone: 'Phone',
      email: 'Email',
      pin: '---'
    },
    receiptNo: '000001',
    date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }),
    time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    soldBy: soldByUser?._id || userDetails?._id,
    soldByName: soldByName || userDetails?.name || 'Unknown',
    customer: unit?.customer || { 
      name: 'N/A', 
      phone: 'N/A', 
      id: 'N/A',
      kinName: 'N/A',
      kinPhone: 'N/A'
    },
    product: {
      name: `${phone.brand} ${phone.model}`,
      imei: unit.identifier,
      ram: phone.ram || 'N/A',
      rom: phone.rom || 'N/A',
      price: unit?.salePrice || 0,
      quantity: 1
    },
    saleType: unit?.saleType || 'credit',
    grandTotal: unit?.salePrice || 0,
    branch: branch?.name || 'Not Assigned'
  };

  // ✅ Get the sold by name (prioritize soldByUser, then soldByName, then fallback)
  const getSoldByDisplayName = () => {
    // First: Use fetched user
    if (soldByUser && soldByUser.name) {
      return soldByUser.name.split(' ')[0];
    }
    // Second: Use soldByName from data
    if (displayData.soldByName && displayData.soldByName !== 'Unknown') {
      return displayData.soldByName.split(' ')[0];
    }
    // Third: Use agent from display data
    if (displayData.agent && displayData.agent !== 'Unknown') {
      return displayData.agent.split(' ')[0];
    }
    // Fourth: Use current user as fallback
    if (userDetails?.name) {
      return userDetails.name.split(' ')[0];
    }
    return 'Unknown';
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '0.00';
    return amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const productPrice = displayData.product?.price || 0;
  const grandTotal = displayData.grandTotal || productPrice;
  const company = displayData.company || companyDetails || {};

  return (
    <MainLayout title="Receipt" breadcrumbs={['Home', 'Phones', 'Receipt']}>
      <div className="receipt-page">
        <div className="receipt-page-header">
          <button className="btn-back" onClick={handleClose}>
            ← Back to IMEI List
          </button>
          <button className="btn-print" onClick={handlePrint}>
            🖨️ Print Receipt
          </button>
        </div>

        <div className="receipt-container" id="receipt-content">
          <div className="receipt-company">
            {company.logo && (
              <div className="receipt-company-logo">
                <img 
                  src={getLogoUrl(company.logo)} 
                  alt={company.name} 
                  style={{ 
                    maxWidth: '80px', 
                    maxHeight: '60px', 
                    objectFit: 'contain',
                    marginBottom: '8px'
                  }}
                />
              </div>
            )}
            <h2>{company.name || 'Company Name'}</h2>
            <p>{company.address || 'Address'}</p>
            <p>Tel: {company.phone || 'Phone'}</p>
            {company.email && <p>Email: {company.email}</p>}
            <p>PIN: {company.pin || '---'}</p>
          </div>

          <div className="receipt-header">
            <div className="receipt-header-left">
              <p><strong>ETR No.</strong> {displayData.receiptNo}</p>
              {/* ✅ Show the actual user who performed the sale */}
              <p><strong>Sold By</strong> {getSoldByDisplayName()}</p>
            </div>
            <div className="receipt-header-right">
              <p><strong>Date</strong> {displayData.date}</p>
              <p><strong>Time</strong> {displayData.time}</p>
            </div>
          </div>

          {displayData.customer && displayData.customer.name && displayData.customer.name !== 'N/A' && (
            <div className="receipt-customer">
              <h4>Customer Details</h4>
              <p><strong>Full Names:</strong> {displayData.customer.name}</p>
              <p><strong>Phone Number:</strong> {displayData.customer.phone}</p>
              <p><strong>ID Number:</strong> {displayData.customer.id || 'N/A'}</p>
              {displayData.customer.kinName && displayData.customer.kinName !== 'N/A' && (
                <>
                  <p><strong>Next of Kin:</strong> {displayData.customer.kinName}</p>
                  <p><strong>NOK Phone:</strong> {displayData.customer.kinPhone}</p>
                </>
              )}
            </div>
          )}

          <div className="receipt-items">
            <h4>Product Details</h4>
            <table>
              <thead>
                <tr>
                  <th>Qty</th>
                  <th>Description</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>{displayData.product?.quantity || 1}</td>
                  <td>
                    {displayData.product?.name || `${phone.brand} ${phone.model}`}
                    <br />
                    <span className="receipt-specs">
                      {displayData.product?.ram || phone.ram || 'N/A'} | {displayData.product?.rom || phone.rom || 'N/A'}
                    </span>
                    <br />
                    <span className="receipt-imei">
                      IMEI: {displayData.product?.imei || unit.identifier}
                    </span>
                  </td>
                  <td>KES {formatCurrency(productPrice)}</td>
                  <td>KES {formatCurrency(grandTotal)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="receipt-total">
            <div className="receipt-total-row">
              <span><strong>GRAND TOTAL:</strong></span>
              <span><strong>KES {formatCurrency(grandTotal)}</strong></span>
            </div>
          </div>

          <div className="receipt-footer">
            <p className="receipt-thanks">Thank you for your business!</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default PhoneReceipt;