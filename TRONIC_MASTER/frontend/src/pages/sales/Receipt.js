// /home/kk/RS/TRONIC_MASTER/frontend/src/pages/sales/Receipt.js

import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import './Receipt.css';

const Receipt = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { sale, fromPOS } = location.state || {};

  const [loading, setLoading] = useState(true);
  const [companyDetails, setCompanyDetails] = useState(null);
  const [branchDetails, setBranchDetails] = useState(null);
  const [receiptData, setReceiptData] = useState(null);
  const receiptRef = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
  const STATIC_URL = process.env.REACT_APP_STATIC_URL || 'http://localhost:5002';

  useEffect(() => {
    if (!sale) {
      navigate('/sales');
      return;
    }

    fetchCompanyDetails();
    fetchBranchDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sale]);

  // ✅ Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // Enter key to go back
      if (e.key === 'Enter' && !e.shiftKey) {
        const activeElement = document.activeElement;
        if (activeElement && 
            activeElement.tagName !== 'INPUT' && 
            activeElement.tagName !== 'TEXTAREA' &&
            activeElement.tagName !== 'SELECT') {
          e.preventDefault();
          handleClose();
        }
      }
      
      // Escape key to go back
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const fetchBranchDetails = async () => {
    try {
      if (!sale?.branch) return;
      const token = localStorage.getItem('token');
      const branchId = sale.branch._id || sale.branch;
      const response = await fetch(`${API_URL}/branches/${branchId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) setBranchDetails(data.data);
    } catch (error) {
      console.error('Error fetching branch details:', error);
    }
  };

  const buildReceiptData = () => {
    if (!sale) return;

    const company = companyDetails || user?.company || {};
    const branch = branchDetails || sale?.branch || {};

    const receiptInfo = {
      company: {
        name: company.name || 'TRONIC MASTER',
        address: company.address || 'Nairobi, Kenya',
        phone: company.phone || '+254 700 000 000',
        email: company.email || 'info@tronicmaster.com',
        pin: company.pin || 'A000000000A',
        logo: company.logo || null,
        tagline: company.tagline || 'Quality Electronics & Gadgets'
      },
      branch: {
        name: branch.name || 'Main Branch',
        currencySymbol: branch.currencySymbol || 'KSh'
      },
      sale: {
        number: sale.saleNumber || sale.receiptNumber || 'N/A',
        date: sale.createdAt ? new Date(sale.createdAt) : new Date(),
        customer: sale.customer || { name: 'Walk-in Customer' },
        items: sale.items || [],
        subtotal: sale.subtotal || 0,
        discount: sale.discount || { amount: 0 },
        total: sale.total || 0,
        payment: sale.payment || { method: 'cash', amount: 0, change: 0 },
        createdBy: sale.createdBy || user?._id
      }
    };

    setReceiptData(receiptInfo);
    setLoading(false);
  };

  // ✅ Call buildReceiptData when company and branch details are loaded
  useEffect(() => {
    if (companyDetails !== null || branchDetails !== null) {
      buildReceiptData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyDetails, branchDetails]);

  const getLogoUrl = (logoPath) => {
    if (!logoPath) return null;
    if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
      return logoPath;
    }
    return `${STATIC_URL}${logoPath}`;
  };

  const formatCurrency = (amount) => {
    if (!amount) return '0.00';
    const symbol = receiptData?.branch?.currencySymbol || 'KSh';
    return `${symbol} ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return date.toLocaleString('en-KE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePrint = () => window.print();
  
  const handleClose = () => {
    navigate(fromPOS ? '/pos' : '/sales');
  };

  if (loading) {
    return (
      <MainLayout title="Receipt" breadcrumbs={['Home', 'Sales', 'Receipt']}>
        <div className="receipt-loading">
          <div className="spinner"></div>
          <p>Loading receipt...</p>
        </div>
      </MainLayout>
    );
  }

  if (!receiptData) {
    return (
      <MainLayout title="Receipt" breadcrumbs={['Home', 'Sales', 'Receipt']}>
        <div className="receipt-error">
          <h2>❌ Receipt Not Found</h2>
          <p>No sale data available for this receipt.</p>
          <button className="btn-primary" onClick={() => navigate('/sales')}>
            Back to Sales
          </button>
        </div>
      </MainLayout>
    );
  }

  const { company, sale: saleInfo } = receiptData;
  const logoUrl = getLogoUrl(company.logo);
  const discountAmount = saleInfo.discount?.amount || 0;

  const getServedByName = () => {
    if (user?.name) return user.name;
    return 'System';
  };

  const qrData = JSON.stringify({
    receipt: saleInfo.number,
    amount: saleInfo.total,
    date: saleInfo.date.toISOString()
  });

  return (
    <MainLayout title="Sales Receipt" breadcrumbs={['Home', 'Sales', 'Receipt']}>
      <div className="receipt-page">
        
        {/* Action Buttons */}
        <div className="receipt-actions no-print">
          <div className="actions-left">
            <button className="btn-back" onClick={handleClose}>
              ← Back <span className="shortcut-hint">(Enter)</span>
            </button>
          </div>
          <div className="actions-right">
            <button className="btn-print" onClick={handlePrint}>
              🖨️ Print <span className="shortcut-hint">(Ctrl+P)</span>
            </button>
          </div>
        </div>

        {/* Receipt Content */}
        <div className="receipt-wrapper" ref={receiptRef}>
          <div className="receipt-content">
            
            {/* ========== COMPANY HEADER ========== */}
            <div className="receipt-header">
              {logoUrl && (
                <div className="receipt-logo">
                  <img src={logoUrl} alt={company.name} />
                </div>
              )}
              <h1 className="receipt-company">{company.name}</h1>
              <div className="receipt-details">
                <p>{company.address}</p>
                <p>📞 {company.phone}</p>
                <p>✉️ {company.email}</p>
                <p>PIN: {company.pin}</p>
              </div>
            </div>

            <div className="receipt-divider">********************************************************</div>

            {/* ========== RECEIPT INFO ========== */}
            <div className="receipt-info">
              <div className="receipt-row">
                <span>Receipt #</span>
                <span className="receipt-number">{saleInfo.number}</span>
              </div>
              <div className="receipt-row">
                <span>Date & Time</span>
                <span>{formatDate(saleInfo.date)}</span>
              </div>
            </div>

            <div className="receipt-divider">********************************************************</div>

            {/* ========== PRODUCTS TABLE ========== */}
            <div className="receipt-items">
              <div className="receipt-items-header">
                <span>Item</span>
                <span>Qty</span>
                <span>Price</span>
                <span>Total</span>
              </div>
              {saleInfo.items.map((item, index) => (
                <div key={index} className="receipt-item">
                  <span>{item.productName}</span>
                  <span>{item.quantity}</span>
                  <span>{formatCurrency(item.unitPrice)}</span>
                  <span>{formatCurrency(item.totalPrice)}</span>
                </div>
              ))}
            </div>

            <div className="receipt-divider">********************************************************</div>

            {/* ========== PAYMENT SUMMARY ========== */}
            <div className="receipt-payment">
              <div className="receipt-total">
                <span>Subtotal</span>
                <span>{formatCurrency(saleInfo.subtotal)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="receipt-total discount">
                  <span>Discount</span>
                  <span>- {formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="receipt-total grand">
                <span><strong>TOTAL</strong></span>
                <span><strong>{formatCurrency(saleInfo.total)}</strong></span>
              </div>
              <div className="receipt-total">
                <span>Amount Paid</span>
                <span>{formatCurrency(saleInfo.payment.amount)}</span>
              </div>
              {saleInfo.payment.change > 0 && (
                <div className="receipt-total change">
                  <span>Change</span>
                  <span>{formatCurrency(saleInfo.payment.change)}</span>
                </div>
              )}
            </div>

            <div className="receipt-divider">********************************************************</div>

            {/* ========== SERVED BY ========== */}
            <div className="receipt-served">
              <div className="receipt-row">
                <span>Served By</span>
                <span className="served-name">{getServedByName()}</span>
              </div>
            </div>

            <div className="receipt-divider">********************************************************</div>

            {/* ========== QR & BARCODE ========== */}
            <div className="receipt-qr">
              <div className="receipt-qr-box">
                <QRCodeSVG 
                  value={qrData} 
                  size={70}
                  level="H"
                  includeMargin={true}
                  bgColor="#ffffff"
                  fgColor="#1a1a2e"
                />
                <span>Verify</span>
              </div>
              <div className="receipt-barcode-box">
                <Barcode 
                  value={saleInfo.number || '000000'} 
                  width={1.2}
                  height={35}
                  fontSize={9}
                  background="#ffffff"
                  lineColor="#1a1a2e"
                />
                <span>#{saleInfo.number}</span>
              </div>
            </div>

            <div className="receipt-divider">********************************************************</div>

            {/* ========== FOOTER ========== */}
            <div className="receipt-footer">
              <p className="receipt-thanks">THANK YOU FOR YOUR BUSINESS!</p>
              <p className="receipt-tagline">{company.tagline}</p>
              <div className="receipt-meta">
                <span>TRONIC_MASTER</span>
                <span>•</span>
                <span>{new Date().getFullYear()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Receipt;