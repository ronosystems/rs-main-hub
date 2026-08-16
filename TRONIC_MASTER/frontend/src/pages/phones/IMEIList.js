import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import { useAuth } from '../../context/AuthContext';
import './IMEIList.css';

const IMEIList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const phone = location.state?.phone;
  const branch = location.state?.branch;

  const [searchImei, setSearchImei] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterOwner, setFilterOwner] = useState('all');
  const [filterDays, setFilterDays] = useState('all');
  const [users, setUsers] = useState({});
  const [userList, setUserList] = useState([]);
  const [branches, setBranches] = useState({});

  // ============================================
  // PAGINATION STATE
  // ============================================
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

  // ============================================
  // CHECK USER ROLE PERMISSIONS
  // ============================================
  const userRole = user?.companyRole || 'company_staff';
  
  const isAdminOrManager = userRole === 'company_admin' || userRole === 'company_manager';
  const isCashierOrAgent = userRole === 'company_cashier' || userRole === 'company_agent';
  
  const canSell = isAdminOrManager || isCashierOrAgent;
  const canTransfer = isAdminOrManager;
  const canReverse = isAdminOrManager;
  const canViewReceipt = isAdminOrManager || isCashierOrAgent;
  const canEdit = isAdminOrManager;
  const isAgent = userRole === 'company_agent';

  // ============================================
  // ✅ ALL HOOKS BEFORE ANY EARLY RETURN
  // ============================================

  // Fetch users and branches for owner display (only for non-agent)
  useEffect(() => {
    if (!isAgent) {
      fetchUsersAndBranches();
    }
  }, [isAgent]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchImei, filterStatus, filterOwner, filterDays]);

  // ============================================
  // FETCH USERS AND BRANCHES
  // ============================================
  const fetchUsersAndBranches = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const usersResponse = await fetch(`${API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const usersData = await usersResponse.json();
      if (usersData.success) {
        const userMap = {};
        const userListData = [];
        usersData.data.forEach(user => {
          userMap[user._id] = user;
          userListData.push({
            id: user._id,
            name: user.name,
            email: user.email
          });
        });
        setUsers(userMap);
        setUserList(userListData);
      }

      const branchesResponse = await fetch(`${API_URL}/branches`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const branchesData = await branchesResponse.json();
      if (branchesData.success) {
        const branchMap = {};
        branchesData.data.forEach(b => {
          branchMap[b._id] = b;
        });
        setBranches(branchMap);
      }
    } catch (error) {
      console.error('Error fetching users and branches:', error);
    }
  };

  // ============================================
  // ✅ EARLY RETURN AFTER ALL HOOKS
  // ============================================
  if (!phone) {
    return (
      <MainLayout title="IMEI List" breadcrumbs={['Home', 'Phones', 'IMEIs']}>
        <div className="error-state">
          <p>❌ Phone not found</p>
          <button onClick={() => navigate('/phones')}>Go Back</button>
        </div>
      </MainLayout>
    );
  }

  // ============================================
  // PRODUCT DATA
  // ============================================
  const units = phone.units || [];
  const availableCount = units.filter(u => u.status === 'available').length;
  const soldCount = units.filter(u => u.status === 'sold').length;
  const reservedCount = units.filter(u => u.status === 'reserved').length;

  const getDaysSinceUpdated = (updatedAt) => {
    if (!updatedAt) return 0;
    const now = new Date();
    const updated = new Date(updatedAt);
    const diffTime = Math.abs(now - updated);
    return Math.floor(diffTime / (1000 * 60 * 60 * 24));
  };

  const getOwnerId = (unit) => {
    if (unit.status === 'sold' && unit.customer && unit.customer.name) {
      return `customer_${unit.customer.name}`;
    }
    if (unit.assignedTo && unit.assignedToType === 'user') {
      return unit.assignedTo;
    }
    if (unit.branch) {
      return unit.branch;
    }
    if (unit.status === 'available' && phone.branch) {
      return phone.branch._id || phone.branch;
    }
    return null;
  };

  // ============================================
  // Filter units
  // ============================================
  const getFilteredUnits = () => {
    let result = units;

    // Search filter
    if (searchImei) {
      result = result.filter(unit => 
        unit.identifier?.toLowerCase().includes(searchImei.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      result = result.filter(unit => unit.status === filterStatus);
    }

    // Owner filter (non-agent only)
    if (!isAgent && filterOwner !== 'all') {
      result = result.filter(unit => {
        const ownerId = getOwnerId(unit);
        return ownerId === filterOwner;
      });
    }

    // Days filter (non-agent only)
    if (!isAgent && filterDays !== 'all') {
      result = result.filter(unit => {
        const days = getDaysSinceUpdated(unit.updatedAt);
        if (filterDays === '7') return days <= 7;
        if (filterDays === '30') return days <= 30;
        if (filterDays === '90') return days <= 90;
        if (filterDays === '180') return days <= 180;
        if (filterDays === '365') return days <= 365;
        return days <= parseInt(filterDays);
      });
    }

    return result;
  };

  const filteredUnits = getFilteredUnits();

  // ============================================
  // PAGINATION CALCULATIONS
  // ============================================
  const totalItems = filteredUnits.length;
  const totalPages = Math.ceil(totalItems / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = Math.min(startIndex + entriesPerPage, totalItems);
  const paginatedUnits = filteredUnits.slice(startIndex, endIndex);

  const getStatusLabel = (status) => {
    const labels = {
      'available': 'Available',
      'sold': 'Sold',
      'reserved': 'Reserved',
      'repair': 'In Repair'
    };
    return labels[status] || status || 'Unknown';
  };

  const getAge = (createdAt, updatedAt) => {
    const date = updatedAt || createdAt;
    if (!date) return 'N/A';
    
    const now = new Date();
    const created = new Date(date);
    const diffTime = Math.abs(now - created);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    
    if (diffDays > 365) {
      const years = Math.floor(diffDays / 365);
      const months = Math.floor((diffDays % 365) / 30);
      return `${years}y ${months}m`;
    }
    if (diffDays > 30) {
      const months = Math.floor(diffDays / 30);
      const days = diffDays % 30;
      return `${months}m ${days}d`;
    }
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours % 24}h`;
    }
    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes % 60}m`;
    }
    if (diffMinutes > 0) {
      return `${diffMinutes}m`;
    }
    return 'Just now';
  };

  // ========== NAVIGATION HANDLERS ==========
  const handleSell = (unit) => {
    navigate(`/phones/sell/${phone._id}`, { 
      state: { phone, unit, branch } 
    });
  };

  const handleReverse = (unit) => {
    navigate(`/phones/reverse/${phone._id}`, { 
      state: { phone, unit, branch } 
    });
  };

  const handleReceipt = (unit) => {
    navigate(`/phones/receipt/${phone._id}`, { 
      state: { phone, unit, branch, saleData: unit } 
    });
  };

  const handleEditIMEI = (unit) => {
    navigate(`/phones/edit-imei/${phone._id}`, { 
      state: { phone, unit, branch } 
    });
  };

  const handleTransfer = (unit) => {
    navigate(`/phones/transfer/${phone._id}`, { 
      state: { phone, unit, branch } 
    });
  };

  const clearFilters = () => {
    setSearchImei('');
    setFilterStatus('all');
    setFilterOwner('all');
    setFilterDays('all');
    setCurrentPage(1);
  };

  // ============================================
  // PAGINATION HANDLERS
  // ============================================
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
  // RENDER: AGENT VIEW
  // ============================================
  if (isAgent) {
    return (
      <MainLayout 
        title="My Assigned IMEIs" 
        breadcrumbs={['Home', 'Phones', `${phone.brand} ${phone.model}`]}
      >
        <div className="imei-list-page agent-view">
          {paginatedUnits.length === 0 ? (
            <div className="empty-state agent-empty">
              <span className="empty-icon">📋</span>
              <h3>No IMEIs Found</h3>
              <p>No IMEI numbers assigned to you</p>
            </div>
          ) : (
            <>
              <div className="table-container agent-table-container">
                <table className="imei-table agent-imei-table">
                  <thead>
                    <tr>
                      <th style={{ width: '5%', textAlign: 'center' }}>#</th>
                      <th style={{ width: '35%' }}>IMEI Number</th>
                      <th style={{ width: '25%' }}>Specs</th>
                      <th style={{ width: '15%', textAlign: 'center' }}>Age</th>
                      <th style={{ width: '20%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedUnits.map((unit, index) => {
                      const isAvailable = unit.status === 'available';
                      const isSold = unit.status === 'sold';
                      
                      return (
                        <tr key={unit._id || index} className={isSold ? 'row-sold' : ''}>
                          <td style={{ textAlign: 'center' }}>{startIndex + index + 1}</td>
                          <td>
                            <span className="imei-number">{unit.identifier}</span>
                          </td>
                          <td>
                            <div className="specs-compact">
                              <span className="spec-tag">
                                {phone.brand} {phone.model}
                              </span>
                              {phone.ram && (
                                <span className="spec-tag">💾 {phone.ram}</span>
                              )}
                              {phone.rom && (
                                <span className="spec-tag">📦 {phone.rom}</span>
                              )}
                              <span className={`status-badge-small ${unit.status}`}>
                                {getStatusLabel(unit.status)}
                              </span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <span className="age-badge" title={`Created: ${new Date(unit.createdAt).toLocaleString()}`}>
                              {getAge(unit.createdAt, unit.updatedAt)}
                            </span>
                          </td>
                          <td>
                            <div className="action-buttons agent-actions">
                              {isAvailable && (
                                <button 
                                  className="btn-action btn-sell"
                                  onClick={() => handleSell(unit)}
                                  title="Sell this IMEI"
                                >
                                  🛒 Sell
                                </button>
                              )}
                              {isSold && (
                                <button 
                                  className="btn-action btn-receipt"
                                  onClick={() => handleReceipt(unit)}
                                  title="View Receipt"
                                >
                                  🧾 Receipt
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

              {/* ===== PAGINATION - AGENT ===== */}
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
                    ⟪
                  </button>
                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || totalPages === 0}
                  >
                    ‹
                  </button>

                  {renderPaginationButtons()}

                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    ›
                  </button>
                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    ⟫
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </MainLayout>
    );
  }

  // ============================================
  // RENDER: NON-AGENT VIEW
  // ============================================
  return (
    <MainLayout 
      title="IMEI Management" 
      breadcrumbs={['Home', 'Phones', `${phone.brand} ${phone.model}`]}
    >
      <div className="imei-list-page">
        {/* Stats Row */}
        <div className="imei-stats">
          <div className="stat-box">
            <span className="stat-number">{units.length}</span>
            <span className="stat-label">Total IMEIs</span>
          </div>
          <div className="stat-box available">
            <span className="stat-number">{availableCount}</span>
            <span className="stat-label">Available</span>
          </div>
          <div className="stat-box sold">
            <span className="stat-number">{soldCount}</span>
            <span className="stat-label">Sold</span>
          </div>
          <div className="stat-box reserved">
            <span className="stat-number">{reservedCount}</span>
            <span className="stat-label">Reserved</span>
          </div>
        </div>

        {/* Filters Row */}
        <div className="imei-filters">
          <div className="filter-row">
            <div className="filter-group">
              <label>Search IMEI</label>
              <input
                type="text"
                placeholder="Search by IMEI number..."
                value={searchImei}
                onChange={(e) => setSearchImei(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="filter-group">
              <label>Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="sold">Sold</option>
                <option value="reserved">Reserved</option>
                <option value="repair">In Repair</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Owner</label>
              <select
                value={filterOwner}
                onChange={(e) => setFilterOwner(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Owners</option>
                {userList.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
                {Object.values(branches).map(branch => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name} (Branch)
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="filter-row second-row">
            <div className="filter-group">
              <label>Age (Days Since Updated)</label>
              <select
                value={filterDays}
                onChange={(e) => setFilterDays(e.target.value)}
                className="filter-select"
              >
                <option value="all">All Time</option>
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
                <option value="180">Last 6 Months</option>
                <option value="365">Last Year</option>
              </select>
            </div>
            <div className="filter-group" style={{ justifyContent: 'flex-end' }}>
              <button 
                className="btn-clear-filters"
                onClick={clearFilters}
              >
                🗑️ Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Table */}
        {paginatedUnits.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📋</span>
            <h3>No IMEIs Found</h3>
            <p>No IMEI numbers match your filters</p>
            <button className="btn-clear-filters" onClick={clearFilters}>
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="imei-table">
                <thead>
                  <tr>
                    <th style={{ width: '5%', textAlign: 'center' }}>#</th>
                    <th style={{ width: '25%' }}>IMEI Number</th>
                    <th style={{ width: '12%', textAlign: 'center' }}>Status</th>
                    <th style={{ width: '10%', textAlign: 'center' }}>Age</th>
                    <th style={{ width: '28%' }}>Owner</th>
                    <th style={{ width: '20%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUnits.map((unit, index) => {
                    const isSold = unit.status === 'sold';
                    const isAvailable = unit.status === 'available';
                    
                    let ownerName = 'Not Assigned';
                    let ownerIcon = '—';
                    
                    if (unit.assignedTo && unit.assignedToType === 'user') {
                      const userObj = users[unit.assignedTo];
                      ownerName = userObj ? userObj.name : 'Unknown User';
                      ownerIcon = '👤';
                    } else if (unit.branch) {
                      const branchObj = branches[unit.branch] || branches[phone.branch?._id];
                      ownerName = branchObj ? branchObj.name : 'Unknown Branch';
                      ownerIcon = '🏢';
                    } else if (unit.status === 'sold' && unit.customer) {
                      ownerName = unit.customer.name || 'Customer';
                      ownerIcon = '👤';
                    }
                    
                    return (
                      <tr key={unit._id || index} className={isSold ? 'row-sold' : ''}>
                        <td style={{ textAlign: 'center' }}>{startIndex + index + 1}</td>
                        <td>
                          <span className="imei-number">{unit.identifier}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className={`status-badge ${unit.status}`}>
                            {getStatusLabel(unit.status)}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span className="age-badge" title={`Created: ${new Date(unit.createdAt).toLocaleString()}`}>
                            {getAge(unit.createdAt, unit.updatedAt)}
                          </span>
                        </td>
                        <td>
                          <div className="owner-info">
                            <span className="owner-icon">{ownerIcon}</span>
                            <span className="owner-name">{ownerName}</span>
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            {isAvailable && (
                              <>
                                <button 
                                  className="btn-action btn-sell"
                                  onClick={() => handleSell(unit)}
                                  title="Sell this IMEI"
                                >
                                  🛒 Sell
                                </button>
                                {canTransfer && (
                                  <button 
                                    className="btn-action btn-transfer"
                                    onClick={() => handleTransfer(unit)}
                                    title="Transfer"
                                  >
                                    🔄 Transfer
                                  </button>
                                )}
                              </>
                            )}

                            {isSold && (
                              <>
                                {canReverse && (
                                  <button 
                                    className="btn-action btn-reverse"
                                    onClick={() => handleReverse(unit)}
                                    title="Reverse Sale"
                                  >
                                    ↩️ Reverse
                                  </button>
                                )}
                                {canViewReceipt && (
                                  <button 
                                    className="btn-action btn-receipt"
                                    onClick={() => handleReceipt(unit)}
                                    title="View Receipt"
                                  >
                                    🧾 Receipt
                                  </button>
                                )}
                              </>
                            )}

                            {canEdit && (
                              <button 
                                className="btn-action btn-edit"
                                onClick={() => handleEditIMEI(unit)}
                                title="Edit IMEI"
                              >
                                ✏️ Edit
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

            {/* ===== PAGINATION - NON-AGENT ===== */}
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
                    ⟪
                  </button>
                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || totalPages === 0}
                  >
                    ‹
                  </button>

                  {renderPaginationButtons()}

                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    ›
                  </button>
                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    ⟫
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
    </MainLayout>
  );
};

export default IMEIList;