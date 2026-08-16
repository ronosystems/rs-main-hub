import React, { useState, useEffect, useRef } from 'react';
import './ProductDetailModal.css';

const ProductDetailModal = ({ isOpen, onClose, product, onUpdate }) => {
  const [units, setUnits] = useState([]);
  const [editingUnit, setEditingUnit] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [editingStatus, setEditingStatus] = useState('');
  const [newIdentifier, setNewIdentifier] = useState('');
  const [loading, setLoading] = useState(false);
  const [bulkIdentifiers, setBulkIdentifiers] = useState('');
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingPrice, setEditingPrice] = useState(false);
  const [priceValues, setPriceValues] = useState({
    purchase: 0,
    sale: 0,
    best: 0
  });
  
  // ============================================
  // Users and branches for owner display
  // ============================================
  const [users, setUsers] = useState({});
  const [branches, setBranches] = useState({});

  const inputRef = useRef(null);
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

  // ============================================
  // FETCH USERS AND BRANCHES FOR OWNER DISPLAY
  // ============================================
  const fetchOwners = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch users
      const usersResponse = await fetch(`${API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const usersData = await usersResponse.json();
      if (usersData.success) {
        const userMap = {};
        usersData.data.forEach(user => {
          userMap[user._id] = user;
        });
        setUsers(userMap);
      }

      // Fetch branches
      const branchesResponse = await fetch(`${API_URL}/branches`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const branchesData = await branchesResponse.json();
      if (branchesData.success) {
        const branchMap = {};
        branchesData.data.forEach(branch => {
          branchMap[branch._id] = branch;
        });
        setBranches(branchMap);
      }
    } catch (error) {
      console.error('Error fetching owners:', error);
    }
  };

  useEffect(() => {
    if (product) {
      setUnits(product.units || []);
      setPriceValues({
        purchase: product.price?.purchase || 0,
        sale: product.price?.sale || 0,
        best: product.price?.best || 0
      });
      // Fetch users and branches when product loads
      fetchOwners();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen || !product) return null;

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'Phones': return '📱';
      case 'Electronics': return '💻';
      case 'Accessories': return '🎧';
      default: return '📦';
    }
  };

  const getIdentifierLabel = () => {
    switch(product.category) {
      case 'Phones': return 'IMEI';
      case 'Electronics': return 'Serial Number';
      default: return 'ID';
    }
  };

  const getIdentifierPlaceholder = () => {
    switch(product.category) {
      case 'Phones': return 'Enter IMEI number (e.g., 123456789012345)';
      case 'Electronics': return 'Enter serial number (e.g., SN-2024-001)';
      default: return 'Enter identifier';
    }
  };

  const getStockStatus = (product) => {
    if (product.category === 'Accessories') {
      if (!product.stock || product.stock.quantity === 0) return { label: 'Out of Stock', class: 'out-of-stock' };
      if (product.stock.quantity <= product.stock.minLevel) return { label: 'Low Stock', class: 'low-stock' };
      return { label: 'In Stock', class: 'in-stock' };
    } else {
      const available = units?.filter(u => u.status === 'available').length || 0;
      if (available === 0) return { label: 'Out of Stock', class: 'out-of-stock' };
      if (available <= 2) return { label: 'Low Stock', class: 'low-stock' };
      return { label: `${available} Available`, class: 'in-stock' };
    }
  };

  const handleAddUnit = async () => {
    if (!newIdentifier.trim()) {
      alert(`Please enter a valid ${getIdentifierLabel()}`);
      return;
    }

    if (units.some(u => u.identifier === newIdentifier.trim())) {
      alert(`${getIdentifierLabel()} already exists!`);
      return;
    }

    setLoading(true);
    try {
      if (onUpdate) {
        await onUpdate({ 
          type: 'addUnit', 
          identifier: newIdentifier.trim(), 
          status: 'available' 
        });
      }
      
      setUnits([...units, { identifier: newIdentifier.trim(), status: 'available' }]);
      setNewIdentifier('');
      setLoading(false);
    } catch (error) {
      alert('Failed to add unit. Please try again.');
      setLoading(false);
    }
  };

  const handleBulkAdd = async () => {
    const identifiers = bulkIdentifiers.split('\n')
      .map(id => id.trim())
      .filter(id => id !== '');
    
    if (identifiers.length === 0) {
      alert('Please enter at least one identifier');
      return;
    }

    const existingIds = units.map(u => u.identifier);
    const duplicates = identifiers.filter(id => existingIds.includes(id));
    if (duplicates.length > 0) {
      if (!window.confirm(`${duplicates.length} identifier(s) already exist. Continue with the rest?`)) {
        return;
      }
    }

    setLoading(true);
    try {
      const newUnits = identifiers
        .filter(id => !existingIds.includes(id))
        .map(id => ({ identifier: id, status: 'available' }));
      
      if (newUnits.length === 0) {
        alert('All identifiers already exist');
        setLoading(false);
        return;
      }

      for (const unit of newUnits) {
        if (onUpdate) {
          await onUpdate({ 
            type: 'addUnit', 
            identifier: unit.identifier, 
            status: 'available' 
          });
        }
      }
      
      setUnits([...units, ...newUnits]);
      setBulkIdentifiers('');
      setShowBulkAdd(false);
      alert(`✅ ${newUnits.length} units added successfully!`);
      setLoading(false);
    } catch (error) {
      alert('Failed to add units. Please try again.');
      setLoading(false);
    }
  };

  const handleUpdateUnit = async (oldIdentifier, newIdentifier, newStatus) => {
    if (!newIdentifier.trim()) {
      alert('Identifier cannot be empty');
      return;
    }

    if (newIdentifier.trim() !== oldIdentifier && 
        units.some(u => u.identifier === newIdentifier.trim())) {
      alert(`${getIdentifierLabel()} already exists!`);
      return;
    }

    setLoading(true);
    try {
      if (onUpdate) {
        await onUpdate({ 
          type: 'updateUnit', 
          oldIdentifier, 
          newIdentifier: newIdentifier.trim(), 
          status: newStatus 
        });
      }
      
      setUnits(units.map(u => 
        u.identifier === oldIdentifier 
          ? { ...u, identifier: newIdentifier.trim(), status: newStatus }
          : u
      ));
      setEditingUnit(null);
      setEditingValue('');
      setEditingStatus('');
      setLoading(false);
    } catch (error) {
      alert('Failed to update unit. Please try again.');
      setLoading(false);
    }
  };

  const handleDeleteUnit = async (identifier) => {
    if (!window.confirm(`Delete ${getIdentifierLabel()} ${identifier}?`)) return;

    setLoading(true);
    try {
      if (onUpdate) {
        await onUpdate({ type: 'deleteUnit', identifier });
      }
      setUnits(units.filter(u => u.identifier !== identifier));
      setLoading(false);
    } catch (error) {
      alert('Failed to delete unit. Please try again.');
      setLoading(false);
    }
  };

  const handleUpdateStock = async () => {
    const stockInput = document.getElementById('stockQuantity');
    const newQuantity = parseInt(stockInput?.value);
    
    if (isNaN(newQuantity) || newQuantity < 0) {
      alert('Please enter a valid stock quantity');
      return;
    }

    setLoading(true);
    try {
      if (onUpdate) {
        await onUpdate({ type: 'updateStock', quantity: newQuantity });
      }
      setLoading(false);
      alert('✅ Stock updated successfully!');
    } catch (error) {
      alert('Failed to update stock. Please try again.');
      setLoading(false);
    }
  };

  const handlePriceChange = (field, value) => {
    setPriceValues(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const handleSavePrices = async () => {
    if (priceValues.sale <= 0) {
      alert('Selling price must be greater than 0');
      return;
    }

    setLoading(true);
    try {
      if (onUpdate) {
        await onUpdate({
          type: 'updatePrice',
          price: {
            purchase: priceValues.purchase,
            sale: priceValues.sale,
            best: priceValues.best
          }
        });
      }
      setEditingPrice(false);
      setLoading(false);
      alert('✅ Prices updated successfully!');
    } catch (error) {
      alert('Failed to update prices. Please try again.');
      setLoading(false);
    }
  };

  const filteredUnits = units.filter(unit => {
    const matchesSearch = unit.identifier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || unit.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  // ============================================
  // GET OWNER DISPLAY NAME
  // ============================================
  const getOwnerDisplay = (unit) => {
    // Check if assigned to a user
    if (unit.assignedTo && unit.assignedToType === 'user') {
      const user = users[unit.assignedTo];
      if (user) {
        return {
          name: user.name,
          type: 'user',
          icon: '👤',
          badge: 'badge-user'
        };
      }
      return {
        name: 'Unknown User',
        type: 'user',
        icon: '👤',
        badge: 'badge-user'
      };
    }

    // Check if assigned to a branch
    if (unit.assignedTo && unit.assignedToType === 'branch') {
      const branch = branches[unit.assignedTo];
      if (branch) {
        return {
          name: branch.name,
          type: 'branch',
          icon: '🏢',
          badge: 'badge-branch'
        };
      }
      return {
        name: 'Unknown Branch',
        type: 'branch',
        icon: '🏢',
        badge: 'badge-branch'
      };
    }

    // If unit has a branch directly
    if (unit.branch) {
      const branch = branches[unit.branch];
      if (branch) {
        return {
          name: branch.name,
          type: 'branch',
          icon: '🏢',
          badge: 'badge-branch'
        };
      }
    }

    // If product has a branch
    if (product?.branch) {
      const branchId = product.branch._id || product.branch;
      const branch = branches[branchId];
      if (branch) {
        return {
          name: branch.name,
          type: 'branch',
          icon: '🏢',
          badge: 'badge-branch'
        };
      }
    }

    return {
      name: 'Not Assigned',
      type: 'none',
      icon: '—',
      badge: 'badge-none'
    };
  };

  const stockStatus = getStockStatus(product);
  const isPhone = product.category === 'Phones';
  const isElectronics = product.category === 'Electronics';
  const isAccessory = product.category === 'Accessories';
  const identifierLabel = getIdentifierLabel();
  const identifierPlaceholder = getIdentifierPlaceholder();

  return (
    <div className="detail-modal-overlay" onClick={onClose}>
      <div className="detail-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="detail-modal-header">
          <div className="header-left">
            <span className="detail-category-icon">{getCategoryIcon(product.category)}</span>
            <div>
              <h2>{product.name}</h2>
              <div className="header-specs">
                <span className="spec-chip">{product.brand}</span>
                <span className="spec-chip">{product.model}</span>
                {product.ram && <span className="spec-chip">RAM: {product.ram}</span>}
                {product.rom && <span className="spec-chip">ROM: {product.rom}</span>}
                {product.barcode && <span className="spec-chip">Barcode: {product.barcode}</span>}
              </div>
            </div>
          </div>
          <button className="detail-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="detail-modal-body">
          {/* Pricing Summary */}
          <div className="pricing-summary">
            <div className="price-box editable">
              <span className="price-label">Buying</span>
              {editingPrice ? (
                <input
                  type="number"
                  className="price-edit-input"
                  value={priceValues.purchase}
                  onChange={(e) => handlePriceChange('purchase', e.target.value)}
                  min="0"
                  step="100"
                />
              ) : (
                <span className="price-amount">KSh {product.price?.purchase?.toLocaleString() || 0}</span>
              )}
            </div>
            <div className="price-box editable highlight">
              <span className="price-label">Selling <span className="edit-hint">(click to edit)</span></span>
              {editingPrice ? (
                <input
                  type="number"
                  className="price-edit-input highlight-input"
                  value={priceValues.sale}
                  onChange={(e) => handlePriceChange('sale', e.target.value)}
                  min="0"
                  step="100"
                />
              ) : (
                <span 
                  className="price-amount clickable"
                  onClick={() => setEditingPrice(true)}
                  title="Click to edit selling price"
                >
                  KSh {product.price?.sale?.toLocaleString() || 0} ✏️
                </span>
              )}
            </div>
            {product.price?.best && (
              <div className="price-box editable">
                <span className="price-label">Best</span>
                {editingPrice ? (
                  <input
                    type="number"
                    className="price-edit-input"
                    value={priceValues.best}
                    onChange={(e) => handlePriceChange('best', e.target.value)}
                    min="0"
                    step="100"
                  />
                ) : (
                  <span className="price-amount">KSh {product.price.best.toLocaleString()}</span>
                )}
              </div>
            )}
            <div className="price-box stock-status-box">
              <span className="price-label">Stock Status</span>
              <span className={`stock-status-badge ${stockStatus.class}`}>{stockStatus.label}</span>
            </div>
            {editingPrice && (
              <div className="price-edit-actions">
                <button className="btn-save-price" onClick={handleSavePrices} disabled={loading}>
                  {loading ? 'Saving...' : '💾 Save Prices'}
                </button>
                <button className="btn-cancel-price" onClick={() => {
                  setEditingPrice(false);
                  setPriceValues({
                    purchase: product.price?.purchase || 0,
                    sale: product.price?.sale || 0,
                    best: product.price?.best || 0
                  });
                }}>
                  ✕ Cancel
                </button>
              </div>
            )}
          </div>

          {/* Phone/Electronics View - Units Table WITH OWNER COLUMN */}
          {(isPhone || isElectronics) && (
            <div className="units-section">
              <div className="section-header">
                <div className="header-left">
                  <h3>{identifierLabel}s</h3>
                  <span className="unit-count">({units.length} total)</span>
                </div>
                <div className="header-right">
                  <span className="unit-stat available">
                    Available: {units.filter(u => u.status === 'available').length}
                  </span>
                  <span className="unit-stat sold">
                    Sold: {units.filter(u => u.status === 'sold').length}
                  </span>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="unit-controls">
                <div className="search-filter">
                  <input
                    type="text"
                    placeholder={`Search ${identifierLabel}s...`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input-small"
                  />
                  <select 
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="filter-select-small"
                  >
                    <option value="all">All Status</option>
                    <option value="available">Available</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>
                <div className="action-buttons-top">
                  <button 
                    className="btn-add-unit"
                    onClick={() => setShowBulkAdd(!showBulkAdd)}
                  >
                    📋 Bulk Add
                  </button>
                </div>
              </div>

              {/* Bulk Add Section */}
              {showBulkAdd && (
                <div className="bulk-add-section">
                  <textarea
                    placeholder={`Enter multiple ${identifierLabel}s, one per line`}
                    value={bulkIdentifiers}
                    onChange={(e) => setBulkIdentifiers(e.target.value)}
                    className="bulk-textarea"
                    rows={4}
                  />
                  <div className="bulk-actions">
                    <button 
                      className="btn-bulk-add"
                      onClick={handleBulkAdd}
                      disabled={loading}
                    >
                      {loading ? 'Adding...' : '➕ Bulk Add'}
                    </button>
                    <button 
                      className="btn-bulk-cancel"
                      onClick={() => setShowBulkAdd(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Add Single Unit */}
              <div className="add-unit-section">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={identifierPlaceholder}
                  value={newIdentifier}
                  onChange={(e) => setNewIdentifier(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddUnit()}
                  className="add-unit-input"
                  disabled={loading}
                />
                <button 
                  className="btn-add-unit-action"
                  onClick={handleAddUnit}
                  disabled={loading}
                >
                  {loading ? 'Adding...' : '➕ Add'}
                </button>
              </div>

              {/* Units Table - WITH OWNER COLUMN */}
              <div className="table-wrapper">
                <table className="units-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>#</th>
                      <th>{identifierLabel}</th>
                      <th style={{ width: '100px' }}>Status</th>
                      <th style={{ width: '180px' }}>Owner</th>
                      <th style={{ width: '150px' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUnits.length > 0 ? (
                      filteredUnits.map((unit, index) => {
                        const isEditing = editingUnit === unit.identifier;
                        const ownerInfo = getOwnerDisplay(unit);
                        
                        return (
                          <tr key={index} className={unit.status === 'sold' ? 'row-sold' : ''}>
                            <td>{index + 1}</td>
                            <td>
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editingValue}
                                  onChange={(e) => setEditingValue(e.target.value)}
                                  className="edit-input"
                                  autoFocus
                                />
                              ) : (
                                <span className="identifier-text">{unit.identifier}</span>
                              )}
                            </td>
                            <td>
                              {isEditing ? (
                                <select
                                  value={editingStatus}
                                  onChange={(e) => setEditingStatus(e.target.value)}
                                  className="edit-status-select"
                                >
                                  <option value="available">Available</option>
                                  <option value="sold">Sold</option>
                                </select>
                              ) : (
                                <span className={`status-badge ${unit.status}`}>
                                  {unit.status}
                                </span>
                              )}
                            </td>
                            <td>
                              {!isEditing && (
                                <span className={`owner-badge ${ownerInfo.badge}`}>
                                  <span className="owner-icon">{ownerInfo.icon}</span>
                                  <span className="owner-name">{ownerInfo.name}</span>
                                </span>
                              )}
                              {isEditing && (
                                <span className="owner-edit-placeholder">—</span>
                              )}
                            </td>
                            <td>
                              {isEditing ? (
                                <div className="edit-actions">
                                  <button 
                                    className="btn-save-edit"
                                    onClick={() => handleUpdateUnit(
                                      unit.identifier, 
                                      editingValue, 
                                      editingStatus
                                    )}
                                    disabled={loading}
                                  >
                                    💾 Save
                                  </button>
                                  <button 
                                    className="btn-cancel-edit"
                                    onClick={() => setEditingUnit(null)}
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <div className="action-buttons-table">
                                  <button 
                                    className="btn-action-edit"
                                    onClick={() => {
                                      setEditingUnit(unit.identifier);
                                      setEditingValue(unit.identifier);
                                      setEditingStatus(unit.status);
                                    }}
                                    title="Edit"
                                  >
                                    ✏️
                                  </button>
                                  <button 
                                    className="btn-action-delete"
                                    onClick={() => handleDeleteUnit(unit.identifier)}
                                    title="Delete"
                                    disabled={loading}
                                  >
                                    🗑️
                                  </button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="no-data">
                          {searchTerm ? 'No matching identifiers found' : `No ${identifierLabel}s added yet`}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer Stats */}
              <div className="table-footer">
                <span>
                  Showing {filteredUnits.length} of {units.length} {identifierLabel}s
                </span>
                <span>
                  Available: {units.filter(u => u.status === 'available').length} | 
                  Sold: {units.filter(u => u.status === 'sold').length}
                </span>
              </div>
            </div>
          )}

          {/* Accessory View - Stock Management */}
          {isAccessory && (
            <div className="accessory-section">
              <div className="stock-management">
                <h3>Stock Management</h3>
                <div className="stock-cards">
                  <div className="stock-card-item">
                    <span className="stock-label">Current Quantity</span>
                    <span className="stock-value">{product.stock?.quantity || 0}</span>
                  </div>
                  <div className="stock-card-item">
                    <span className="stock-label">Minimum Level</span>
                    <span className="stock-value">{product.stock?.minLevel || 5}</span>
                  </div>
                  <div className="stock-card-item">
                    <span className="stock-label">Status</span>
                    <span className={`stock-status-text ${stockStatus.class}`}>{stockStatus.label}</span>
                  </div>
                </div>

                <div className="stock-update">
                  <div className="stock-input-group">
                    <label>Update Quantity</label>
                    <div className="stock-input-row">
                      <input
                        id="stockQuantity"
                        type="number"
                        defaultValue={product.stock?.quantity || 0}
                        min="0"
                        className="stock-input-number"
                        placeholder="Enter new quantity"
                      />
                      <div className="stock-quick-actions">
                        <button 
                          className="btn-quick-add"
                          onClick={() => {
                            const input = document.getElementById('stockQuantity');
                            input.value = parseInt(input.value || 0) + 1;
                          }}
                        >
                          +1
                        </button>
                        <button 
                          className="btn-quick-add"
                          onClick={() => {
                            const input = document.getElementById('stockQuantity');
                            input.value = parseInt(input.value || 0) + 10;
                          }}
                        >
                          +10
                        </button>
                        <button 
                          className="btn-quick-subtract"
                          onClick={() => {
                            const input = document.getElementById('stockQuantity');
                            const val = parseInt(input.value || 0);
                            if (val > 0) {
                              input.value = val - 1;
                            }
                          }}
                        >
                          -1
                        </button>
                      </div>
                    </div>
                    <button 
                      className="btn-update-stock"
                      onClick={handleUpdateStock}
                      disabled={loading}
                    >
                      {loading ? 'Updating...' : '📦 Update Stock'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="detail-modal-footer">
          <button className="btn-close-detail" onClick={onClose}>
            Close
          </button>
          {!isAccessory && (
            <span className="footer-info">
              {units.filter(u => u.status === 'available').length} available units
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;