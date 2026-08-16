// /home/kk/RS/TRONIC_MASTER/frontend/src/pages/Electronics.js

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../context/AuthContext';
import { productService } from '../services/productService';
import { branchService } from '../services/branchService';
import { 
  FaSearch, 
  FaMicrochip, 
  FaEdit, 
  FaList,
  FaSync,
  FaBox,
  FaTag
} from 'react-icons/fa';
import { MdStorage } from 'react-icons/md';
import './Electronics.css';

const Electronics = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State Management
  const [electronics, setElectronics] = useState([]);
  const [filteredElectronics, setFilteredElectronics] = useState([]);
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
  // FETCH ELECTRONICS (Role-Based)
  // ============================================
  const fetchElectronics = useCallback(async () => {
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
      let electronicData = [];
      
      // ===== ROLE-BASED ELECTRONICS FETCHING =====
      if (isAdmin) {
        const response = await productService.getProducts();
        const allProducts = response.data || [];
        
        electronicData = allProducts.filter(product => 
          product.category === 'Electronics' && 
          product.status === 'active' &&
          (product.branch?._id === selectedBranch?._id || 
           product.branch === selectedBranch?._id)
        );
        console.log('👑 Admin: Fetching all electronics for branch', selectedBranch?.name);
        
      } else if (isManager) {
        const response = await productService.getProducts();
        const allProducts = response.data || [];
        
        const managerBranchIds = branches.map(b => b._id);
        electronicData = allProducts.filter(product => 
          product.category === 'Electronics' && 
          product.status === 'active' &&
          ((product.branch?._id && managerBranchIds.includes(product.branch._id)) ||
           (product.branch && managerBranchIds.includes(product.branch)))
        );
        
        if (selectedBranch) {
          electronicData = electronicData.filter(product =>
            product.branch?._id === selectedBranch._id ||
            product.branch === selectedBranch._id
          );
        }
        console.log('👔 Manager: Fetching electronics for assigned branches');
        
      } else if (isAgent) {
        const response = await productService.getProducts();
        const allProducts = response.data || [];
        
        electronicData = allProducts.filter(product => 
          product.category === 'Electronics' && 
          product.status === 'active' &&
          (product.branch?._id === selectedBranch?._id || 
           product.branch === selectedBranch._id)
        );
        console.log('🤝 Agent: Fetching electronics');
        
      } else {
        const response = await productService.getProducts();
        const allProducts = response.data || [];
        
        electronicData = allProducts.filter(product => 
          product.category === 'Electronics' && 
          product.status === 'active' &&
          (product.branch?._id === selectedBranch?._id || 
           product.branch === selectedBranch._id)
        );
      }
      
      setElectronics(electronicData);
      setError(null);
      
    } catch (error) {
      console.error('Error fetching electronics:', error);
      setError('Failed to load electronics. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, isAdmin, isManager, isAgent, branches]);

  // ============================================
  // LOAD DATA ON MOUNT
  // ============================================
  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  useEffect(() => {
    if (selectedBranch || isAdmin || isAgent) {
      fetchElectronics();
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
    let result = [...electronics];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(electronic =>
        electronic.name?.toLowerCase().includes(term) ||
        electronic.model?.toLowerCase().includes(term) ||
        electronic.brand?.toLowerCase().includes(term) ||
        electronic.sku?.toLowerCase().includes(term)
      );
    }

    if (filters.brand !== 'all') {
      result = result.filter(electronic => electronic.brand === filters.brand);
    }

    if (filters.ram !== 'all') {
      result = result.filter(electronic => electronic.ram === filters.ram);
    }

    if (filters.rom !== 'all') {
      result = result.filter(electronic => electronic.rom === filters.rom);
    }

    setFilteredElectronics(result);
  }, [electronics, searchTerm, filters]);

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  const getAvailableUnits = (product) => {
    if (!product.units?.length) return 0;
    return product.units.filter(unit => unit.status === 'available').length;
  };

  const getTotalAvailableUnits = () => {
    return electronics.reduce((sum, p) => sum + getAvailableUnits(p), 0);
  };

  const getUniqueOptions = (key) => {
    const options = new Set();
    electronics.forEach(electronic => {
      if (electronic[key]) options.add(electronic[key]);
    });
    return Array.from(options).sort();
  };

  // ============================================
  // PAGINATION
  // ============================================
  const totalItems = filteredElectronics.length;
  const totalPages = Math.ceil(totalItems / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = Math.min(startIndex + entriesPerPage, totalItems);
  const paginatedElectronics = filteredElectronics.slice(startIndex, endIndex);

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
  const handleViewSerials = (electronic) => {
    navigate(`/products/electronics/serials/${electronic._id}`, { 
      state: { product: electronic, branch: selectedBranch } 
    });
  };

  const handleEditProduct = (electronic) => {
    if (isAdmin || isManager) {
      navigate(`/products/edit/${electronic._id}`);
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
    fetchElectronics();
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <MainLayout title="Electronics Inventory" breadcrumbs={['Home', 'Products', 'Electronics']}>
      <div className="electronics-page">
        
        {/* ===== BRANCH SELECTOR + FILTERS IN 1 ROW ===== */}
        <div className="electronics-controls-row">
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
              placeholder="Search by brand, model, SKU, or name..."
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
        <div className="electronics-stats">
          <div className="stat-item">
            <span className="stat-number">{electronics.length}</span>
            <span className="stat-label">Total Models</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{getTotalAvailableUnits()}</span>
            <span className="stat-label">Available Units</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {electronics.reduce((sum, p) => sum + (p.units?.length || 0), 0)}
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
            <p>Loading electronics...</p>
          </div>
        ) : error ? (
          <div className="state-container error-state">
            <p>⚠️ {error}</p>
            <button onClick={handleRefresh}>Retry</button>
          </div>
        ) : filteredElectronics.length === 0 ? (
          <div className="state-container empty-state">
            <FaMicrochip className="empty-icon" />
            <h3>No Electronics Found</h3>
            <p>
              {selectedBranch 
                ? `No electronics available in ${selectedBranch.name}`
                : 'No electronics available'}
            </p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="electronics-table">
                <thead>
                  <tr>
                    <th style={{ width: '4%', textAlign: 'center' }}>#</th>
                    <th style={{ width: '30%' }}>Product</th>
                    <th style={{ width: '12%' }}>SKU</th>
                    <th style={{ width: '25%' }}>Specifications</th>
                    <th style={{ width: '10%', textAlign: 'center' }}>Available</th>
                    <th style={{ width: '19%' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedElectronics.map((electronic, index) => {
                    const available = getAvailableUnits(electronic);
                    const isOutOfStock = available === 0;
                    
                    return (
                      <tr key={electronic._id} className={isOutOfStock ? 'row-out-of-stock' : ''}>
                        <td style={{ textAlign: 'center' }}>{startIndex + index + 1}</td>
                        <td>
                          <div className="product-model-cell">
                            <span className="product-name">{electronic.brand} {electronic.model}</span>
                            {electronic.name && electronic.name !== `${electronic.brand} ${electronic.model}` && (
                              <span className="product-alias">{electronic.name}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="sku-badge">
                            <FaTag className="sku-icon" />
                            {electronic.sku || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <div className="product-specs">
                            {electronic.ram && (
                              <span className="spec-badge">
                                <FaMicrochip /> {electronic.ram}
                              </span>
                            )}
                            {electronic.rom && (
                              <span className="spec-badge">
                                <MdStorage /> {electronic.rom}
                              </span>
                            )}
                            {electronic.category && (
                              <span className="spec-badge category-badge">
                                <FaBox /> {electronic.category}
                              </span>
                            )}
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
                              className="btn-action btn-serials"
                              onClick={() => handleViewSerials(electronic)}
                              title="View Serials"
                            >
                              <FaList /> Serials
                            </button>
                            {(isAdmin || isManager) && (
                              <button
                                className="btn-action btn-edit"
                                onClick={() => handleEditProduct(electronic)}
                                title="Edit Product"
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
            {filteredElectronics.length > 0 && (
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

export default Electronics;