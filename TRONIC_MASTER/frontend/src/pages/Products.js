import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import ProductModal from '../components/products/ProductModal';
import ProductDetailModal from '../components/products/ProductDetailModal';
import RestockModal from '../components/products/RestockModal';
import { productService } from '../services/productService';
import './Products.css';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [restockProduct, setRestockProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [filterBranch, setFilterBranch] = useState('all');
  const [branches, setBranches] = useState([]);
  
  // Action Modal
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  const categories = ['Phones', 'Electronics', 'Accessories'];
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

  // ============================================
  // FETCH DATA
  // ============================================
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await productService.getProducts();
      setProducts(response.data || []);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/branches`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setBranches(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchBranches();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterBranch, activeTab]);

  // ============================================
  // UPLOAD PRODUCT IMAGE
  // ============================================
  const uploadProductImage = async (productId, imageFile) => {
    if (!imageFile) return null;

    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/products/${productId}/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        return data.data.image;
      }
      return null;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  // ============================================
  // HANDLE SAVE PRODUCT WITH IMAGE
  // ============================================
  const handleSaveProduct = async (productData, imageFile) => {
    try {
      let response;

      if (editingProduct) {
        response = await productService.updateProduct(editingProduct._id, productData);
        
        if (imageFile && response.success) {
          await uploadProductImage(editingProduct._id, imageFile);
        }
      } else {
        response = await productService.createProduct(productData);
        
        if (imageFile && response.success && response.data) {
          const productId = response.data._id;
          await uploadProductImage(productId, imageFile);
        }
      }

      if (response.success) {
        await fetchProducts();
        setShowModal(false);
        setShowActionModal(false);
        alert(editingProduct ? 'Product updated successfully!' : 'Product created successfully!');
      } else {
        alert(response.message || 'Failed to save product');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      alert(error.message || 'Failed to save product');
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowModal(true);
  };

  const handleEditProduct = (product) => {
    setEditingProduct(product);
    setShowModal(true);
    setShowActionModal(false);
  };

  const handleViewProduct = (product) => {
    setViewingProduct(product);
    setShowDetailModal(true);
    setShowActionModal(false);
  };

  const handleRestockProduct = (product) => {
    setRestockProduct(product);
    setShowRestockModal(true);
    setShowActionModal(false);
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await productService.deleteProduct(id);
      await fetchProducts();
      setShowActionModal(false);
      alert('Product deleted successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  // ============================================
  // ACTION MODAL HANDLERS
  // ============================================
  const openActionModal = (product) => {
    setSelectedProduct(product);
    setShowActionModal(true);
  };

  const closeActionModal = () => {
    setShowActionModal(false);
    setSelectedProduct(null);
  };

  // ============================================
  // HANDLE RESTOCK
  // ============================================
  const handleRestock = async (restockData) => {
    try {
      const { productId, units, quantity } = restockData;
      
      const product = products.find(p => p._id === productId);
      if (!product) {
        alert('Product not found');
        return;
      }

      const isSingleItem = product.category !== 'Accessories';

      if (isSingleItem) {
        if (!units || units.length === 0) {
          alert('Please add at least one unit');
          return;
        }

        let addedCount = 0;
        let duplicateCount = 0;

        for (const unit of units) {
          try {
            await productService.addUnit(productId, {
              identifier: unit.identifier,
              status: unit.status || 'available'
            });
            addedCount++;
          } catch (error) {
            if (error.message.includes('already exists')) {
              duplicateCount++;
            } else {
              throw error;
            }
          }
        }

        await fetchProducts();
        alert(`✅ ${addedCount} unit(s) added successfully!${duplicateCount > 0 ? ` ${duplicateCount} duplicate(s) skipped.` : ''}`);
      } else {
        if (!quantity || quantity <= 0) {
          alert('Please enter a valid quantity');
          return;
        }

        await productService.updateStock(productId, { quantity });
        await fetchProducts();
        alert(`✅ Stock updated successfully! New quantity: ${quantity}`);
      }

      setShowRestockModal(false);
      setRestockProduct(null);
      setShowActionModal(false);
    } catch (error) {
      console.error('Error restocking:', error);
      alert(error.message || 'Failed to restock product');
    }
  };

  // ============================================
  // HANDLE UNIT UPDATES FROM DETAIL MODAL
  // ============================================
  const handleProductUpdate = async (updateData) => {
    if (!viewingProduct) return;

    try {
      const { type, identifier, status, oldIdentifier, newIdentifier, quantity, price } = updateData;

      switch (type) {
        case 'addUnit':
          const addResponse = await productService.addUnit(viewingProduct._id, {
            identifier,
            status: status || 'available'
          });
          if (addResponse.success) {
            setViewingProduct(prev => ({
              ...prev,
              units: [...(prev.units || []), { identifier, status: status || 'available' }]
            }));
            await fetchProducts();
          }
          break;

        case 'updateUnit':
          const updateResponse = await productService.updateUnit(
            viewingProduct._id,
            oldIdentifier,
            { identifier: newIdentifier, status }
          );
          if (updateResponse.success) {
            setViewingProduct(prev => ({
              ...prev,
              units: prev.units.map(u => 
                u.identifier === oldIdentifier 
                  ? { ...u, identifier: newIdentifier, status }
                  : u
              )
            }));
            await fetchProducts();
          }
          break;

        case 'deleteUnit':
          const deleteResponse = await productService.deleteUnit(viewingProduct._id, identifier);
          if (deleteResponse.success) {
            setViewingProduct(prev => ({
              ...prev,
              units: prev.units.filter(u => u.identifier !== identifier)
            }));
            await fetchProducts();
          }
          break;

        case 'updateStock':
          const stockResponse = await productService.updateStock(viewingProduct._id, { quantity });
          if (stockResponse.success) {
            setViewingProduct(prev => ({
              ...prev,
              stock: { ...prev.stock, quantity }
            }));
            await fetchProducts();
          }
          break;

        case 'updatePrice':
          const priceResponse = await productService.updatePrice(viewingProduct._id, {
            purchase: price.purchase,
            sale: price.sale,
            best: price.best
          });
          if (priceResponse.success) {
            setViewingProduct(prev => ({
              ...prev,
              price: price
            }));
            await fetchProducts();
          }
          break;

        default:
          console.warn('Unknown update type:', type);
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert(error.message || 'Failed to update product');
    }
  };

  // Get filtered products based on active tab
  const getTabProducts = () => {
    if (activeTab === 'all') return products;
    return products.filter(p => p.category === activeTab);
  };

  const filteredProducts = getTabProducts().filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.barcode?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBranch = filterBranch === 'all' || product.branch?._id === filterBranch || product.branch === filterBranch;
    return matchesSearch && matchesBranch;
  });

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'Phones': return '📱';
      case 'Electronics': return '💻';
      case 'Accessories': return '🎧';
      default: return '📦';
    }
  };

  // Get available count for a product
  const getAvailableCount = (product) => {
    if (product.category === 'Accessories') {
      return product.stock?.quantity || 0;
    } else {
      if (!product.units || product.units.length === 0) return 0;
      return product.units.filter(unit => unit.status === 'available').length;
    }
  };

  const getStockStatus = (product) => {
    if (product.category === 'Accessories') {
      if (!product.stock || product.stock.quantity === 0) return { label: 'Out of Stock', class: 'out-of-stock' };
      if (product.stock.quantity <= product.stock.minLevel) return { label: 'Low Stock', class: 'low-stock' };
      return { label: 'In Stock', class: 'in-stock' };
    } else {
      const available = getAvailableCount(product);
      if (available === 0) return { label: 'Out of Stock', class: 'out-of-stock' };
      if (available <= 2) return { label: 'Low Stock', class: 'low-stock' };
      return { label: `${available} Available`, class: 'in-stock' };
    }
  };

  // Get currency for a product based on its branch
  const getProductCurrency = (product) => {
    if (!product) return { symbol: 'KSh', code: 'KES' };
    
    if (product.branch) {
      return {
        symbol: product.branch.currencySymbol || 'KSh',
        code: product.branch.currency || 'KES'
      };
    }
    
    if (product.branchId) {
      const branch = branches.find(b => b._id === product.branchId);
      if (branch) {
        return {
          symbol: branch.currencySymbol || 'KSh',
          code: branch.currency || 'KES'
        };
      }
    }
    
    return { symbol: 'KSh', code: 'KES' };
  };

  // Format price with currency
  const formatPrice = (price, product) => {
    const currency = getProductCurrency(product);
    if (price === undefined || price === null || price === '') {
      return `${currency.symbol} 0`;
    }
    return `${currency.symbol} ${Number(price).toLocaleString()}`;
  };

  // Format specs (RAM/ROM) for display
  const formatSpecs = (product) => {
    if (!product) return '-';
    
    const ram = product.ram || product.RAM || product.specs?.ram || '';
    const rom = product.rom || product.ROM || product.storage || product.specs?.storage || product.specs?.rom || '';
    
    if (ram && rom) {
      return `${ram} / ${rom}`;
    } else if (ram) {
      return `RAM: ${ram}`;
    } else if (rom) {
      return `ROM: ${rom}`;
    }
    
    if (product.specs && typeof product.specs === 'object') {
      const specParts = [];
      if (product.specs.ram) specParts.push(`RAM: ${product.specs.ram}`);
      if (product.specs.rom || product.specs.storage) {
        specParts.push(`ROM: ${product.specs.rom || product.specs.storage}`);
      }
      if (specParts.length > 0) {
        return specParts.join(' | ');
      }
    }
    
    return '-';
  };

  const getTabCount = (category) => {
    if (category === 'all') return products.length;
    return products.filter(p => p.category === category).length;
  };

  const getBranchName = (product) => {
    if (!product.branch) return 'Not Assigned';
    return product.branch.name || 'Not Assigned';
  };

  const getBranchLocation = (product) => {
    if (!product.branch) return '';
    return `${product.branch.city || ''}, ${product.branch.country || ''}`.trim();
  };

  // ============================================
  // PAGINATION
  // ============================================
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = Math.min(startIndex + entriesPerPage, totalItems);
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleEntriesChange = (e) => {
    setEntriesPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  // Render pagination buttons
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

  return (
    <MainLayout title="Products" breadcrumbs={['Home', 'Products']}>
      <div className="products-page">
        <div className="products-header">
          <div className="header-left">
            <h2>Product Management</h2>
            <p>Manage your electronics inventory</p>
          </div>
          <div className="header-right">
            <button className="btn-primary btn-restock" onClick={() => setShowRestockModal(true)}>
              📦 Restock Product
            </button>
            <button className="btn-primary" onClick={handleAddProduct}>
              <span>➕</span> Add Product
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="products-tabs">
          <button 
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            📦 All Products <span className="tab-count">{getTabCount('all')}</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'Phones' ? 'active' : ''}`}
            onClick={() => setActiveTab('Phones')}
          >
            📱 Phones <span className="tab-count">{getTabCount('Phones')}</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'Electronics' ? 'active' : ''}`}
            onClick={() => setActiveTab('Electronics')}
          >
            💻 Electronics <span className="tab-count">{getTabCount('Electronics')}</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'Accessories' ? 'active' : ''}`}
            onClick={() => setActiveTab('Accessories')}
          >
            🎧 Accessories <span className="tab-count">{getTabCount('Accessories')}</span>
          </button>
        </div>

        {/* Search and Filters */}
        <div className="products-filters">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-group">
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Branches</option>
              {branches.map(branch => (
                <option key={branch._id} value={branch._id}>
                  {branch.name} ({branch.city}) - {branch.currencySymbol || 'KSh'}
                </option>
              ))}
            </select>
          </div>
          <button className="btn-refresh" onClick={fetchProducts}>
            🔄 Refresh
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading products...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>❌ {error}</p>
            <button onClick={fetchProducts}>Retry</button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">📦</span>
            <h3>No Products Found</h3>
            <p>Start by adding your first product</p>
            <button className="btn-primary" onClick={handleAddProduct}>
              <span>➕</span> Add Product
            </button>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="products-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Brand</th>
                    <th>Model</th>
                    <th>SKU</th>
                    <th>Specs</th>
                    <th>Branch</th>
                    <th>Stock</th>
                    <th>Buying</th>
                    <th>Selling</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((product, index) => {
                    const stockStatus = getStockStatus(product);
                    const availableCount = getAvailableCount(product);
                    const currency = getProductCurrency(product);
                    
                    return (
                      <tr key={product._id}>
                        <td>{startIndex + index + 1}</td>
                        <td>
                          <div className="product-name-cell">
                            <span className="product-name">{product.name}</span>
                            {product.imei && <span className="product-identifier">IMEI: {product.imei}</span>}
                            {product.serialNumber && <span className="product-identifier">SN: {product.serialNumber}</span>}
                            {product.barcode && <span className="product-identifier">Barcode: {product.barcode}</span>}
                          </div>
                        </td>
                        <td>
                          <span className={`category-badge category-${product.category?.toLowerCase()}`}>
                            {getCategoryIcon(product.category)} {product.category}
                          </span>
                        </td>
                        <td>{product.brand}</td>
                        <td>{product.model}</td>
                        <td>
                          <span className="sku-cell">{product.sku || '—'}</span>
                        </td>
                        <td className="specs-cell">{formatSpecs(product)}</td>
                        <td>
                          <div className="branch-cell">
                            {product.branch ? (
                              <>
                                <span className="branch-name">{getBranchName(product)}</span>
                                <span className="branch-location">{getBranchLocation(product)}</span>
                                <span className="branch-currency">{currency.symbol}</span>
                              </>
                            ) : (
                              <span className="no-branch">Not Assigned</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="stock-cell">
                            <span className="stock-quantity">{availableCount}</span>
                            <span className={`stock-badge ${stockStatus.class}`}>{stockStatus.label}</span>
                          </div>
                        </td>
                        <td className="price-cell">
                          {formatPrice(product.price?.purchase, product)}
                        </td>
                        <td className="price-cell">
                          {formatPrice(product.price?.sale, product)}
                        </td>
                        <td>
                          <button 
                            className="btn-action-menu"
                            onClick={() => openActionModal(product)}
                            title="Actions"
                          >
                            ⋮
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {filteredProducts.length > 0 && (
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

        {/* ============================================ */}
        {/* ACTION MODAL - Clean Action Menu */}
        {/* ============================================ */}
        {showActionModal && selectedProduct && (
          <div className="action-modal-overlay" onClick={closeActionModal}>
            <div className="action-modal" onClick={(e) => e.stopPropagation()}>
              <div className="action-modal-header">
                <h3>Product Actions</h3>
                <button className="action-modal-close" onClick={closeActionModal}>✕</button>
              </div>
              <div className="action-modal-body">
                <div className="action-product-info">
                  <div className="action-product-name">{selectedProduct.name}</div>
                  <div className="action-product-details">
                    <span className="action-product-sku">SKU: {selectedProduct.sku || 'N/A'}</span>
                    <span className={`category-badge category-${selectedProduct.category?.toLowerCase()}`}>
                      {selectedProduct.category}
                    </span>
                  </div>
                </div>

                <div className="action-buttons-grid">
                  <button 
                    className="action-btn action-btn-view"
                    onClick={() => handleViewProduct(selectedProduct)}
                  >
                    <span className="action-btn-icon">👁️</span>
                    <span className="action-btn-label">View Details</span>
                    <span className="action-btn-desc">View full product information</span>
                  </button>

                  <button 
                    className="action-btn action-btn-edit"
                    onClick={() => handleEditProduct(selectedProduct)}
                  >
                    <span className="action-btn-icon">✏️</span>
                    <span className="action-btn-label">Edit Product</span>
                    <span className="action-btn-desc">Modify product details</span>
                  </button>

                  <button 
                    className="action-btn action-btn-restock"
                    onClick={() => handleRestockProduct(selectedProduct)}
                  >
                    <span className="action-btn-icon">📦</span>
                    <span className="action-btn-label">Restock</span>
                    <span className="action-btn-desc">Add stock or units</span>
                  </button>

                  <button 
                    className="action-btn action-btn-delete"
                    onClick={() => handleDeleteProduct(selectedProduct._id)}
                  >
                    <span className="action-btn-icon">🗑️</span>
                    <span className="action-btn-label">Delete</span>
                    <span className="action-btn-desc">Permanently remove product</span>
                  </button>
                </div>
              </div>
              <div className="action-modal-footer">
                <button className="action-modal-cancel" onClick={closeActionModal}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <ProductModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onSave={handleSaveProduct}
          product={editingProduct}
          categories={categories}
        />

        <ProductDetailModal
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setViewingProduct(null);
            fetchProducts();
          }}
          product={viewingProduct}
          onUpdate={handleProductUpdate}
        />

        <RestockModal
          isOpen={showRestockModal}
          onClose={() => {
            setShowRestockModal(false);
            setRestockProduct(null);
          }}
          onRestock={handleRestock}
          product={restockProduct}
          products={products}
          categories={categories}
        />
      </div>
    </MainLayout>
  );
};

export default Products;