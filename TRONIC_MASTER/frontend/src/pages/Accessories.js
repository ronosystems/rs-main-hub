// /home/kk/RS/TRONIC_MASTER/frontend/src/pages/Accessories.js

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../context/AuthContext';
import { productService } from '../services/productService';
import { branchService } from '../services/branchService';
import { 
  FaSearch, 
  FaSync,
  FaBox,
  FaPlus,
  FaBarcode
} from 'react-icons/fa';
import './Accessories.css';

const Accessories = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State Management
  const [accessories, setAccessories] = useState([]);
  const [filteredAccessories, setFilteredAccessories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [isManager, setIsManager] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    brand: 'all'
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
      
      console.log('👤 User Role:', role);
      console.log('📋 Is Admin:', role === 'company_admin');
      console.log('📋 Is Manager:', role === 'company_manager');
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
  // FETCH ACCESSORIES (Role-Based)
  // ============================================
  const fetchAccessories = useCallback(async () => {
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
      let accessoryData = [];
      
      // ===== ROLE-BASED ACCESSORIES FETCHING =====
      if (isAdmin) {
        const response = await productService.getProducts();
        const allProducts = response.data || [];
        
        accessoryData = allProducts.filter(product => 
          product.category === 'Accessories' && 
          product.status === 'active' &&
          (product.branch?._id === selectedBranch?._id || 
           product.branch === selectedBranch?._id)
        );
        console.log('👑 Admin: Fetching all accessories for branch', selectedBranch?.name);
        
      } else if (isManager) {
        const response = await productService.getProducts();
        const allProducts = response.data || [];
        
        const managerBranchIds = branches.map(b => b._id);
        accessoryData = allProducts.filter(product => 
          product.category === 'Accessories' && 
          product.status === 'active' &&
          ((product.branch?._id && managerBranchIds.includes(product.branch._id)) ||
           (product.branch && managerBranchIds.includes(product.branch)))
        );
        
        if (selectedBranch) {
          accessoryData = accessoryData.filter(product =>
            product.branch?._id === selectedBranch._id ||
            product.branch === selectedBranch._id
          );
        }
        console.log('👔 Manager: Fetching accessories for assigned branches');
        
      } else {
        const response = await productService.getProducts();
        const allProducts = response.data || [];
        
        accessoryData = allProducts.filter(product => 
          product.category === 'Accessories' && 
          product.status === 'active' &&
          (product.branch?._id === selectedBranch?._id || 
           product.branch === selectedBranch._id)
        );
      }
      
      setAccessories(accessoryData);
      setError(null);
      
    } catch (error) {
      console.error('Error fetching accessories:', error);
      setError('Failed to load accessories. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [selectedBranch, isAdmin, isManager, branches]);

  // ============================================
  // LOAD DATA ON MOUNT
  // ============================================
  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  useEffect(() => {
    if (selectedBranch || isAdmin) {
      fetchAccessories();
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
    let result = [...accessories];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(accessory =>
        accessory.name?.toLowerCase().includes(term) ||
        accessory.model?.toLowerCase().includes(term) ||
        accessory.brand?.toLowerCase().includes(term) ||
        accessory.barcode?.toLowerCase().includes(term) ||
        accessory.sku?.toLowerCase().includes(term)
      );
    }

    if (filters.brand !== 'all') {
      result = result.filter(accessory => accessory.brand === filters.brand);
    }

    setFilteredAccessories(result);
  }, [accessories, searchTerm, filters]);

  // ============================================
  // HELPER FUNCTIONS
  // ============================================
  const getStockQuantity = (product) => {
    return product.stock?.quantity || 0;
  };

  const getMinLevel = (product) => {
    return product.stock?.minLevel || 5;
  };

  const getTotalStock = () => {
    return accessories.reduce((sum, p) => sum + getStockQuantity(p), 0);
  };

  const getUniqueOptions = (key) => {
    const options = new Set();
    accessories.forEach(accessory => {
      if (accessory[key]) options.add(accessory[key]);
    });
    return Array.from(options).sort();
  };

  const getStockStatus = (product) => {
    const quantity = getStockQuantity(product);
    const minLevel = getMinLevel(product);
    if (quantity === 0) return { label: 'Out of Stock', class: 'status-out-of-stock' };
    if (quantity <= minLevel) return { label: 'Low Stock', class: 'status-low-stock' };
    return { label: 'In Stock', class: 'status-in-stock' };
  };

  // ============================================
  // NAVIGATION HANDLERS
  // ============================================
  
  // ✅ Navigate to Restock Accessory Page
  const handleRestock = (accessory) => {
    navigate(`/accessories/restock/${accessory._id}`, { 
      state: { 
        product: accessory, 
        branch: selectedBranch,
        currentStock: getStockQuantity(accessory),
        minLevel: getMinLevel(accessory)
      } 
    });
  };

  const handleBranchSelect = (branch) => {
    setSelectedBranch(branch);
    setCurrentPage(1);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleRefresh = () => {
    fetchAccessories();
  };

  // ============================================
  // PAGINATION
  // ============================================
  const totalItems = filteredAccessories.length;
  const totalPages = Math.ceil(totalItems / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = Math.min(startIndex + entriesPerPage, totalItems);
  const paginatedAccessories = filteredAccessories.slice(startIndex, endIndex);

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
  // RENDER
  // ============================================
  return (
    <MainLayout title="Accessories Inventory" breadcrumbs={['Home', 'Products', 'Accessories']}>
      <div className="accessories-page">
        
        {/* ===== BRANCH SELECTOR + FILTERS IN 1 ROW ===== */}
        <div className="accessories-controls-row">
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
              placeholder="Search by name, model, barcode, SKU..."
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
                setFilters({ brand: 'all' });
              }}
            >
              Clear
            </button>
          </div>
        </div>

        {/* ===== STATS ===== */}
        <div className="accessories-stats">
          <div className="stat-item">
            <span className="stat-number">{accessories.length}</span>
            <span className="stat-label">Total Products</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{getTotalStock()}</span>
            <span className="stat-label">Total Stock</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {accessories.filter(p => getStockQuantity(p) === 0).length}
            </span>
            <span className="stat-label">Out of Stock</span>
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
            <p>Loading accessories...</p>
          </div>
        ) : error ? (
          <div className="state-container error-state">
            <p>⚠️ {error}</p>
            <button onClick={handleRefresh}>Retry</button>
          </div>
        ) : filteredAccessories.length === 0 ? (
          <div className="state-container empty-state">
            <FaBox className="empty-icon" />
            <h3>No Accessories Found</h3>
            <p>
              {selectedBranch 
                ? `No accessories available in ${selectedBranch.name}`
                : 'No accessories available'}
            </p>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="accessories-table">
                <thead>
                  <tr>
                    <th style={{ width: '5%', textAlign: 'center' }}>#</th>
                    <th style={{ width: '25%' }}>Product Name</th>
                    <th style={{ width: '18%' }}>Model</th>
                    <th style={{ width: '17%' }}>Barcode</th>
                    <th style={{ width: '15%' }}>SKU</th>
                    <th style={{ width: '10%', textAlign: 'center' }}>Stock</th>
                    <th style={{ width: '10%', textAlign: 'center' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedAccessories.map((accessory, index) => {
                    const quantity = getStockQuantity(accessory);
                    const isOutOfStock = quantity === 0;
                    
                    return (
                      <tr key={accessory._id} className={isOutOfStock ? 'row-out-of-stock' : ''}>
                        <td style={{ textAlign: 'center' }}>{startIndex + index + 1}</td>
                        <td>
                          <div className="product-name-cell">
                            <span className="product-name">{accessory.name || accessory.brand}</span>
                            {accessory.brand && accessory.name !== accessory.brand && (
                              <span className="product-brand">{accessory.brand}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="product-model">{accessory.model || 'N/A'}</span>
                        </td>
                        <td>
                          <div className="barcode-cell">
                            {accessory.barcode ? (
                              <>
                                <FaBarcode className="barcode-icon" />
                                <span className="product-barcode">{accessory.barcode}</span>
                              </>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="product-sku">{accessory.sku || '—'}</span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div className="stock-info">
                            <span className={`stock-count ${isOutOfStock ? 'zero' : ''}`}>
                              <FaBox className="stock-icon" />
                              {quantity}
                            </span>
                            {getStockStatus(accessory).class === 'status-low-stock' && (
                              <span className="low-stock-badge">⚠️ Low</span>
                            )}
                            {isOutOfStock && (
                              <span className="out-of-stock-badge">Out</span>
                            )}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="btn-action btn-restock"
                            onClick={() => handleRestock(accessory)}
                            title={`Restock ${accessory.name || accessory.brand}`}
                          >
                            <FaPlus /> Restock
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredAccessories.length > 0 && (
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

export default Accessories;