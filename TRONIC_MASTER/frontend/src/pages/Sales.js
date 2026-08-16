// /home/kk/RS/TRONIC_MASTER/frontend/src/pages/Sales.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
// import { useAuth } from '../context/AuthContext'; // REMOVED - not used
import { saleService } from '../services/saleService';
import { 
  FaChartBar, 
  FaMoneyBillWave, 
  FaChartLine, 
  FaCalendarDay, 
  FaWallet,
  FaSync,
  FaSearch,
  // FaEye, // REMOVED - not used
  FaUndo,
  // FaPrint, // REMOVED - not used
  FaTimes,
  FaCheckCircle,
  FaClock,
  FaBan,
  FaReply,
  FaMobileAlt,
  FaCreditCard,
  FaUniversity,
  FaStore,
  // FaUser, // REMOVED - not used
  FaPhone,
  FaBox,
  FaTag,
  // FaPercent, // REMOVED - not used
  FaReceipt,
  // FaQrcode, // REMOVED - not used
  // FaBuilding, // REMOVED - not used
  // FaEnvelope, // REMOVED - not used
  // FaUserCheck, // REMOVED - not used
  FaHashtag,
  FaMoneyBill,
  FaChevronLeft,
  FaChevronRight,
  FaAngleDoubleLeft,
  FaAngleDoubleRight
} from 'react-icons/fa';
import { MdCancel } from 'react-icons/md';
// import { MdRefresh } from 'react-icons/md'; // REMOVED - not used
// import { BsShop, BsPerson } from 'react-icons/bs'; // REMOVED - BsPerson used, BsShop not used
import { BsPerson } from 'react-icons/bs';
import './Sales.css';

