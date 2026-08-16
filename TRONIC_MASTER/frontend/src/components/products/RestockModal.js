// /home/kk/RS/TRONIC_MASTER/frontend/src/components/products/RestockModal.js

import React, { useState, useEffect, useRef } from 'react';
import BarcodeScanner from './BarcodeScanner';
import './RestockModal.css';

const RestockModal = ({ isOpen, onClose, onRestock, product, products, categories }) => {
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showScanner, setShowScanner] = useState(false);
  const [units, setUnits] = useState([]);
  const [identifierInput, setIdentifierInput] = useState('');
  const [unitStatus, setUnitStatus] = useState('available');
  const [quantity, setQuantity] = useState('');
  const [editingUnitIndex, setEditingUnitIndex] = useState(null);
  const [editingUnitValue, setEditingUnitValue] = useState('');
  const [editingUnitStatus, setEditingUnitStatus] = useState('');
  const [bulkIdentifiers, setBulkIdentifiers] = useState('');
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (product) {
      setSelectedProduct(product);
      setSearchTerm(product.name);
    }
  }, [product]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 100);
    }
  }, [isOpen]);

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (term.length > 1) {
      const results = products.filter(p => 
        p.name.toLowerCase().includes(term.toLowerCase()) ||
        p.brand.toLowerCase().includes(term.toLowerCase()) ||
        p.model.toLowerCase().includes(term.toLowerCase())
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setSearchTerm(product.name);
    setSearchResults([]);
    setUnits([]);
    setQuantity('');
  };

  const getIdentifierLabel = () => {
    if (!selectedProduct) return 'Identifier';
    switch(selectedProduct.category) {
      case 'Phones': return 'IMEI';
      case 'Electronics': return 'Serial Number';
      default: return 'Identifier';
    }
  };

  const getIdentifierPlaceholder = () => {
    if (!selectedProduct) return 'Enter identifier';
    switch(selectedProduct.category) {
      case 'Phones': return 'Enter IMEI number (e.g., 123456789012345)';
      case 'Electronics': return 'Enter serial number (e.g., SN-2024-001)';
      default: return 'Enter identifier';
    }
  };

  const handleAddUnit = () => {
    if (!identifierInput.trim()) {
      alert(`Please enter a ${getIdentifierLabel()}`);
      return;
    }

    if (units.some(u => u.identifier === identifierInput.trim())) {
      alert(`${getIdentifierLabel()} already exists!`);
      return;
    }

    setUnits([...units, { 
      identifier: identifierInput.trim(), 
      status: unitStatus 
    }]);
    setIdentifierInput('');
  };

  const handleBulkAdd = () => {
    const identifiers = bulkIdentifiers.split('\n')
      .map(id => id.trim())
      .filter(id => id !== '');
    
    if (identifiers.length === 0) {
      alert('Please enter at least one identifier');
      return;
    }

    const existingIds = units.map(u => u.identifier);
    const newUnits = identifiers
      .filter(id => !existingIds.includes(id))
      .map(id => ({ identifier: id, status: 'available' }));

    if (newUnits.length === 0) {
      alert('All identifiers already exist');
      return;
    }

    setUnits([...units, ...newUnits]);
    setBulkIdentifiers('');
    setShowBulkAdd(false);
    alert(`✅ ${newUnits.length} units added!`);
  };

  const handleRemoveUnit = (index) => {
    if (!window.confirm('Remove this unit?')) return;
    setUnits(units.filter((_, i) => i !== index));
  };

  const handleStartEdit = (index) => {
    setEditingUnitIndex(index);
    setEditingUnitValue(units[index].identifier);
    setEditingUnitStatus(units[index].status);
  };

  const handleSaveEdit = (index) => {
    if (!editingUnitValue.trim()) {
      alert('Identifier cannot be empty');
      return;
    }

    const oldIdentifier = units[index].identifier;
    if (editingUnitValue.trim() !== oldIdentifier && 
        units.some((u, i) => i !== index && u.identifier === editingUnitValue.trim())) {
      alert(`${getIdentifierLabel()} already exists!`);
      return;
    }

    setUnits(units.map((u, i) => 
      i === index ? { ...u, identifier: editingUnitValue.trim(), status: editingUnitStatus } : u
    ));
    setEditingUnitIndex(null);
    setEditingUnitValue('');
    setEditingUnitStatus('');
  };

  const handleScan = (scannedValue) => {
    if (units.some(u => u.identifier === scannedValue)) {
      alert(`${getIdentifierLabel()} already exists!`);
      setShowScanner(false);
      return;
    }

    setUnits([...units, { 
      identifier: scannedValue, 
      status: unitStatus 
    }]);
    setShowScanner(false);
    alert(`✅ ${getIdentifierLabel()} added successfully!`);
  };

  const handleSubmit = () => {
    if (!selectedProduct) {
      alert('Please select a product');
      return;
    }

    const isSingleItem = selectedProduct.category !== 'Accessories';

    if (isSingleItem && units.length === 0) {
      alert(`Please add at least one ${getIdentifierLabel()}`);
      return;
    }

    if (!isSingleItem && (!quantity || parseInt(quantity) <= 0)) {
      alert('Please enter a valid quantity');
      return;
    }

    onRestock({
      productId: selectedProduct._id,
      units: isSingleItem ? units : undefined,
      quantity: !isSingleItem ? parseInt(quantity) : undefined
    });
  };

  if (!isOpen) return null;

  const isSingleItem = selectedProduct ? selectedProduct.category !== 'Accessories' : false;
  const identifierLabel = getIdentifierLabel();
  const identifierPlaceholder = getIdentifierPlaceholder();

  return (
    <div className="restock-modal-overlay" onClick={onClose}>
      <div className="restock-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="restock-modal-header">
          <h2>📦 Restock Product</h2>
          <button className="restock-modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="restock-modal-body">
          {/* Search Product */}
          <div className="restock-search-section">
            <label>Search Product</label>
            <div className="search-input-wrapper">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search by name, brand, or model..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="restock-search-input"
              />
              {searchResults.length > 0 && (
                <div className="search-results">
                  {searchResults.map(result => (
                    <div 
                      key={result._id}
                      className="search-result-item"
                      onClick={() => handleSelectProduct(result)}
                    >
                      <div className="result-main">
                        <span className="result-name">{result.name}</span>
                        <span className="result-category">{result.category}</span>
                      </div>
                      <div className="result-details">
                        <span>Brand: {result.brand}</span>
                        <span>Model: {result.model}</span>
                        {result.ram && <span>RAM: {result.ram}</span>}
                        {result.rom && <span>ROM: {result.rom}</span>}
                      </div>
                      <div className="result-stock">
                        {result.category === 'Accessories' 
                          ? `📦 Stock: ${result.stock?.quantity || 0}`
                          : `📱 Units: ${result.units?.length || 0}`
                        }
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Selected Product Info - Enhanced with all details */}
          {selectedProduct && (
            <div className="restock-product-info">
              <div className="product-info-card">
                <div className="product-info-header">
                  <span className="product-category-badge">
                    {selectedProduct.category === 'Phones' && '📱'}
                    {selectedProduct.category === 'Electronics' && '💻'}
                    {selectedProduct.category === 'Accessories' && '🎧'}
                    {selectedProduct.category}
                  </span>
                  <h3>{selectedProduct.name}</h3>
                </div>
                
                <div className="product-info-grid">
                  <div className="info-item">
                    <span className="info-label">Brand</span>
                    <span className="info-value">{selectedProduct.brand}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Model</span>
                    <span className="info-value">{selectedProduct.model}</span>
                  </div>
                  {selectedProduct.ram && (
                    <div className="info-item">
                      <span className="info-label">RAM</span>
                      <span className="info-value">{selectedProduct.ram}</span>
                    </div>
                  )}
                  {selectedProduct.rom && (
                    <div className="info-item">
                      <span className="info-label">ROM</span>
                      <span className="info-value">{selectedProduct.rom}</span>
                    </div>
                  )}
                  {selectedProduct.imei && (
                    <div className="info-item">
                      <span className="info-label">IMEI</span>
                      <span className="info-value">{selectedProduct.imei}</span>
                    </div>
                  )}
                  {selectedProduct.serialNumber && (
                    <div className="info-item">
                      <span className="info-label">Serial</span>
                      <span className="info-value">{selectedProduct.serialNumber}</span>
                    </div>
                  )}
                  {selectedProduct.barcode && (
                    <div className="info-item">
                      <span className="info-label">Barcode</span>
                      <span className="info-value">{selectedProduct.barcode}</span>
                    </div>
                  )}
                </div>

                <div className="product-info-stock">
                  <div className="stock-item current-stock">
                    <span className="stock-label">Current Stock</span>
                    <span className="stock-value">
                      {selectedProduct.category === 'Accessories' 
                        ? `${selectedProduct.stock?.quantity || 0} units`
                        : `${selectedProduct.units?.length || 0} units`
                      }
                    </span>
                  </div>
                  <div className="stock-item stock-status">
                    <span className="stock-label">Status</span>
                    <span className={`stock-status-badge ${selectedProduct.category === 'Accessories' 
                      ? (selectedProduct.stock?.quantity > selectedProduct.stock?.minLevel ? 'in-stock' : 'low-stock')
                      : (selectedProduct.units?.filter(u => u.status === 'available').length > 2 ? 'in-stock' : 'low-stock')
                    }`}>
                      {selectedProduct.category === 'Accessories' 
                        ? (selectedProduct.stock?.quantity > selectedProduct.stock?.minLevel ? 'In Stock' : 'Low Stock')
                        : (selectedProduct.units?.filter(u => u.status === 'available').length > 2 ? 'In Stock' : 'Low Stock')
                      }
                    </span>
                  </div>
                  {selectedProduct.category !== 'Accessories' && selectedProduct.units && (
                    <div className="stock-item unit-stats">
                      <span className="stock-label">Units</span>
                      <span className="stock-value">
                        <span className="available">Avail: {selectedProduct.units.filter(u => u.status === 'available').length}</span>
                        <span className="sold">Sold: {selectedProduct.units.filter(u => u.status === 'sold').length}</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Restock Section */}
          {selectedProduct && (
            <div className="restock-section">
              {isSingleItem ? (
                // Phone/Electronics - Add Units
                <div className="units-restock">
                  <div className="units-header">
                    <h4>Add {identifierLabel}s</h4>
                    <div className="units-actions">
                      <button 
                        type="button" 
                        className="btn-bulk-toggle"
                        onClick={() => setShowBulkAdd(!showBulkAdd)}
                      >
                        📋 {showBulkAdd ? 'Hide Bulk' : 'Bulk Add'}
                      </button>
                    </div>
                  </div>

                  {showBulkAdd && (
                    <div className="bulk-add-section">
                      <textarea
                        placeholder={`Enter multiple ${identifierLabel}s, one per line`}
                        value={bulkIdentifiers}
                        onChange={(e) => setBulkIdentifiers(e.target.value)}
                        className="bulk-textarea"
                        rows={3}
                      />
                      <div className="bulk-actions">
                        <button type="button" className="btn-bulk-add" onClick={handleBulkAdd}>
                          ➕ Bulk Add
                        </button>
                        <button type="button" className="btn-bulk-cancel" onClick={() => setShowBulkAdd(false)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="add-unit-row">
                    <input
                      type="text"
                      value={identifierInput}
                      onChange={(e) => setIdentifierInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddUnit()}
                      placeholder={identifierPlaceholder}
                      className="add-unit-input"
                    />
                    <select 
                      value={unitStatus} 
                      onChange={(e) => setUnitStatus(e.target.value)}
                      className="unit-status-select"
                    >
                      <option value="available">Available</option>
                      <option value="sold">Sold</option>
                    </select>
                    <button type="button" className="btn-add-unit" onClick={handleAddUnit}>
                      ➕ Add
                    </button>
                    <button type="button" className="btn-scan-unit" onClick={() => setShowScanner(true)}>
                      📷 Scan
                    </button>
                  </div>

                  <div className="units-list">
                    {units.length === 0 ? (
                      <p className="no-units-msg">No {identifierLabel}s added yet</p>
                    ) : (
                      units.map((unit, index) => {
                        const isEditing = editingUnitIndex === index;
                        return (
                          <div key={index} className="unit-item">
                            {isEditing ? (
                              <>
                                <input
                                  type="text"
                                  value={editingUnitValue}
                                  onChange={(e) => setEditingUnitValue(e.target.value)}
                                  className="edit-input-small"
                                />
                                <select
                                  value={editingUnitStatus}
                                  onChange={(e) => setEditingUnitStatus(e.target.value)}
                                  className="edit-status-select-small"
                                >
                                  <option value="available">Available</option>
                                  <option value="sold">Sold</option>
                                </select>
                                <button className="btn-save-edit-small" onClick={() => handleSaveEdit(index)}>
                                  💾
                                </button>
                                <button className="btn-cancel-edit-small" onClick={() => setEditingUnitIndex(null)}>
                                  ✕
                                </button>
                              </>
                            ) : (
                              <>
                                <span className="unit-identifier">{unit.identifier}</span>
                                <span className={`unit-status-badge ${unit.status}`}>{unit.status}</span>
                                <button className="btn-edit-unit" onClick={() => handleStartEdit(index)}>✏️</button>
                                <button className="btn-remove-unit" onClick={() => handleRemoveUnit(index)}>🗑️</button>
                              </>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  <div className="units-stats">
                    <span>Total: {units.length}</span>
                    <span className="available">Available: {units.filter(u => u.status === 'available').length}</span>
                    <span className="sold">Sold: {units.filter(u => u.status === 'sold').length}</span>
                  </div>
                </div>
              ) : (
                // Accessory - Add Quantity
                <div className="quantity-restock">
                  <h4>Add Stock Quantity</h4>
                  <div className="quantity-input-group">
                    <label>Quantity to Add</label>
                    <div className="quantity-input-row">
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="Enter quantity..."
                        className="quantity-input"
                        min="1"
                      />
                      <div className="quantity-quick-actions">
                        <button className="btn-quick-add" onClick={() => setQuantity(String((parseInt(quantity) || 0) + 1))}>
                          +1
                        </button>
                        <button className="btn-quick-add" onClick={() => setQuantity(String((parseInt(quantity) || 0) + 5))}>
                          +5
                        </button>
                        <button className="btn-quick-add" onClick={() => setQuantity(String((parseInt(quantity) || 0) + 10))}>
                          +10
                        </button>
                      </div>
                    </div>
                    <div className="current-stock-info">
                      Current Stock: {selectedProduct.stock?.quantity || 0}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="restock-modal-footer">
          <button type="button" className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn-restock" onClick={handleSubmit}>
            📦 Restock
          </button>
        </div>
      </div>

      {showScanner && (
        <BarcodeScanner 
          onScan={handleScan} 
          onClose={() => setShowScanner(false)} 
          label={`Scan ${identifierLabel}`}
        />
      )}
    </div>
  );
};

export default RestockModal;