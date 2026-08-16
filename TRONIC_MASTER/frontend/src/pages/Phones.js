// /home/kk/RS/TRONIC_MASTER/frontend/src/pages/Phones.js

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../context/AuthContext';
import { productService } from '../services/productService';
import { branchService } from '../services/branchService';
import { 
  FaSearch, 
  FaPhone, 
  FaMicrochip, 
  FaEdit, 
  FaList,
  FaSync,
} from 'react-icons/fa';
import { MdStorage } from 'react-icons/md';
import './Phones.css';

const Phones = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State Management
  const [phones, setPhones] = useState([]);
  const [filteredPhones, setFilteredPhones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [isManager, setIsManager] = useState(false);
  const [isAgent, setIsAgent] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    brand: 'all',
    ram: 'all',
    rom: 'all'
  });
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

  // ============================================
  // CHECK USER ROLE
  // ============================================
  useEffect(() => {
    if (user) {
      const role = user.companyRole || 'company_staff';
      setIsAdmin(role === 'company_admin' || user.role === 'super_admin');
      setIsManager(role === 'company_manager');
      setIsAgent(role === 'company_agent');
      
      console.log('👤 User Role:', role);
      console.log('📋 Is Admin:', role === 'company_admin');
      console.log('📋 Is Manager:', role === 'company_manager');
      console.log('📋 Is Agent:', role === 'company_agent');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ============================================
  // FETCH BRANCHES (Role-Based)
  // ============================================
  const fetchBranches = useCallback(async () => {
    try {
      const result = await branchService.getUserBranches();
      
      if (result.success && result.data?.length > 0) {
        setBranches(result.data);
        setSelectedBranch(result.data[0]);
        console.log('🏪 Branches loaded:', result.data.length);
      } else {
        setBranches([]);
        setSelectedBranch(null);
        console.log('⚠️ No branches found for this user');
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
      setError('Failed to load branches. Please try again.');
    }
  }, []);

  // ============================================
  // FETCH PHONES (Role-Based)
  // ============================================
  const fetchPhones = useCallback(async () => {
    if (!selectedBranch && isAdmin) {
      setLoading(false);
      return;
    }
    
    if (!selectedBranch && !isAdmin) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      let phoneData = [];
      
      // ===== ROLE-BASED PHONE FETCHING =====
      if (isAdmin) {
        const response = await productService.getProducts();
        const allProducts = response.data || [];
        
        phoneData = allProducts.filter(product => 
          product.category === 'Phones' && 
          product.status === 'active' &&
          (product.branch?._id === selectedBranch?._id || 
           product.branch === selectedBranch?._id)
        );
        console.log('👑 Admin: Fetching all phones for branch', selectedBranch?.name);
        
      } else if (isManager) {
        const response = await productService.getProducts();
        const allProducts = response.data || [];
        
        const managerBranchIds = branches.map(b => b._id);
        phoneData = allProducts.filter(product => 
          product.category === 'Phones' && 
          product.status === 'active' &&
          ((product.branch?._id && managerBranchIds.includes(product.branch._id)) ||
           (product.branch && managerBranchIds.includes(product.branch)))
        );
        
        if (selectedBranch) {
          phoneData = phoneData.filter(product =>
            product.branch?._id === selectedBranch._id ||
            product.branch === selectedBranch._id
          );
        }
        console.log('👔 Manager: Fetching phones for assigned branches');
        
      } else if (isAgent) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/phones/assigned`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        if (data.success) {
          phoneData = data.data || [];
          console.log('🤝 Agent: Fetching assigned phones:', phoneData.length);
        } else {
          phoneData = [];
        }
      } else {
        const response = await productService.getProducts();
        const allProducts = response.data || [];
        
        phoneData = allProducts.filter(product => 
          product.category === 'Phones' && 
          product.status === 'active' &&
          (product.branch?._id === selectedBranch?._id || 
           product.branch === selectedBranch._id)
        );
      }
      
      setPhones(phoneData);
      setError(null);
      
    } catch (error) {
      console.error('Error fetching phones:', error);
      setError('Failed to load phones. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, isAdmin, isManager, isAgent, branches, API_URL]);

  // ============================================
  // LOAD DATA ON MOUNT
  // ============================================
  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  useEffect(() => {
    if (selectedBranch || isAdmin || isAgent) {
      fetchPhones();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranch]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters]);

  // ============================================
  // FILTERING
  // ============================================
  useEffect(() => {
    let result = [...phones];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(phone =>
        phone.name?.toLowerCase().includes(term) ||
        phone.model?.toLowerCase().includes(term) ||
        phone.brand?.toLowerCase().includes(term)
      );
    }

    if (filters.brand !== 'all') {
      result = result.filter(phone => phone.brand === filters.brand);
    }

    if (filters.ram !== 'all') {
      result = result.filter(phone => phone.ram === filters.ram);
    }

    if (filters.rom !== 'all') {
      result = result.filter(phone => phone.rom === filters.rom);
    }

    setFilteredPhones(result);
  }, [phones, searchTerm, filters]);

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  const getAvailableUnits = (product) => {
    if (!product.units?.length) return 0;
    return product.units.filter(unit => unit.status === 'available').length;
  };

  const getTotalAvailableUnits = () => {
    return phones.reduce((sum, p) => sum + getAvailableUnits(p), 0);
  };

  const getUniqueOptions = (key) => {
    const options = new Set();
    phones.forEach(phone => {
      if (phone[key]) options.add(phone[key]);
    });
    return Array.from(options).sort();
  };

  // ============================================
  // PAGINATION
  // ============================================
  const totalItems = filteredPhones.length;
  const totalPages = Math.ceil(totalItems / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = Math.min(startIndex + entriesPerPage, totalItems);
  const paginatedPhones = filteredPhones.slice(startIndex, endIndex);

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
  // NAVIGATION HANDLERS
  // ============================================
  const handleViewIMEIs = (phone) => {
    navigate(`/phones/imeis/${phone._id}`, { 
      state: { phone, branch: selectedBranch } 
    });
  };

  const handleEditProduct = (phone) => {
    if (isAdmin || isManager) {
      navigate(`/products/edit/${phone._id}`);
    }
  };

  const handleBranchSelect = (branch) => {
    setSelectedBranch(branch);
    setCurrentPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleRefresh = () => {
    fetchPhones();
  };

  // ============================================
  // RENDER: AGENT VIEW - TABLE ONLY
  // ============================================
  if (isAgent) {
    return (
      <MainLayout title="My Assigned Phones" breadcrumbs={['Home', 'Phones']}>
        <div className="phones-page agent-view">
          {loading ? (
            <div className="state-container loading-state">
              <div className="spinner"></div>
              <p>Loading your assigned phones...</p>
            </div>
          ) : error ? (
            <div className="state-container error-state">
              <p>⚠️ {error}</p>
              <button onClick={handleRefresh}>Retry</button>
            </div>
          ) : filteredPhones.length === 0 ? (
            <div className="state-container empty-state">
              <FaPhone className="empty-icon" />
              <h3>No Phones Assigned</h3>
              <p>No phones have been assigned to you yet.</p>
            </div>
          ) : (
            <>
              <div className="agent-phone-stats">
                <span>Total Assigned Phones Models: <strong>{phones.length}</strong></span>
                <span>Available IMEI Devices: <strong>{getTotalAvailableUnits()}</strong></span>
              </div>
              
              <div className="table-container">
                <table className="phones-table agent-phone-table">
                  <thead>
                    <tr>
                      <th style={{ width: '5%', textAlign: 'center' }}>#</th>
                      <th style={{ width: '35%' }}>Phone Model</th>
                      <th style={{ width: '30%' }}>Specifications</th>
                      <th style={{ width: '15%', textAlign: 'center' }}>Available</th>
                      <th style={{ width: '15%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPhones.map((phone, index) => {
                      const available = getAvailableUnits(phone);
                      const isOutOfStock = available === 0;
                      
                      return (
                        <tr key={phone._id} className={isOutOfStock ? 'row-out-of-stock' : ''}>
                          <td style={{ textAlign: 'center' }}>{startIndex + index + 1}</td>
                          <td>
                            <div className="phone-model-cell">
                              <span className="phone-name">{phone.brand} {phone.model}</span>
                              {phone.name && phone.name !== `${phone.brand} ${phone.model}` && (
                                <span className="phone-alias">{phone.name}</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="phone-specs">
                              <span className="spec-badge">
                                <FaMicrochip /> {phone.ram || 'N/A'}
                              </span>
                              <span className="spec-badge">
                                <MdStorage /> {phone.rom || 'N/A'}
                              </span>
                            </div>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <div className="available-units">
                              <span className={`unit-count ${isOutOfStock ? 'zero' : ''}`}>
                                {available}
                              </span>
                              <span className="unit-label">units</span>
                            </div>
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="btn-action btn-imeis"
                                onClick={() => handleViewIMEIs(phone)}
                                title="View IMEIs"
                              >
                                <FaList /> IMEIs
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination - Agent */}
              {filteredPhones.length > 0 && (
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
              )}
            </>
          )}
        </div>
      </MainLayout>
    );
  }

  // ============================================
  // RENDER: NON-AGENT VIEW - Branch Selector + Filters + Stats + Table
  // ============================================
  return (
    <MainLayout title="Phone Inventory" breadcrumbs={['Home', 'Phones']}>
      <div className="phones-page">
        
        {/* ===== BRANCH SELECTOR + FILTERS IN 1 ROW ===== */}
        <div className="phones-controls-row">
          {/* Branch Selector Dropdown */}
          {branches.length > 0 && (
            <div className="control-group branch-selector-group">
              <label>Branch</label>
              <select
                value={selectedBranch?._id || ''}
                onChange={(e) => {
                  const branch = branches.find(b => b._id === e.target.value);
                  if (branch) handleBranchSelect(branch);
                }}
                className="branch-select-dropdown"
              >
                {branches.map(branch => (
                  <option key={branch._id} value={branch._id}>
                    {branch.name} {branch.city ? `(${branch.city})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search */}
          <div className="control-group search-group">
            <div className="filter-icon">
              <FaSearch />
            </div>
            <input
              type="text"
              placeholder="Search by brand, model, or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button 
                className="clear-search"
                onClick={() => setSearchTerm('')}
              >
                ✕
              </button>
            )}
          </div>

          {/* Brand Filter */}
          <div className="control-group filter-group">
            <select
              value={filters.brand}
              onChange={(e) => handleFilterChange('brand', e.target.value)}
              className="filter-select"
            >
              <option value="all">All Brands</option>
              {getUniqueOptions('brand').map(brand => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

          {/* RAM Filter */}
          <div className="control-group filter-group">
            <select
              value={filters.ram}
              onChange={(e) => handleFilterChange('ram', e.target.value)}
              className="filter-select"
            >
              <option value="all">All RAM</option>
              {getUniqueOptions('ram').map(ram => (
                <option key={ram} value={ram}>{ram}</option>
              ))}
            </select>
          </div>

          {/* ROM Filter */}
          <div className="control-group filter-group">
            <select
              value={filters.rom}
              onChange={(e) => handleFilterChange('rom', e.target.value)}
              className="filter-select"
            >
              <option value="all">All ROM</option>
              {getUniqueOptions('rom').map(rom => (
                <option key={rom} value={rom}>{rom}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="control-group filter-actions">
            <button 
              className="btn-clear-filters"
              onClick={() => {
                setSearchTerm('');
                setFilters({ brand: 'all', ram: 'all', rom: 'all' });
              }}
            >
              Clear
            </button>
          </div>
        </div>

        {/* ===== STATS ===== */}
        <div className="phones-stats">
          <div className="stat-item">
            <span className="stat-number">{phones.length}</span>
            <span className="stat-label">Total Models</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{getTotalAvailableUnits()}</span>
            <span className="stat-label">Available Units</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {phones.reduce((sum, p) => sum + (p.units?.length || 0), 0)}
            </span>
            <span className="stat-label">Total Units</span>
          </div>
          <div className="stat-item">
            <button className="btn-refresh" onClick={handleRefresh}>
              <FaSync /> Refresh
            </button>
          </div>
        </div>

        {/* ===== TABLE ===== */}
        {loading ? (
          <div className="state-container loading-state">
            <div className="spinner"></div>
            <p>Loading phones...</p>
          </div>
        ) : error ? (
          <div className="state-container error-state">
            <p>⚠️ {error}</p>
            <button onClick={handleRefresh}>Retry</button>
          </div>
        ) : filteredPhones.length === 0 ? (
          <div className="state-container empty-state">
            <FaPhone className="empty-icon" />
            <h3>No Phones Found</h3>
            <p>
              {selectedBranch 
                ? `No phones available in ${selectedBranch.name}`
                : 'No phones available'}
            </p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="phones-table">
                <thead>
                  <tr>
                    <th style={{ width: '5%', textAlign: 'center' }}>#</th>
                    <th style={{ width: '30%' }}>Phone Model</th>
                    <th style={{ width: '30%' }}>Specifications</th>
                    <th style={{ width: '15%', textAlign: 'center' }}>Available</th>
                    <th style={{ width: '20%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPhones.map((phone, index) => {
                    const available = getAvailableUnits(phone);
                    const isOutOfStock = available === 0;
                    
                    return (
                      <tr key={phone._id} className={isOutOfStock ? 'row-out-of-stock' : ''}>
                        <td style={{ textAlign: 'center' }}>{startIndex + index + 1}</td>
                        <td>
                          <div className="phone-model-cell">
                            <span className="phone-name">{phone.brand} {phone.model}</span>
                            {phone.name && phone.name !== `${phone.brand} ${phone.model}` && (
                              <span className="phone-alias">{phone.name}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="phone-specs">
                            <span className="spec-badge">
                              <FaMicrochip /> {phone.ram || 'N/A'}
                            </span>
                            <span className="spec-badge">
                              <MdStorage /> {phone.rom || 'N/A'}
                            </span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="available-units">
                            <span className={`unit-count ${isOutOfStock ? 'zero' : ''}`}>
                              {available}
                            </span>
                            <span className="unit-label">units</span>
                          </div>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-action btn-imeis"
                              onClick={() => handleViewIMEIs(phone)}
                              title="View IMEIs"
                            >
                              <FaList /> IMEIs
                            </button>
                            {(isAdmin || isManager) && (
                              <button
                                className="btn-action btn-edit"
                                onClick={() => handleEditProduct(phone)}
                                title="Edit Phone"
                              >
                                <FaEdit /> Edit
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

            {/* Pagination */}
            {filteredPhones.length > 0 && (
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
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Phones;