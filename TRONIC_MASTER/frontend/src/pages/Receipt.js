import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import './Receipt.css';

const Receipt = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [receiptData, setReceiptData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

  // ============================================
  // BUILD RECEIPT DATA
  // ============================================
  const buildReceiptData = (saleData) => {
    // ✅ TANGAZA VARIABLES KABLA
    const sale = saleData || {};
    const branch = sale?.branch || {};
    const company = sale?.company || {};
    const customer = sale?.customer || { name: 'Walk-in Customer' };
    const items = sale?.items || [];
    const payment = sale?.payment || { method: 'cash', amount: 0 };

    // Sasa zinaweza kutumika safely
    return {
      saleNumber: sale.saleNumber || 'N/A',
      date: sale.createdAt ? new Date(sale.createdAt) : new Date(),
      customerName: customer.name || 'Walk-in Customer',
      customerPhone: customer.phone || '',
      customerEmail: customer.email || '',
      items: items.map(item => ({
        name: item.productName || 'Unknown Product',
        quantity: item.quantity || 1,
        price: item.unitPrice || 0,
        total: item.totalPrice || 0,
        unitIdentifiers: item.unitIdentifiers || []
      })),
      subtotal: sale.subtotal || 0,
      discount: sale.discount?.amount || 0,
      total: sale.total || 0,
      paymentMethod: payment.method || 'cash',
      paymentAmount: payment.amount || 0,
      change: payment.change || 0,
      branchName: branch.name || 'N/A',
      branchAddress: branch.address || '',
      branchPhone: branch.phone || '',
      branchEmail: branch.email || '',
      branchCurrency: branch.currencySymbol || 'KSh',
      companyName: company.name || 'TRONIC MASTER',
      companyTagline: company.tagline || 'Electronics & Gadgets Store',
      servedBy: sale.servedBy?.name || 'System',
      transactionId: sale._id || 'N/A'
    };
  };

  // ============================================
  // FETCH BRANCH DETAILS
  // ============================================
  const fetchBranchDetails = async (branchId) => {
    if (!branchId) return null;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/branches/${branchId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        return data.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching branch details:', error);
      return null;
    }
  };

  // ============================================
  // FETCH COMPANY DETAILS
  // ============================================
  const fetchCompanyDetails = async (companyId) => {
    if (!companyId) return null;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/companies/${companyId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        return data.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching company details:', error);
      return null;
    }
  };

  useEffect(() => {
    const loadReceipt = async () => {
      try {
        setLoading(true);
        const sale = location.state?.sale;

        if (!sale) {
          navigate('/sales');
          return;
        }

        // Fetch branch and company details if needed
        let enhancedSale = { ...sale };
        
        if (sale.branch?._id && !sale.branch.name) {
          const branchData = await fetchBranchDetails(sale.branch._id);
          if (branchData) {
            enhancedSale.branch = { ...enhancedSale.branch, ...branchData };
          }
        }

        if (sale.company?._id && !sale.company.name) {
          const companyData = await fetchCompanyDetails(sale.company._id);
          if (companyData) {
            enhancedSale.company = { ...enhancedSale.company, ...companyData };
          }
        }

        const data = buildReceiptData(enhancedSale);
        setReceiptData(data);
        setError(null);
      } catch (err) {
        console.error('Error loading receipt:', err);
        setError('Failed to load receipt data');
      } finally {
        setLoading(false);
      }
    };

    loadReceipt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state, navigate]);

  // ============================================
  // HANDLE PRINT
  // ============================================
  const handlePrint = () => {
    window.print();
  };

  // ============================================
  // HANDLE CLOSE
  // ============================================
  const handleClose = () => {
    navigate(-1);
  };

  // ============================================
  // FORMAT CURRENCY
  // ============================================
  const formatCurrency = (amount, currencySymbol = 'KSh') => {
    if (amount === undefined || amount === null) return `${currencySymbol} 0`;
    return `${currencySymbol} ${Number(amount).toLocaleString()}`;
  };

  // ============================================
  // FORMAT DATE
  // ============================================
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <MainLayout title="Receipt" breadcrumbs={['Home', 'Sales', 'Receipt']}>
        <div className="receipt-page">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading receipt...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (error) {
    return (
      <MainLayout title="Receipt" breadcrumbs={['Home', 'Sales', 'Receipt']}>
        <div className="receipt-page">
          <div className="error-state">
            <p>⚠️ {error}</p>
            <button onClick={handleClose}>Go Back</button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // ============================================
  // NO DATA STATE
  // ============================================
  if (!receiptData) {
    return (
      <MainLayout title="Receipt" breadcrumbs={['Home', 'Sales', 'Receipt']}>
        <div className="receipt-page">
          <div className="empty-state">
            <p>No receipt data available</p>
            <button onClick={handleClose}>Go Back</button>
          </div>
        </div>
      </MainLayout>
    );
  }

  // ============================================
  // RENDER RECEIPT
  // ============================================
  return (
    <MainLayout title="Receipt" breadcrumbs={['Home', 'Sales', 'Receipt']}>
      <div className="receipt-page">
        <div className="receipt-actions">
          <button className="btn-print" onClick={handlePrint}>
            🖨️ Print Receipt
          </button>
          <button className="btn-close" onClick={handleClose}>
            ✕ Close
          </button>
        </div>

        <div className="receipt-container" id="receipt-content">
          {/* Header */}
          <div className="receipt-header">
            <h2 className="company-name">{receiptData.companyName}</h2>
            <p className="company-tagline">{receiptData.companyTagline}</p>
            <div className="branch-info">
              <p className="branch-name">{receiptData.branchName}</p>
              {receiptData.branchAddress && <p>{receiptData.branchAddress}</p>}
              {receiptData.branchPhone && <p>Tel: {receiptData.branchPhone}</p>}
              {receiptData.branchEmail && <p>Email: {receiptData.branchEmail}</p>}
            </div>
            <div className="divider">─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─</div>
          </div>

          {/* Receipt Info */}
          <div className="receipt-info">
            <div className="info-row">
              <span className="label">Receipt #</span>
              <span className="value">{receiptData.saleNumber}</span>
            </div>
            <div className="info-row">
              <span className="label">Date</span>
              <span className="value">{formatDate(receiptData.date)}</span>
            </div>
            <div className="info-row">
              <span className="label">Customer</span>
              <span className="value">{receiptData.customerName}</span>
            </div>
            {receiptData.customerPhone && (
              <div className="info-row">
                <span className="label">Phone</span>
                <span className="value">{receiptData.customerPhone}</span>
              </div>
            )}
            <div className="divider">─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─</div>
          </div>

          {/* Items */}
          <div className="receipt-items">
            <div className="items-header">
              <span className="col-item">Item</span>
              <span className="col-qty">Qty</span>
              <span className="col-price">Price</span>
              <span className="col-total">Total</span>
            </div>
            {receiptData.items.map((item, index) => (
              <div key={index} className="item-row">
                <span className="col-item">{item.name}</span>
                <span className="col-qty">{item.quantity}</span>
                <span className="col-price">{formatCurrency(item.price, receiptData.branchCurrency)}</span>
                <span className="col-total">{formatCurrency(item.total, receiptData.branchCurrency)}</span>
              </div>
            ))}
            <div className="divider">─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─</div>
          </div>

          {/* Totals */}
          <div className="receipt-totals">
            <div className="total-row">
              <span>Subtotal</span>
              <span>{formatCurrency(receiptData.subtotal, receiptData.branchCurrency)}</span>
            </div>
            {receiptData.discount > 0 && (
              <div className="total-row discount">
                <span>Discount</span>
                <span>- {formatCurrency(receiptData.discount, receiptData.branchCurrency)}</span>
              </div>
            )}
            <div className="total-row grand-total">
              <span><strong>Total</strong></span>
              <span><strong>{formatCurrency(receiptData.total, receiptData.branchCurrency)}</strong></span>
            </div>
            <div className="total-row">
              <span>Payment Method</span>
              <span>{receiptData.paymentMethod.toUpperCase()}</span>
            </div>
            <div className="total-row">
              <span>Amount Paid</span>
              <span>{formatCurrency(receiptData.paymentAmount, receiptData.branchCurrency)}</span>
            </div>
            {receiptData.change > 0 && (
              <div className="total-row change">
                <span>Change</span>
                <span>{formatCurrency(receiptData.change, receiptData.branchCurrency)}</span>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="receipt-footer">
            <div className="divider">─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─</div>
            <p className="served-by">Served By: {receiptData.servedBy}</p>
            <p className="transaction-id">Transaction ID: {receiptData.transactionId}</p>
            <div className="divider">─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─</div>
            <p className="thankyou">Thank you for shopping with us!</p>
            <p className="tagline">Quality Electronics & Gadgets</p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Receipt;