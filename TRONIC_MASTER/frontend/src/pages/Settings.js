// /home/kk/RS/TRONIC_MASTER/frontend/src/pages/Settings.js

import React, { useState, useEffect, useRef } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../context/AuthContext';
import './Settings.css';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const logoInputRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [companySettings, setCompanySettings] = useState({
    name: '',
    code: '',
    email: '',
    phone: '',
    address: '',
    pin: '',
    description: '',
    logo: '',
    currency: 'KES',
    taxRate: 16,
    receiptFooter: 'Thank you for shopping with us!',
    timezone: 'Africa/Nairobi',
    payment: {
      mpesa: {
        enabled: true,
        businessShortCode: '',
        consumerKey: '',
        consumerSecret: '',
        passkey: '',
        callbackUrl: '',
        environment: 'sandbox'
      },
      cash: {
        enabled: true,
        requireApproval: false
      },
      card: {
        enabled: false,
        merchantId: '',
        apiKey: ''
      },
      bank: {
        enabled: false,
        accountName: '',
        accountNumber: '',
        bankName: '',
        branch: ''
      }
    },
    receipt: {
      businessName: '',
      businessAddress: '',
      businessPhone: '',
      businessEmail: '',
      businessTaxPin: '',
      showLogo: true,
      showBusinessName: true,
      showAddress: true,
      showPhone: true,
      showEmail: true,
      showTaxPin: true,
      showReceiptNumber: true,
      showSaleDate: true,
      showSaleTime: true,
      showAgentUser: true,
      showBuyerName: true,
      showBuyerPhone: true,
      showBuyerId: true,
      showNextOfKinName: false,
      showNextOfKinPhone: false,
      showItemsTable: true,
      showImei: true,
      showQuantity: true,
      showUnitPrice: true,
      showLineTotal: true,
      showGrossTotal: true,
      showVat: true,
      vatRate: 16,
      vatLabel: 'VAT',
      taxType: 'exclusive',
      showFooter: true,
      footerText: 'Thank you for shopping with us!'
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [receiptLogo, setReceiptLogo] = useState(null);
  const [receiptLogoUrl, setReceiptLogoUrl] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
  const STATIC_URL = process.env.REACT_APP_STATIC_URL || 'http://localhost:5002';

  const sampleSale = {
    invoiceNo: 'INV-2024-001',
    cashier: 'John Doe',
    cashierRole: 'Agent',
    createdAt: new Date(),
    customerName: 'Jane Wanjiku',
    customerPhone: '0712345678',
    customerId: '12345678',
    nextOfKinName: 'Peter Wanjiku',
    nextOfKinPhone: '0723456789',
    subtotal: 300,
    total: 300,
    items: [
      { productName: 'Product X', model: 'Model X', specs: 'Specs X', sku: 'SKU-001', quantity: 1, price: 100, subtotal: 100 },
      { productName: 'Product Y', model: 'Model Y', specs: 'Specs Y', sku: 'SKU-002', quantity: 2, price: 100, subtotal: 200 }
    ]
  };

  useEffect(() => {
    if (user?.company) {
      const company = user.company;
      setCompanySettings({
        name: company.name || '',
        code: company.code || '',
        email: company.email || '',
        phone: company.phone || '',
        address: company.address || '',
        pin: company.pin || '',
        description: company.description || '',
        logo: company.logo || '',
        currency: company.settings?.currency || 'KES',
        taxRate: company.settings?.taxRate || 16,
        receiptFooter: company.settings?.receiptFooter || 'Thank you for shopping with us!',
        timezone: company.settings?.timezone || 'Africa/Nairobi',
        payment: company.settings?.payment || {
          mpesa: { enabled: true, businessShortCode: '', consumerKey: '', consumerSecret: '', passkey: '', callbackUrl: '', environment: 'sandbox' },
          cash: { enabled: true, requireApproval: false },
          card: { enabled: false, merchantId: '', apiKey: '' },
          bank: { enabled: false, accountName: '', accountNumber: '', bankName: '', branch: '' }
        },
        receipt: company.settings?.receipt || {
          businessName: company.name || '',
          businessAddress: company.address || '',
          businessPhone: company.phone || '',
          businessEmail: company.email || '',
          businessTaxPin: company.pin || '',
          showLogo: true,
          showBusinessName: true,
          showAddress: true,
          showPhone: true,
          showEmail: true,
          showTaxPin: true,
          showReceiptNumber: true,
          showSaleDate: true,
          showSaleTime: true,
          showAgentUser: true,
          showBuyerName: true,
          showBuyerPhone: true,
          showBuyerId: true,
          showNextOfKinName: false,
          showNextOfKinPhone: false,
          showItemsTable: true,
          showImei: true,
          showQuantity: true,
          showUnitPrice: true,
          showLineTotal: true,
          showGrossTotal: true,
          showVat: true,
          vatRate: 16,
          vatLabel: 'VAT',
          taxType: 'exclusive',
          showFooter: true,
          footerText: 'Thank you for shopping with us!'
        }
      });
      
      if (company.logo) {
        const logoUrl = company.logo.startsWith('http') ? company.logo : `${STATIC_URL}${company.logo}`;
        setReceiptLogoUrl(logoUrl);
        setReceiptLogo(true);
      }
    }
  }, [user, STATIC_URL]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const parts = name.split('.');
      if (parts.length === 2) {
        const [parent, child] = parts;
        setCompanySettings(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: type === 'checkbox' ? checked : value
          }
        }));
      } else if (parts.length === 3) {
        const [parent, child, subChild] = parts;
        setCompanySettings(prev => ({
          ...prev,
          [parent]: {
            ...prev[parent],
            [child]: {
              ...prev[parent][child],
              [subChild]: type === 'checkbox' ? checked : value
            }
          }
        }));
      }
    } else {
      setCompanySettings(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    setTimeout(updateReceiptPreview, 100);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file' });
      return;
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    const isSVG = file.type === 'image/svg+xml' || file.name.endsWith('.svg');
    
    if (!validTypes.includes(file.type) && !isSVG) {
      setMessage({ 
        type: 'error', 
        text: 'Please upload a valid image (JPEG, PNG, GIF, WEBP, or SVG)' 
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Logo size should be less than 2MB' });
      return;
    }

    setUploadingLogo(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('logo', file);

      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/companies/logo`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        const logoPath = data.data?.logo || data.logoUrl || '';
        
        setCompanySettings(prev => ({
          ...prev,
          logo: logoPath
        }));
        
        if (logoPath) {
          const fullLogoUrl = logoPath.startsWith('http') ? logoPath : `${STATIC_URL}${logoPath}`;
          setReceiptLogoUrl(fullLogoUrl);
          setReceiptLogo(true);
          localStorage.setItem('tronicCompanyLogo', fullLogoUrl);
          
          window.dispatchEvent(new CustomEvent('settingsUpdated', {
            detail: { 
              logo: fullLogoUrl,
              platformName: companySettings.name
            }
          }));
        }
        
        if (updateUser && data.data) {
          updateUser({
            ...user,
            company: data.data
          });
        }
        
        setMessage({ type: 'success', text: 'Company logo updated successfully!' });
        setTimeout(updateReceiptPreview, 100);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to upload logo' });
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      setMessage({ type: 'error', text: 'Network error. Please check if the server is running.' });
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!window.confirm('Are you sure you want to remove the company logo?')) {
      return;
    }

    setUploadingLogo(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/companies/logo`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setCompanySettings(prev => ({ ...prev, logo: '' }));
        setReceiptLogo(false);
        setReceiptLogoUrl(null);
        localStorage.removeItem('tronicCompanyLogo');
        
        window.dispatchEvent(new CustomEvent('settingsUpdated', {
          detail: { logo: null }
        }));
        
        if (updateUser && data.data) {
          updateUser({
            ...user,
            company: data.data
          });
        }
        
        setMessage({ type: 'success', text: 'Company logo removed successfully!' });
        setTimeout(updateReceiptPreview, 100);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to remove logo' });
      }
    } catch (error) {
      console.error('Error removing logo:', error);
      setMessage({ type: 'error', text: 'Network error. Please check if the server is running.' });
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/companies/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: companySettings.name,
          email: companySettings.email,
          phone: companySettings.phone,
          address: companySettings.address,
          pin: companySettings.pin,
          description: companySettings.description,
          settings: {
            currency: companySettings.currency,
            taxRate: companySettings.taxRate,
            receiptFooter: companySettings.receipt.footerText || 'Thank you for shopping with us!',
            timezone: companySettings.timezone,
            payment: companySettings.payment,
            receipt: companySettings.receipt
          }
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('tronicPlatformName', companySettings.name);
        
        window.dispatchEvent(new CustomEvent('settingsUpdated', {
          detail: { 
            platformName: companySettings.name
          }
        }));
        
        if (updateUser && data.data) {
          updateUser({
            ...user,
            company: data.data
          });
        }
        
        setMessage({ type: 'success', text: 'Company settings updated successfully!' });
        setIsEditing(false);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update settings' });
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      setMessage({ type: 'error', text: 'Network error. Please check if the server is running.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (user?.company) {
      const company = user.company;
      setCompanySettings({
        name: company.name || '',
        code: company.code || '',
        email: company.email || '',
        phone: company.phone || '',
        address: company.address || '',
        pin: company.pin || '',
        description: company.description || '',
        logo: company.logo || '',
        currency: company.settings?.currency || 'KES',
        taxRate: company.settings?.taxRate || 16,
        receiptFooter: company.settings?.receiptFooter || 'Thank you for shopping with us!',
        timezone: company.settings?.timezone || 'Africa/Nairobi',
        payment: company.settings?.payment || {
          mpesa: { enabled: true, businessShortCode: '', consumerKey: '', consumerSecret: '', passkey: '', callbackUrl: '', environment: 'sandbox' },
          cash: { enabled: true, requireApproval: false },
          card: { enabled: false, merchantId: '', apiKey: '' },
          bank: { enabled: false, accountName: '', accountNumber: '', bankName: '', branch: '' }
        },
        receipt: company.settings?.receipt || {
          businessName: company.name || '',
          businessAddress: company.address || '',
          businessPhone: company.phone || '',
          businessEmail: company.email || '',
          businessTaxPin: company.pin || '',
          showLogo: true,
          showBusinessName: true,
          showAddress: true,
          showPhone: true,
          showEmail: true,
          showTaxPin: true,
          showReceiptNumber: true,
          showSaleDate: true,
          showSaleTime: true,
          showAgentUser: true,
          showBuyerName: true,
          showBuyerPhone: true,
          showBuyerId: true,
          showNextOfKinName: false,
          showNextOfKinPhone: false,
          showItemsTable: true,
          showImei: true,
          showQuantity: true,
          showUnitPrice: true,
          showLineTotal: true,
          showGrossTotal: true,
          showVat: true,
          vatRate: 16,
          vatLabel: 'VAT',
          taxType: 'exclusive',
          showFooter: true,
          footerText: 'Thank you for shopping with us!'
        }
      });
      
      if (company.logo) {
        const logoUrl = company.logo.startsWith('http') ? company.logo : `${STATIC_URL}${company.logo}`;
        setReceiptLogoUrl(logoUrl);
        setReceiptLogo(true);
      }
    }
    setMessage({ type: '', text: '' });
  };

  const getLogoUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return `${STATIC_URL}${path}`;
  };

  const logoUrl = getLogoUrl(companySettings.logo);
  const canManageSettings = user?.companyRole === 'company_admin' || user?.role === 'super_admin';

  // ============================================
  // RECEIPT PREVIEW FUNCTION - UPDATED LAYOUT
  // ============================================
  const updateReceiptPreview = () => {
    const settings = companySettings.receipt || {};
    const date = new Date(sampleSale.createdAt);
    const formattedDate = date.toLocaleDateString('en-KE');
    const formattedTime = date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' });
    
    const vatRate = settings.vatRate || 16;
    const vatLabel = settings.vatLabel || 'VAT';
    const taxType = settings.taxType || 'exclusive';
    const showVat = settings.showVat !== undefined ? settings.showVat : true;
    
    const subtotal = sampleSale.subtotal || 300;
    let vatAmount, totalWithVat;
    
    if (taxType === 'inclusive') {
      vatAmount = subtotal - (subtotal / (1 + vatRate / 100));
      totalWithVat = subtotal;
    } else {
      vatAmount = subtotal * (vatRate / 100);
      totalWithVat = subtotal + vatAmount;
    }
    
    const previewEl = document.getElementById('receiptPreview');
    if (!previewEl) return;
    
    let html = '';
    
    // ============================================
    // HEADER SECTION - Centered
    // ============================================
    html += '<div class="receipt-header">';
    
    if (settings.showLogo && receiptLogo && receiptLogoUrl) {
      html += `<div class="receipt-logo"><img src="${receiptLogoUrl}" alt="Logo" /></div>`;
    }
    
    if (settings.showBusinessName && settings.businessName) {
      html += `<h3>${settings.businessName}</h3>`;
    }
    if (settings.showAddress && settings.businessAddress) {
      html += `<p>${settings.businessAddress}</p>`;
    }
    if (settings.showPhone && settings.businessPhone) {
      html += `<p>Tel: ${settings.businessPhone}</p>`;
    }
    if (settings.showEmail && settings.businessEmail) {
      html += `<p>Email: ${settings.businessEmail}</p>`;
    }
    if (settings.showTaxPin && settings.businessTaxPin) {
      html += `<p>PIN: ${settings.businessTaxPin}</p>`;
    }
    html += '</div>';
    
    html += '<hr />';
    
    // ============================================
    // INFO SECTION - Left/Right layout
    // ============================================
    html += '<div class="receipt-info-grid">';
    html += '<div class="info-left">';
    if (settings.showReceiptNumber) {
      html += `<div><span>Receipt No:</span> <strong>${sampleSale.invoiceNo}</strong></div>`;
    }
    if (settings.showAgentUser) {
      html += `<div><span>Cashier:</span> <strong>${sampleSale.cashier}</strong></div>`;
    }
    html += '</div>';
    html += '<div class="info-right">';
    if (settings.showSaleDate) {
      html += `<div><span>Date:</span> <strong>${formattedDate}</strong></div>`;
    }
    if (settings.showSaleTime) {
      html += `<div><span>Time:</span> <strong>${formattedTime}</strong></div>`;
    }
    html += '</div>';
    html += '</div>';
    
    html += '<hr />';
    
    // ============================================
    // CUSTOMER SECTION
    // ============================================
    if (settings.showBuyerName || settings.showBuyerPhone || settings.showBuyerId || 
        settings.showNextOfKinName || settings.showNextOfKinPhone) {
      html += '<div class="customer-section"><strong>Customer Details</strong>';
      if (settings.showBuyerName && sampleSale.customerName) {
        html += `<div><span>Name:</span> ${sampleSale.customerName}</div>`;
      }
      if (settings.showBuyerPhone && sampleSale.customerPhone) {
        html += `<div><span>Phone:</span> ${sampleSale.customerPhone}</div>`;
      }
      if (settings.showBuyerId && sampleSale.customerId) {
        html += `<div><span>ID:</span> ${sampleSale.customerId}</div>`;
      }
      if (settings.showNextOfKinName && sampleSale.nextOfKinName) {
        html += `<div><span>Next of Kin:</span> ${sampleSale.nextOfKinName}</div>`;
      }
      if (settings.showNextOfKinPhone && sampleSale.nextOfKinPhone) {
        html += `<div><span>Next of Kin Phone:</span> ${sampleSale.nextOfKinPhone}</div>`;
      }
      html += '</div>';
      html += '<hr />';
    }
    
    // ============================================
    // PRODUCT SECTION - Table with percentages
    // ============================================
    if (settings.showItemsTable) {
      html += '<table class="receipt-table">';
      html += '<thead><tr>';
      if (settings.showQuantity) html += '<th style="width:10%">Qty</th>';
      html += '<th style="width:40%">Description</th>';
      if (settings.showUnitPrice) html += '<th style="width:25%">Price</th>';
      if (settings.showLineTotal) html += '<th style="width:25%">Total</th>';
      html += '</tr></thead><tbody>';
      
      sampleSale.items.forEach(item => {
        html += '<tr>';
        if (settings.showQuantity) html += `<td>${item.quantity}</td>`;
        html += `<td>${item.productName}`;
        if (settings.showImei && item.sku) {
          html += `<br/><small style="font-size:10px;color:#666;">SKU: ${item.sku}</small>`;
        }
        html += `</td>`;
        if (settings.showUnitPrice) html += `<td>KES ${item.price.toFixed(2)}</td>`;
        if (settings.showLineTotal) html += `<td>KES ${item.subtotal.toFixed(2)}</td>`;
        html += '</tr>';
      });
      
      html += '</tbody>';
      
      // Totals
      html += '<tfoot>';
      html += `<tr><td colspan="${settings.showQuantity ? 2 : 1}" class="text-end">Subtotal:</td><td class="text-end">KES ${subtotal.toFixed(2)}</td></tr>`;
      
      // Discount placeholder
      html += `<tr><td colspan="${settings.showQuantity ? 2 : 1}" class="text-end">Discount:</td><td class="text-end">KES 0.00</td></tr>`;
      
      if (showVat) {
        html += `<tr class="vat-row"><td colspan="${settings.showQuantity ? 2 : 1}" class="text-end">${vatLabel} (${vatRate}%) ${taxType === 'inclusive' ? 'Incl.' : 'Excl.'}:</td><td class="text-end">KES ${vatAmount.toFixed(2)}</td></tr>`;
      }
      
      html += `<tr class="grand-total"><td colspan="${settings.showQuantity ? 2 : 1}" class="text-end"><strong>GRAND TOTAL:</strong></td><td class="text-end"><strong>KES ${totalWithVat.toFixed(2)}</strong></td></tr>`;
      html += '</tfoot>';
      
      html += '</table>';
    }
    
    html += '<hr />';
    
    // ============================================
    // FOOTER SECTION - QR Code placeholder
    // ============================================
    if (settings.showFooter) {
      html += '<div class="receipt-footer">';
      html += `<p>${settings.footerText || 'Thank you for shopping with us!'}</p>`;
      // QR Code placeholder
      html += `<div class="qr-code-placeholder">
        <svg width="60" height="60" viewBox="0 0 60 60">
          <rect width="60" height="60" fill="white"/>
          ${Array.from({length: 8}, (_, i) => 
            Array.from({length: 8}, (_, j) => 
              (i+j) % 2 === 0 ? `<rect x="${i*7+2}" y="${j*7+2}" width="5" height="5" fill="black"/>` : ''
            ).join('')
          ).join('')}
          <rect x="2" y="2" width="15" height="15" fill="black"/>
          <rect x="43" y="2" width="15" height="15" fill="black"/>
          <rect x="2" y="43" width="15" height="15" fill="black"/>
        </svg>
        <span>Scan to Verify</span>
      </div>`;
      html += '</div>';
    }
    
    previewEl.innerHTML = html;
  };

  useEffect(() => {
    if (activeTab === 'receipt') {
      setTimeout(updateReceiptPreview, 200);
    }
  }, [activeTab, companySettings.receipt, receiptLogo, receiptLogoUrl]);

  return (
    <MainLayout title="Settings" breadcrumbs={['Home', 'Settings']}>
      <div className="settings-page">
        {!canManageSettings ? (
          <div className="settings-unauthorized">
            <span>🔒</span>
            <h2>Unauthorized</h2>
            <p>You do not have permission to access settings.</p>
            <p className="settings-hint">Only Company Admin can manage settings.</p>
          </div>
        ) : (
          <>
            <div className="settings-header">
              <div>
                <h2>Company Settings</h2>
                <p>Manage your company profile and preferences</p>
              </div>
              <div className="settings-actions">
                {!isEditing ? (
                  <button className="btn-primary" onClick={() => setIsEditing(true)}>
                    ✏️ Edit Settings
                  </button>
                ) : (
                  <button className="btn-secondary" onClick={handleCancel}>
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {message.text && (
              <div className={`settings-message ${message.type}`}>
                {message.text}
              </div>
            )}

            <div className="settings-tabs">
              <button className={`tab-btn ${activeTab === 'general' ? 'active' : ''}`} onClick={() => setActiveTab('general')}>🏢 General</button>
              <button className={`tab-btn ${activeTab === 'branding' ? 'active' : ''}`} onClick={() => setActiveTab('branding')}>🎨 Branding</button>
              <button className={`tab-btn ${activeTab === 'payment' ? 'active' : ''}`} onClick={() => setActiveTab('payment')}>💳 Payment</button>
              <button className={`tab-btn ${activeTab === 'receipt' ? 'active' : ''}`} onClick={() => setActiveTab('receipt')}>🧾 Receipt</button>
              <button className={`tab-btn ${activeTab === 'preferences' ? 'active' : ''}`} onClick={() => setActiveTab('preferences')}>⚙️ Preferences</button>
            </div>

            {/* GENERAL TAB */}
            {activeTab === 'general' && (
              <form onSubmit={handleSubmit} className="settings-form">
                <div className="settings-card">
                  <h3>Company Information</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="name">Company Name *</label>
                      <input type="text" id="name" name="name" value={companySettings.name} onChange={handleInputChange} disabled={!isEditing} className={!isEditing ? 'disabled-input' : ''} placeholder="Enter company name" required />
                    </div>
                    <div className="form-group">
                      <label htmlFor="code">Company Code</label>
                      <input type="text" id="code" name="code" value={companySettings.code} disabled className="disabled-input" />
                      <span className="field-hint">Company code is auto-generated</span>
                    </div>
                    <div className="form-group">
                      <label htmlFor="email">Email Address</label>
                      <input type="email" id="email" name="email" value={companySettings.email} onChange={handleInputChange} disabled={!isEditing} className={!isEditing ? 'disabled-input' : ''} placeholder="Enter company email" />
                    </div>
                    <div className="form-group">
                      <label htmlFor="phone">Phone Number</label>
                      <input type="tel" id="phone" name="phone" value={companySettings.phone} onChange={handleInputChange} disabled={!isEditing} className={!isEditing ? 'disabled-input' : ''} placeholder="Enter company phone" />
                    </div>
                    <div className="form-group full-width">
                      <label htmlFor="address">Address</label>
                      <input type="text" id="address" name="address" value={companySettings.address} onChange={handleInputChange} disabled={!isEditing} className={!isEditing ? 'disabled-input' : ''} placeholder="Enter company address" />
                    </div>
                    <div className="form-group full-width">
                      <label htmlFor="description">Description</label>
                      <textarea id="description" name="description" value={companySettings.description} onChange={handleInputChange} disabled={!isEditing} className={!isEditing ? 'disabled-input' : ''} placeholder="Enter company description" rows="3" />
                    </div>
                  </div>
                  {isEditing && (
                    <div className="form-actions">
                      <button type="submit" className="btn-save" disabled={loading}>{loading ? <span className="spinner-small"></span> : '💾 Save Changes'}</button>
                      <button type="button" className="btn-cancel" onClick={handleCancel}>Cancel</button>
                    </div>
                  )}
                </div>
              </form>
            )}

            {/* BRANDING TAB */}
            {activeTab === 'branding' && (
              <div className="settings-card">
                <h3>Company Branding</h3>
                <div className="branding-section">
                  <div className="logo-section">
                    <label>Company Logo</label>
                    <div className="logo-preview">
                      {logoUrl ? (
                        <img src={logoUrl} alt="Company Logo" className="company-logo-preview" onError={(e) => { e.target.style.display = 'none'; }} onLoad={() => { console.log('Logo loaded successfully:', logoUrl); }} />
                      ) : (
                        <div className="logo-placeholder"><span>📷</span><p>No logo uploaded</p></div>
                      )}
                    </div>
                    <div className="logo-actions">
                      <button className="btn-upload-logo" onClick={() => logoInputRef.current?.click()} disabled={uploadingLogo}>{uploadingLogo ? <span className="spinner-small"></span> : '📤 Upload Logo'}</button>
                      {companySettings.logo && <button className="btn-remove-logo" onClick={handleRemoveLogo} disabled={uploadingLogo}>🗑️ Remove Logo</button>}
                      <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml" onChange={handleLogoUpload} style={{ display: 'none' }} />
                    </div>
                    <p className="logo-hint">Recommended: PNG or SVG, max 2MB, 200x200px</p>
                  </div>
                </div>
              </div>
            )}

            {/* PAYMENT TAB */}
            {activeTab === 'payment' && (
              <form onSubmit={handleSubmit} className="settings-form">
                <div className="settings-card">
                  <h3>Payment Settings</h3>
                  
                  <div className="payment-section">
                    <h4>📱 M-Pesa</h4>
                    <div className="form-grid-4">
                      <div className="form-group">
                        <label><input type="checkbox" name="payment.mpesa.enabled" checked={companySettings.payment?.mpesa?.enabled || false} onChange={handleInputChange} disabled={!isEditing} /> Enable M-Pesa</label>
                      </div>
                      <div className="form-group">
                        <label htmlFor="payment.mpesa.environment">Environment</label>
                        <select id="payment.mpesa.environment" name="payment.mpesa.environment" value={companySettings.payment?.mpesa?.environment || 'sandbox'} onChange={handleInputChange} disabled={!isEditing}>
                          <option value="sandbox">Sandbox (Test)</option>
                          <option value="production">Production (Live)</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label htmlFor="payment.mpesa.businessShortCode">Business Short Code</label>
                        <input type="text" id="payment.mpesa.businessShortCode" name="payment.mpesa.businessShortCode" value={companySettings.payment?.mpesa?.businessShortCode || ''} onChange={handleInputChange} disabled={!isEditing} placeholder="e.g., 174379" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="payment.mpesa.consumerKey">Consumer Key</label>
                        <input type="text" id="payment.mpesa.consumerKey" name="payment.mpesa.consumerKey" value={companySettings.payment?.mpesa?.consumerKey || ''} onChange={handleInputChange} disabled={!isEditing} placeholder="Enter consumer key" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="payment.mpesa.consumerSecret">Consumer Secret</label>
                        <input type="password" id="payment.mpesa.consumerSecret" name="payment.mpesa.consumerSecret" value={companySettings.payment?.mpesa?.consumerSecret || ''} onChange={handleInputChange} disabled={!isEditing} placeholder="Enter consumer secret" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="payment.mpesa.passkey">Passkey</label>
                        <input type="password" id="payment.mpesa.passkey" name="payment.mpesa.passkey" value={companySettings.payment?.mpesa?.passkey || ''} onChange={handleInputChange} disabled={!isEditing} placeholder="Enter passkey" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="payment.mpesa.callbackUrl">Callback URL</label>
                        <input type="url" id="payment.mpesa.callbackUrl" name="payment.mpesa.callbackUrl" value={companySettings.payment?.mpesa?.callbackUrl || ''} onChange={handleInputChange} disabled={!isEditing} placeholder="https://yourdomain.com/api/mpesa/callback" />
                      </div>
                    </div>
                  </div>

                  <div className="payment-section">
                    <h4>💵 Cash</h4>
                    <div className="form-grid-4">
                      <div className="form-group">
                        <label><input type="checkbox" name="payment.cash.enabled" checked={companySettings.payment?.cash?.enabled || false} onChange={handleInputChange} disabled={!isEditing} /> Enable Cash</label>
                      </div>
                      <div className="form-group">
                        <label><input type="checkbox" name="payment.cash.requireApproval" checked={companySettings.payment?.cash?.requireApproval || false} onChange={handleInputChange} disabled={!isEditing} /> Require Manager Approval</label>
                      </div>
                    </div>
                  </div>

                  <div className="payment-section">
                    <h4>💳 Card</h4>
                    <div className="form-grid-4">
                      <div className="form-group">
                        <label><input type="checkbox" name="payment.card.enabled" checked={companySettings.payment?.card?.enabled || false} onChange={handleInputChange} disabled={!isEditing} /> Enable Card</label>
                      </div>
                      <div className="form-group">
                        <label htmlFor="payment.card.merchantId">Merchant ID</label>
                        <input type="text" id="payment.card.merchantId" name="payment.card.merchantId" value={companySettings.payment?.card?.merchantId || ''} onChange={handleInputChange} disabled={!isEditing} placeholder="Enter merchant ID" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="payment.card.apiKey">API Key</label>
                        <input type="password" id="payment.card.apiKey" name="payment.card.apiKey" value={companySettings.payment?.card?.apiKey || ''} onChange={handleInputChange} disabled={!isEditing} placeholder="Enter API key" />
                      </div>
                    </div>
                  </div>

                  <div className="payment-section">
                    <h4>🏦 Bank Transfer</h4>
                    <div className="form-grid-4">
                      <div className="form-group">
                        <label><input type="checkbox" name="payment.bank.enabled" checked={companySettings.payment?.bank?.enabled || false} onChange={handleInputChange} disabled={!isEditing} /> Enable Bank Transfer</label>
                      </div>
                      <div className="form-group">
                        <label htmlFor="payment.bank.bankName">Bank Name</label>
                        <input type="text" id="payment.bank.bankName" name="payment.bank.bankName" value={companySettings.payment?.bank?.bankName || ''} onChange={handleInputChange} disabled={!isEditing} placeholder="Enter bank name" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="payment.bank.accountName">Account Name</label>
                        <input type="text" id="payment.bank.accountName" name="payment.bank.accountName" value={companySettings.payment?.bank?.accountName || ''} onChange={handleInputChange} disabled={!isEditing} placeholder="Enter account name" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="payment.bank.accountNumber">Account Number</label>
                        <input type="text" id="payment.bank.accountNumber" name="payment.bank.accountNumber" value={companySettings.payment?.bank?.accountNumber || ''} onChange={handleInputChange} disabled={!isEditing} placeholder="Enter account number" />
                      </div>
                      <div className="form-group">
                        <label htmlFor="payment.bank.branch">Branch</label>
                        <input type="text" id="payment.bank.branch" name="payment.bank.branch" value={companySettings.payment?.bank?.branch || ''} onChange={handleInputChange} disabled={!isEditing} placeholder="Enter branch" />
                      </div>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="form-actions">
                      <button type="submit" className="btn-save" disabled={loading}>{loading ? <span className="spinner-small"></span> : '💾 Save Payment Settings'}</button>
                      <button type="button" className="btn-cancel" onClick={handleCancel}>Cancel</button>
                    </div>
                  )}
                </div>
              </form>
            )}

            {/* RECEIPT TAB */}
            {activeTab === 'receipt' && (
              <div className="receipt-settings-container">
                <div className="settings-card receipt-settings-form">
                  <h3>🧾 Receipt Settings</h3>
                  <p className="settings-subtitle">Customize what appears on printed sales receipts</p>
                  
                  <div className="receipt-settings-layout">
                    <div className="receipt-settings-left">
                      <form onSubmit={handleSubmit} className="settings-form">
                        <div className="form-section">
                          <h4>🏢 Business Details</h4>
                          <div className="form-grid">
                            <div className="form-group full-width">
                              <label>Business Name</label>
                              <input type="text" name="receipt.businessName" value={companySettings.receipt?.businessName || ''} onChange={handleInputChange} disabled={!isEditing} placeholder="Enter business name" />
                            </div>
                            <div className="form-group full-width">
                              <label>Address</label>
                              <textarea name="receipt.businessAddress" value={companySettings.receipt?.businessAddress || ''} onChange={handleInputChange} disabled={!isEditing} placeholder="Enter business address" rows="2" />
                            </div>
                            <div className="form-group">
                              <label>Phone</label>
                              <input type="text" name="receipt.businessPhone" value={companySettings.receipt?.businessPhone || ''} onChange={handleInputChange} disabled={!isEditing} placeholder="Enter phone" />
                            </div>
                            <div className="form-group">
                              <label>Email</label>
                              <input type="email" name="receipt.businessEmail" value={companySettings.receipt?.businessEmail || ''} onChange={handleInputChange} disabled={!isEditing} placeholder="Enter email" />
                            </div>
                            <div className="form-group">
                              <label>Tax PIN</label>
                              <input type="text" name="receipt.businessTaxPin" value={companySettings.receipt?.businessTaxPin || ''} onChange={handleInputChange} disabled={!isEditing} placeholder="Enter tax PIN" />
                            </div>
                          </div>
                        </div>

                        <div className="form-section">
                          <h4>📋 Business Header</h4>
                          <div className="checkbox-grid">
                            <label><input type="checkbox" name="receipt.showBusinessName" checked={companySettings.receipt?.showBusinessName !== undefined ? companySettings.receipt.showBusinessName : true} onChange={handleInputChange} disabled={!isEditing} /> Show Business Name</label>
                            <label><input type="checkbox" name="receipt.showAddress" checked={companySettings.receipt?.showAddress !== undefined ? companySettings.receipt.showAddress : true} onChange={handleInputChange} disabled={!isEditing} /> Show Address</label>
                            <label><input type="checkbox" name="receipt.showPhone" checked={companySettings.receipt?.showPhone !== undefined ? companySettings.receipt.showPhone : true} onChange={handleInputChange} disabled={!isEditing} /> Show Phone</label>
                            <label><input type="checkbox" name="receipt.showEmail" checked={companySettings.receipt?.showEmail !== undefined ? companySettings.receipt.showEmail : true} onChange={handleInputChange} disabled={!isEditing} /> Show Email</label>
                            <label><input type="checkbox" name="receipt.showTaxPin" checked={companySettings.receipt?.showTaxPin !== undefined ? companySettings.receipt.showTaxPin : true} onChange={handleInputChange} disabled={!isEditing} /> Show Tax PIN</label>
                          </div>
                        </div>

                        <div className="form-section">
                          <h4>📄 Receipt Details</h4>
                          <div className="checkbox-grid">
                            <label><input type="checkbox" name="receipt.showReceiptNumber" checked={companySettings.receipt?.showReceiptNumber !== undefined ? companySettings.receipt.showReceiptNumber : true} onChange={handleInputChange} disabled={!isEditing} /> Show Receipt Number</label>
                            <label><input type="checkbox" name="receipt.showSaleDate" checked={companySettings.receipt?.showSaleDate !== undefined ? companySettings.receipt.showSaleDate : true} onChange={handleInputChange} disabled={!isEditing} /> Show Sale Date</label>
                            <label><input type="checkbox" name="receipt.showSaleTime" checked={companySettings.receipt?.showSaleTime !== undefined ? companySettings.receipt.showSaleTime : true} onChange={handleInputChange} disabled={!isEditing} /> Show Sale Time</label>
                            <label><input type="checkbox" name="receipt.showAgentUser" checked={companySettings.receipt?.showAgentUser !== undefined ? companySettings.receipt.showAgentUser : true} onChange={handleInputChange} disabled={!isEditing} /> Show Agent/User</label>
                          </div>
                        </div>

                        <div className="form-section">
                          <h4>👤 Buyer Information</h4>
                          <div className="checkbox-grid">
                            <label><input type="checkbox" name="receipt.showBuyerName" checked={companySettings.receipt?.showBuyerName !== undefined ? companySettings.receipt.showBuyerName : true} onChange={handleInputChange} disabled={!isEditing} /> Show Buyer Name</label>
                            <label><input type="checkbox" name="receipt.showBuyerPhone" checked={companySettings.receipt?.showBuyerPhone !== undefined ? companySettings.receipt.showBuyerPhone : true} onChange={handleInputChange} disabled={!isEditing} /> Show Buyer Phone</label>
                            <label><input type="checkbox" name="receipt.showBuyerId" checked={companySettings.receipt?.showBuyerId !== undefined ? companySettings.receipt.showBuyerId : true} onChange={handleInputChange} disabled={!isEditing} /> Show Buyer ID</label>
                            <label><input type="checkbox" name="receipt.showNextOfKinName" checked={companySettings.receipt?.showNextOfKinName || false} onChange={handleInputChange} disabled={!isEditing} /> Show Next of Kin Name</label>
                            <label><input type="checkbox" name="receipt.showNextOfKinPhone" checked={companySettings.receipt?.showNextOfKinPhone || false} onChange={handleInputChange} disabled={!isEditing} /> Show Next of Kin Phone</label>
                          </div>
                        </div>

                        <div className="form-section">
                          <h4>📦 Line Items</h4>
                          <div className="checkbox-grid">
                            <label><input type="checkbox" name="receipt.showItemsTable" checked={companySettings.receipt?.showItemsTable !== undefined ? companySettings.receipt.showItemsTable : true} onChange={handleInputChange} disabled={!isEditing} /> Show Items Table</label>
                            <label><input type="checkbox" name="receipt.showImei" checked={companySettings.receipt?.showImei !== undefined ? companySettings.receipt.showImei : true} onChange={handleInputChange} disabled={!isEditing} /> Show IMEI/Serial</label>
                            <label><input type="checkbox" name="receipt.showQuantity" checked={companySettings.receipt?.showQuantity !== undefined ? companySettings.receipt.showQuantity : true} onChange={handleInputChange} disabled={!isEditing} /> Show Quantity</label>
                            <label><input type="checkbox" name="receipt.showUnitPrice" checked={companySettings.receipt?.showUnitPrice !== undefined ? companySettings.receipt.showUnitPrice : true} onChange={handleInputChange} disabled={!isEditing} /> Show Unit Price</label>
                            <label><input type="checkbox" name="receipt.showLineTotal" checked={companySettings.receipt?.showLineTotal !== undefined ? companySettings.receipt.showLineTotal : true} onChange={handleInputChange} disabled={!isEditing} /> Show Line Total</label>
                            <label><input type="checkbox" name="receipt.showGrossTotal" checked={companySettings.receipt?.showGrossTotal !== undefined ? companySettings.receipt.showGrossTotal : true} onChange={handleInputChange} disabled={!isEditing} /> Show Gross Total</label>
                          </div>
                        </div>

                        <div className="form-section">
                          <h4>💰 VAT / Tax Settings</h4>
                          <div className="form-grid">
                            <div className="form-group">
                              <label><input type="checkbox" name="receipt.showVat" checked={companySettings.receipt?.showVat !== undefined ? companySettings.receipt.showVat : true} onChange={handleInputChange} disabled={!isEditing} /> Show VAT / Tax</label>
                            </div>
                            <div className="form-group">
                              <label>VAT Rate (%)</label>
                              <input type="number" name="receipt.vatRate" value={companySettings.receipt?.vatRate || 16} onChange={handleInputChange} disabled={!isEditing} placeholder="16" min="0" max="100" step="0.01" />
                            </div>
                            <div className="form-group">
                              <label>VAT Label</label>
                              <input type="text" name="receipt.vatLabel" value={companySettings.receipt?.vatLabel || 'VAT'} onChange={handleInputChange} disabled={!isEditing} placeholder="VAT" />
                            </div>
                            <div className="form-group">
                              <label>Tax Type</label>
                              <select name="receipt.taxType" value={companySettings.receipt?.taxType || 'exclusive'} onChange={handleInputChange} disabled={!isEditing}>
                                <option value="exclusive">Before Tax (Exclusive)</option>
                                <option value="inclusive">After Tax (Inclusive)</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="form-section">
                          <h4>📝 Footer</h4>
                          <div className="form-grid">
                            <div className="form-group">
                              <label><input type="checkbox" name="receipt.showFooter" checked={companySettings.receipt?.showFooter !== undefined ? companySettings.receipt.showFooter : true} onChange={handleInputChange} disabled={!isEditing} /> Show Footer</label>
                            </div>
                            <div className="form-group full-width">
                              <label>Footer Text</label>
                              <textarea name="receipt.footerText" value={companySettings.receipt?.footerText || 'Thank you for shopping with us!'} onChange={handleInputChange} disabled={!isEditing} placeholder="Thank you for shopping with us!" rows="2" />
                            </div>
                          </div>
                        </div>

                        {isEditing && (
                          <div className="form-actions">
                            <button type="submit" className="btn-save" disabled={loading}>{loading ? <span className="spinner-small"></span> : '💾 Save Receipt Settings'}</button>
                            <button type="button" className="btn-cancel" onClick={handleCancel}>Cancel</button>
                          </div>
                        )}
                      </form>
                    </div>

                    <div className="receipt-settings-right">
                      <div className="receipt-preview-container">
                        <div className="preview-header">
                          <h4>👁️ Receipt Preview</h4>
                          <p className="preview-subtitle">Live preview of your receipt</p>
                        </div>
                        <div className="receipt-preview-wrapper" id="receiptPreview">
                          <div className="receipt-preview-loading">Loading preview...</div>
                        </div>
                        <div className="preview-info">
                          <small>💡 This is a live preview - settings update in real-time</small>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PREFERENCES TAB */}
            {activeTab === 'preferences' && (
              <form onSubmit={handleSubmit} className="settings-form">
                <div className="settings-card">
                  <h3>System Preferences</h3>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="currency">Currency</label>
                      <select id="currency" name="currency" value={companySettings.currency} onChange={handleInputChange} disabled={!isEditing} className={!isEditing ? 'disabled-input' : ''}>
                        <option value="KES">KES - Kenyan Shilling</option>
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="UGX">UGX - Ugandan Shilling</option>
                        <option value="TZS">TZS - Tanzanian Shilling</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor="taxRate">Tax Rate (%)</label>
                      <input type="number" id="taxRate" name="taxRate" value={companySettings.taxRate} onChange={handleInputChange} disabled={!isEditing} className={!isEditing ? 'disabled-input' : ''} placeholder="Enter tax rate" min="0" max="100" />
                    </div>
                    <div className="form-group">
                      <label htmlFor="timezone">Timezone</label>
                      <select id="timezone" name="timezone" value={companySettings.timezone} onChange={handleInputChange} disabled={!isEditing} className={!isEditing ? 'disabled-input' : ''}>
                        <option value="Africa/Nairobi">Nairobi (EAT)</option>
                        <option value="Africa/Kampala">Kampala (EAT)</option>
                        <option value="Africa/Dar_es_Salaam">Dar es Salaam (EAT)</option>
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">New York (EST)</option>
                        <option value="Europe/London">London (GMT)</option>
                      </select>
                    </div>
                  </div>
                  {isEditing && (
                    <div className="form-actions">
                      <button type="submit" className="btn-save" disabled={loading}>{loading ? <span className="spinner-small"></span> : '💾 Save Preferences'}</button>
                      <button type="button" className="btn-cancel" onClick={handleCancel}>Cancel</button>
                    </div>
                  )}
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Settings;