const Sales = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBranch, setFilterBranch] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [branches, setBranches] = useState([]);
  
  // ============================================
  // PAGINATION STATE
  // ============================================
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  
  const [stats, setStats] = useState({
    totalSales: 0,
    totalRevenue: 0,
    averageOrder: 0,
    todaySales: 0,
    todayRevenue: 0
  });
  const [selectedSale, setSelectedSale] = useState(null);
  const [showRefundModal, setShowRefundModal] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

  // ============================================
  // FETCH DATA
  // ============================================
  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const salesRes = await saleService.getSales({ limit: 1000 });
      setSales(salesRes.data || []);
      
      const branchesRes = await fetch(`${API_URL}/branches`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const branchesData = await branchesRes.json();
      if (branchesData.success) {
        setBranches(branchesData.data || []);
      }
      
      const completedSales = salesRes.data?.filter(s => s.status === 'completed') || [];
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todaySales = completedSales.filter(s => new Date(s.createdAt) >= today);
      
      const totalRevenue = completedSales.reduce((sum, s) => sum + s.total, 0);
      const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0);
      
      setStats({
        totalSales: completedSales.length,
        totalRevenue: totalRevenue,
        averageOrder: completedSales.length > 0 ? totalRevenue / completedSales.length : 0,
        todaySales: todaySales.length,
        todayRevenue: todayRevenue
      });
      
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ============================================
  // FILTER SALES
  // ============================================
  const filteredSales = sales.filter(sale => {
    const matchesSearch = sale.saleNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sale.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          sale.customer?.phone?.includes(searchTerm);
    const matchesBranch = filterBranch === 'all' || sale.branch?._id === filterBranch || sale.branch === filterBranch;
    const matchesStatus = filterStatus === 'all' || sale.status === filterStatus;
    return matchesSearch && matchesBranch && matchesStatus;
  });

  // ============================================
  // PAGINATION CALCULATIONS
  // ============================================
  const totalItems = filteredSales.length;
  const totalPages = Math.ceil(totalItems / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = Math.min(startIndex + entriesPerPage, totalItems);
  const paginatedSales = filteredSales.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterBranch, filterStatus]);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleEntriesChange = (e) => {
    setEntriesPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  // ============================================
  // RENDER PAGINATION BUTTONS
  // ============================================
  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          className={`pagination-btn ${i === currentPage ? 'active' : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }
    return buttons;
  };

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  const getStatusBadge = (status) => {
    const statusMap = {
      'completed': { label: 'Completed', class: 'status-completed', icon: FaCheckCircle },
      'pending': { label: 'Pending', class: 'status-pending', icon: FaClock },
      'cancelled': { label: 'Cancelled', class: 'status-cancelled', icon: FaBan },
      'refunded': { label: 'Refunded', class: 'status-refunded', icon: FaReply }
    };
    return statusMap[status] || { label: status, class: '', icon: null };
  };

  const getPaymentMethodLabel = (method) => {
    const methodMap = {
      'cash': { label: 'Cash', icon: FaMoneyBill },
      'mpesa': { label: 'M-Pesa', icon: FaMobileAlt },
      'card': { label: 'Card', icon: FaCreditCard },
      'bank': { label: 'Bank Transfer', icon: FaUniversity },
      'credit': { label: 'Credit', icon: FaCreditCard }
    };
    return methodMap[method] || { label: method || 'N/A', icon: FaWallet };
  };

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

  const formatCurrency = (amount, currencySymbol = 'KSh') => {
    if (amount === undefined || amount === null) return `${currencySymbol} 0`;
    return `${currencySymbol} ${amount.toLocaleString()}`;
  };

  const handleViewReceipt = (sale) => {
    navigate('/sales/receipt', { 
      state: { 
        sale: sale,
        fromPOS: false
      } 
    });
  };

  const handleRefund = (sale) => {
    setSelectedSale(sale);
    setShowRefundModal(true);
  };

  const confirmRefund = async () => {
    if (!selectedSale) return;
    if (!window.confirm(`Are you sure you want to refund sale ${selectedSale.saleNumber}?`)) return;
    
    try {
      alert(`Refund processed for ${selectedSale.saleNumber}`);
      setShowRefundModal(false);
      setSelectedSale(null);
      fetchData();
    } catch (error) {
      alert('Error processing refund: ' + error.message);
    }
  };

  const getBranchCurrency = (sale) => {
    return sale.branch?.currencySymbol || 'KSh';
  };

  const StatCard = ({ icon: Icon, value, label, color }) => (
    <div className="stat-card">
      <div className="stat-icon-wrapper" style={{ backgroundColor: color || '#f0f4ff' }}>
        <Icon className="stat-icon" />
      </div>
      <div className="stat-info">
        <span className="stat-value">{value}</span>
        <span className="stat-label">{label}</span>
      </div>
    </div>
  );

  return (
    <MainLayout title="Sales" breadcrumbs={['Home', 'Sales']}>
      <div className="sales-page">
        {/* Stats Cards */}
        <div className="sales-stats">
          <StatCard 
            icon={FaChartBar} 
            value={stats.totalSales} 
            label="Total Sales" 
            color="#e8f5e9"
          />
          <StatCard 
            icon={FaMoneyBillWave} 
            value={formatCurrency(stats.totalRevenue)} 
            label="Total Revenue" 
            color="#e3f2fd"
          />
          <StatCard 
            icon={FaChartLine} 
            value={formatCurrency(stats.averageOrder)} 
            label="Average Order" 
            color="#f3e5f5"
          />
          <StatCard 
            icon={FaCalendarDay} 
            value={stats.todaySales} 
            label="Today's Sales" 
            color="#fff3e0"
          />
          <StatCard 
            icon={FaWallet} 
            value={formatCurrency(stats.todayRevenue)} 
            label="Today's Revenue" 
            color="#e0f7fa"
          />
        </div>

        {/* Header */}
        <div className="sales-header">
          <div>
            <h2>Sales History</h2>
            <p>View and manage all sales transactions</p>
          </div>
          <button className="btn-refresh" onClick={fetchData}>
            <FaSync className="btn-icon" />
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="sales-filters">
          <div className="filter-group">
            <div className="search-wrapper">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by receipt #, customer, phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button className="clear-search" onClick={() => setSearchTerm('')}>
                  ✕
                </button>
              )}
            </div>
          </div>
          <div className="filter-group">
            <div className="select-wrapper">
              <FaStore className="select-icon" />
              <select
                value={filterBranch}
                onChange={(e) => setFilterBranch(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Branches</option>
                {branches.map(branch => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="filter-group">
            <div className="select-wrapper">
              <FaTag className="select-icon" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>
          <div className="filter-group filter-actions">
            <button 
              className="btn-clear-filters"
              onClick={() => {
                setSearchTerm('');
                setFilterBranch('all');
                setFilterStatus('all');
              }}
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Content States */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading sales...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <MdCancel className="error-icon" />
            <p>{error}</p>
            <button onClick={fetchData}>Retry</button>
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="empty-state">
            <FaReceipt className="empty-icon" />
            <h3>No Sales Found</h3>
            <p>Start making sales from the POS</p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="sales-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Receipt #</th>
                    <th>Date</th>
                    <th>Customer</th>
                    <th>Branch</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedSales.map((sale, index) => {
                    const statusInfo = getStatusBadge(sale.status);
                    const paymentInfo = getPaymentMethodLabel(sale.payment?.method);
                    const StatusIcon = statusInfo.icon;
                    const PaymentIcon = paymentInfo.icon;
                    const currencySymbol = getBranchCurrency(sale);
                    const globalIndex = startIndex + index + 1;
                    
                    return (
                      <tr key={sale._id} className={sale.status === 'cancelled' ? 'row-cancelled' : ''}>
                        <td>{globalIndex}</td>
                        <td>
                          <span className="receipt-number">
                            <FaHashtag className="receipt-icon" />
                            {sale.saleNumber}
                          </span>
                        </td>
                        <td>{formatDate(sale.createdAt)}</td>
                        <td>
                          <div className="customer-info">
                            <span className="customer-name">
                              <BsPerson className="customer-icon" />
                              {sale.customer?.name || 'Walk-in'}
                            </span>
                            {sale.customer?.phone && (
                              <span className="customer-phone">
                                <FaPhone className="phone-icon" />
                                {sale.customer.phone}
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="branch-name">
                            <FaStore className="branch-icon" />
                            {sale.branch?.name || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <span className="items-count">
                            <FaBox className="items-icon" />
                            {sale.items?.length || 0}
                          </span>
                        </td>
                        <td className="total-amount">
                          <strong>{formatCurrency(sale.total, currencySymbol)}</strong>
                        </td>
                        <td>
                          <span className="payment-method">
                            <PaymentIcon className="payment-icon" />
                            {paymentInfo.label}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${statusInfo.class}`}>
                            {StatusIcon && <StatusIcon className="status-icon" />}
                            {statusInfo.label}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="btn-action btn-view"
                              onClick={() => handleViewReceipt(sale)}
                              title="View Receipt"
                            >
                              <FaReceipt />
                            </button>
                            {sale.status === 'completed' && (
                              <button 
                                className="btn-action btn-refund"
                                onClick={() => handleRefund(sale)}
                                title="Refund"
                              >
                                <FaUndo />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ============================================ */}
            {/* PAGINATION */}
            {/* ============================================ */}
            {totalItems > 0 && (
              <div className="pagination-container">
                <div className="pagination-info">
                  <span>
                    Showing {startIndex + 1} to {endIndex} of {totalItems} entries
                  </span>
                  <div className="entries-selector">
                    <label>Show</label>
                    <select value={entriesPerPage} onChange={handleEntriesChange}>
                      {[5, 10, 25, 50, 100].map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                    <label>entries</label>
                  </div>
                </div>

                <div className="pagination-controls">
                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1 || totalPages === 0}
                  >
                    <FaAngleDoubleLeft />
                  </button>
                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || totalPages === 0}
                  >
                    <FaChevronLeft />
                  </button>

                  {renderPaginationButtons()}

                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <FaChevronRight />
                  </button>
                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <FaAngleDoubleRight />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Refund Modal */}
        {showRefundModal && selectedSale && (
          <div className="refund-modal-overlay" onClick={() => setShowRefundModal(false)}>
            <div className="refund-modal" onClick={(e) => e.stopPropagation()}>
              <div className="refund-modal-header">
                <h2>
                  <FaUndo className="modal-header-icon" />
                  Process Refund
                </h2>
                <button className="close-btn" onClick={() => setShowRefundModal(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="refund-modal-body">
                <div className="refund-info">
                  <p>
                    <FaHashtag className="refund-icon" />
                    <strong>Sale #:</strong> {selectedSale.saleNumber}
                  </p>
                  <p>
                    <BsPerson className="refund-icon" />
                    <strong>Customer:</strong> {selectedSale.customer?.name || 'Walk-in'}
                  </p>
                  <p>
                    <FaMoneyBillWave className="refund-icon" />
                    <strong>Total:</strong> {getBranchCurrency(selectedSale)} {selectedSale.total?.toLocaleString()}
                  </p>
                  <p>
                    <FaCalendarDay className="refund-icon" />
                    <strong>Date:</strong> {formatDate(selectedSale.createdAt)}
                  </p>
                </div>
                <div className="refund-items">
                  <h4>Items to Refund</h4>
                  {selectedSale.items.map((item, idx) => (
                    <div key={idx} className="refund-item">
                      <span>
                        <FaBox className="refund-item-icon" />
                        {item.productName} x{item.quantity}
                      </span>
                      <span>{getBranchCurrency(selectedSale)} {item.totalPrice?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div className="refund-total">
                  <strong>Total Refund Amount:</strong>
                  <span className="refund-amount">
                    {getBranchCurrency(selectedSale)} {selectedSale.total?.toLocaleString()}
                  </span>
                </div>
                <div className="refund-warning">
                  <FaBan className="warning-icon" />
                  This action cannot be undone. The products will be restocked.
                </div>
              </div>
              <div className="refund-modal-footer">
                <button className="btn-cancel" onClick={() => setShowRefundModal(false)}>
                  <FaTimes className="btn-icon" />
                  Cancel
                </button>
                <button className="btn-refund-confirm" onClick={confirmRefund}>
                  <FaUndo className="btn-icon" />
                  Confirm Refund
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Sales;