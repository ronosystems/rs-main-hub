// /home/kk/RS/TRONIC_MASTER/frontend/src/pages/Reports.js

import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../context/AuthContext';
import { productService } from '../services/productService';
import { saleService } from '../services/saleService';
import { FaFileDownload, FaSync, FaBox, FaShoppingCart, FaPlus, FaCalendarAlt } from 'react-icons/fa';
import './Reports.css';

const Reports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('phones');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [showDatePicker, setShowDatePicker] = useState(false);

  // State for each category
  const [phonesData, setPhonesData] = useState({
    total: 0,
    sold: 0,
    added: 0,
    sales: [],
    soldItems: []
  });
  const [electronicsData, setElectronicsData] = useState({
    total: 0,
    sold: 0,
    added: 0,
    sales: [],
    soldItems: []
  });
  const [accessoriesData, setAccessoriesData] = useState({
    total: 0,
    sold: 0,
    added: 0,
    sales: [],
    soldItems: []
  });

  const [error, setError] = useState(null);

  // Helper: Get product model with specs for Phones
  const getProductModel = useCallback((product) => {
    if (!product) return 'N/A';
    
    let model = product.model || 'N/A';
    if (product.category === 'Phones') {
      const specs = [];
      if (product.ram) specs.push(`RAM: ${product.ram}`);
      if (product.rom) specs.push(`ROM: ${product.rom}`);
      if (specs.length > 0) {
        model += ` (${specs.join(' | ')})`;
      }
    }
    return model;
  }, []);

  // Helper: Get identifier for a product
  const getProductIdentifier = useCallback((product, category) => {
    if (!product) return 'N/A';
    
    switch(category) {
      case 'Phones':
        return product.imei || 'N/A';
      case 'Electronics':
        return product.serialNumber || 'N/A';
      case 'Accessories':
        return product.barcode || product.sku || 'N/A';
      default:
        return product.sku || 'N/A';
    }
  }, []);

  // Get category label
  const getCategoryLabel = useCallback((category) => {
    const labels = {
      phones: 'Phones',
      electronics: 'Electronics',
      accessories: 'Accessories'
    };
    return labels[category] || 'Products';
  }, []);

  // Get identifier label
  const getIdentifierLabel = useCallback((category) => {
    const labels = {
      phones: 'IMEI',
      electronics: 'Serial',
      accessories: 'Barcode'
    };
    return labels[category] || 'ID';
  }, []);

  // ✅ Get all sold units from sale items - MOVED INSIDE useCallback
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { startDate, endDate } = dateRange;

      // Define getSoldUnitsFromSale inside fetchData
      const getSoldUnitsFromSale = (sale, category, allProducts) => {
        const soldUnits = [];
        
        if (!sale.items || sale.items.length === 0) return soldUnits;

        sale.items.forEach(item => {
          // ✅ Get product from allProducts using item.product (not productId)
          const product = allProducts.find(p => p._id === item.product?._id || p._id === item.product);
          if (!product || product.category !== category) {
            // If product not found, still try to use the item data
            if (item.category === category) {
              // Use item data directly
              const identifiers = item.unitIdentifiers || [];
              if (identifiers.length > 0) {
                identifiers.forEach(id => {
                  soldUnits.push({
                    identifier: id,
                    status: 'sold',
                    customer: sale.customer || { name: 'Walk-in' },
                    salePrice: item.unitPrice || 0,
                    productName: item.productName || 'Unknown',
                    model: 'N/A',
                    brand: 'N/A',
                    soldAt: sale.createdAt,
                    saleNumber: sale.saleNumber || sale._id,
                    branch: sale.branch,
                    customerName: sale.customer?.name || 'Walk-in',
                    customerPhone: sale.customer?.phone || '',
                    unitData: null
                  });
                });
              } else {
                // No identifiers, create one from product name
                soldUnits.push({
                  identifier: `${item.productName || 'Product'}-${Date.now()}`,
                  status: 'sold',
                  customer: sale.customer || { name: 'Walk-in' },
                  salePrice: item.unitPrice || 0,
                  productName: item.productName || 'Unknown',
                  model: 'N/A',
                  brand: 'N/A',
                  soldAt: sale.createdAt,
                  saleNumber: sale.saleNumber || sale._id,
                  branch: sale.branch,
                  customerName: sale.customer?.name || 'Walk-in',
                  customerPhone: sale.customer?.phone || '',
                  unitData: null
                });
              }
            }
            return;
          }

          // ✅ Product found - get identifiers from sale item
          const identifiers = item.unitIdentifiers || [];
          
          if (identifiers.length > 0) {
            // Use identifiers from the sale item
            identifiers.forEach(id => {
              // Try to find the unit in the product
              const unit = product.units?.find(u => u.identifier === id);
              soldUnits.push({
                identifier: id,
                status: unit?.status || 'sold',
                customer: sale.customer || { name: 'Walk-in' },
                salePrice: unit?.salePrice || item.unitPrice || product.price?.sale || 0,
                productName: product.name || 'Unknown',
                model: getProductModel(product),
                brand: product.brand || 'N/A',
                soldAt: sale.createdAt,
                saleNumber: sale.saleNumber || sale._id,
                branch: sale.branch || product.branch,
                customerName: sale.customer?.name || 'Walk-in',
                customerPhone: sale.customer?.phone || '',
                unitData: unit || null
              });
            });
          } else if (category === 'Phones' || category === 'Electronics') {
            // No identifiers in sale - try to find from product units
            // Look for units sold around the same time
            const saleDate = new Date(sale.createdAt);
            const dayStart = new Date(saleDate);
            dayStart.setHours(0, 0, 0, 0);
            const dayEnd = new Date(saleDate);
            dayEnd.setHours(23, 59, 59);

            const soldUnitsInProduct = product.units?.filter(u => 
              u.status === 'sold' && 
              u.soldAt && new Date(u.soldAt) >= dayStart && new Date(u.soldAt) <= dayEnd
            ) || [];

            if (soldUnitsInProduct.length > 0) {
              soldUnitsInProduct.forEach(unit => {
                soldUnits.push({
                  identifier: unit.identifier,
                  status: unit.status || 'sold',
                  customer: sale.customer || { name: 'Walk-in' },
                  salePrice: unit.salePrice || item.unitPrice || product.price?.sale || 0,
                  productName: product.name || 'Unknown',
                  model: getProductModel(product),
                  brand: product.brand || 'N/A',
                  soldAt: sale.createdAt,
                  saleNumber: sale.saleNumber || sale._id,
                  branch: sale.branch || product.branch,
                  customerName: sale.customer?.name || 'Walk-in',
                  customerPhone: sale.customer?.phone || '',
                  unitData: unit
                });
              });
            } else {
              // Fallback: create from product data
              soldUnits.push({
                identifier: getProductIdentifier(product, category),
                status: 'sold',
                customer: sale.customer || { name: 'Walk-in' },
                salePrice: item.unitPrice || product.price?.sale || 0,
                productName: product.name || 'Unknown',
                model: getProductModel(product),
                brand: product.brand || 'N/A',
                soldAt: sale.createdAt,
                saleNumber: sale.saleNumber || sale._id,
                branch: sale.branch || product.branch,
                customerName: sale.customer?.name || 'Walk-in',
                customerPhone: sale.customer?.phone || '',
                unitData: null
              });
            }
          } else if (category === 'Accessories') {
            // Accessories: use barcode from product
            const quantity = item.quantity || 1;
            for (let i = 0; i < quantity; i++) {
              soldUnits.push({
                identifier: product.barcode || product.sku || 'N/A',
                status: 'sold',
                customer: sale.customer || { name: 'Walk-in' },
                salePrice: item.unitPrice || product.price?.sale || 0,
                productName: product.name || 'Unknown',
                model: product.model || 'N/A',
                brand: product.brand || 'N/A',
                soldAt: sale.createdAt,
                saleNumber: sale.saleNumber || sale._id,
                branch: sale.branch || product.branch,
                customerName: sale.customer?.name || 'Walk-in',
                customerPhone: sale.customer?.phone || '',
                unitData: null,
                quantity: 1
              });
            }
          }
        });

        return soldUnits;
      };

      // ✅ Fetch all products
      const productsRes = await productService.getProducts();
      const allProducts = productsRes.data || [];

      // ✅ Fetch all sales using saleService
      const salesRes = await saleService.getSales({ limit: 1000 });
      const allSales = salesRes.data || [];

      // Filter sales by date range
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59);

      const filteredSales = allSales.filter(sale => {
        const saleDate = new Date(sale.createdAt);
        return saleDate >= start && saleDate <= end;
      });

      // ============================================
      // PROCESS PHONES
      // ============================================
      const phones = allProducts.filter(p => p.category === 'Phones' && p.status === 'active');
      
      // Find sales containing phones
      const phoneSales = filteredSales.filter(sale => {
        if (!sale.items || sale.items.length === 0) return false;
        return sale.items.some(item => {
          const productId = item.product?._id || item.product;
          return phones.some(p => p._id === productId) || item.category === 'Phones';
        });
      });

      // Get all sold items from phone sales
      let allSoldPhones = [];
      phoneSales.forEach(sale => {
        const soldUnits = getSoldUnitsFromSale(sale, 'Phones', allProducts);
        allSoldPhones = [...allSoldPhones, ...soldUnits];
      });

      // ============================================
      // PROCESS ELECTRONICS
      // ============================================
      const electronics = allProducts.filter(p => p.category === 'Electronics' && p.status === 'active');

      const electronicSales = filteredSales.filter(sale => {
        if (!sale.items || sale.items.length === 0) return false;
        return sale.items.some(item => {
          const productId = item.product?._id || item.product;
          return electronics.some(p => p._id === productId) || item.category === 'Electronics';
        });
      });

      let allSoldElectronics = [];
      electronicSales.forEach(sale => {
        const soldUnits = getSoldUnitsFromSale(sale, 'Electronics', allProducts);
        allSoldElectronics = [...allSoldElectronics, ...soldUnits];
      });

      // ============================================
      // PROCESS ACCESSORIES
      // ============================================
      const accessories = allProducts.filter(p => p.category === 'Accessories' && p.status === 'active');

      const accessorySales = filteredSales.filter(sale => {
        if (!sale.items || sale.items.length === 0) return false;
        return sale.items.some(item => {
          const productId = item.product?._id || item.product;
          return accessories.some(p => p._id === productId) || item.category === 'Accessories';
        });
      });

      let allSoldAccessories = [];
      accessorySales.forEach(sale => {
        const soldUnits = getSoldUnitsFromSale(sale, 'Accessories', allProducts);
        allSoldAccessories = [...allSoldAccessories, ...soldUnits];
      });

      // ============================================
      // UPDATE STATE
      // ============================================
      setPhonesData({
        total: phones.length,
        sold: allSoldPhones.length,
        added: phones.length,
        sales: phoneSales,
        soldItems: allSoldPhones
      });

      setElectronicsData({
        total: electronics.length,
        sold: allSoldElectronics.length,
        added: electronics.length,
        sales: electronicSales,
        soldItems: allSoldElectronics
      });

      setAccessoriesData({
        total: accessories.length,
        sold: allSoldAccessories.length,
        added: accessories.length,
        sales: accessorySales,
        soldItems: allSoldAccessories
      });

    } catch (error) {
      console.error('Error fetching report data:', error);
      setError('Failed to load report data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [dateRange, getProductModel, getProductIdentifier]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  const applyDateRange = () => {
    setShowDatePicker(false);
    fetchData();
  };

  // Generate detailed report
  const generateReport = (category) => {
    let data = {};
    let fileName = '';
    let headers = [];
    let rows = [];

    const categoryLabel = getCategoryLabel(category);

    if (category === 'phones') {
      data = phonesData;
      fileName = 'Phones_IMEI_Report';
      headers = ['Date Sold', 'Company', 'Customer Name', 'Phone Model (RAM/ROM)', 'IMEI Number', 'Selling Price'];
      
      data.soldItems.forEach(item => {
        const companyName = user?.company?.name || item.branch?.name || 'N/A';
        rows.push([
          new Date(item.soldAt).toLocaleDateString(),
          companyName,
          item.customerName || 'Walk-in',
          item.model || item.productName,
          item.identifier || 'N/A',
          item.salePrice || 0
        ]);
      });
    } 
    else if (category === 'electronics') {
      data = electronicsData;
      fileName = 'Electronics_Serial_Report';
      headers = ['Date Sold', 'Company', 'Customer Name', 'Product Name', 'Serial Number', 'Selling Price'];
      
      data.soldItems.forEach(item => {
        const companyName = user?.company?.name || item.branch?.name || 'N/A';
        rows.push([
          new Date(item.soldAt).toLocaleDateString(),
          companyName,
          item.customerName || 'Walk-in',
          item.productName || item.model,
          item.identifier || 'N/A',
          item.salePrice || 0
        ]);
      });
    } 
    else if (category === 'accessories') {
      data = accessoriesData;
      fileName = 'Accessories_Barcode_Report';
      headers = ['Date Sold', 'Company', 'Customer Name', 'Product Name', 'Barcode', 'Quantity', 'Selling Price'];
      
      data.soldItems.forEach(item => {
        const companyName = user?.company?.name || item.branch?.name || 'N/A';
        rows.push([
          new Date(item.soldAt).toLocaleDateString(),
          companyName,
          item.customerName || 'Walk-in',
          item.productName || item.model,
          item.identifier || 'N/A',
          item.quantity || 1,
          item.salePrice || 0
        ]);
      });
    }

    // Create CSV content
    let csvContent = `${categoryLabel} Sales Report - Individual Items\n`;
    csvContent += `=","========================================\n`;
    csvContent += `Period: ${new Date(dateRange.startDate).toLocaleDateString()} - ${new Date(dateRange.endDate).toLocaleDateString()}\n`;
    csvContent += `Total Items Sold: ${data.soldItems.length}\n`;
    csvContent += `Total Transactions: ${data.sales.length}\n`;
    csvContent += `=","========================================\n\n`;
    csvContent += headers.join(',') + '\n';
    
    rows.forEach(row => {
      csvContent += row.join(',') + '\n';
    });

    // Add summary
    const totalRevenue = data.soldItems.reduce((sum, item) => sum + (item.salePrice || 0), 0);
    csvContent += `\n=","========================================\n`;
    csvContent += `Summary\n`;
    csvContent += `Total ${categoryLabel},${data.total}\n`;
    csvContent += `Total Items Sold,${data.soldItems.length}\n`;
    csvContent += `Total Revenue,${totalRevenue}\n`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderStats = (data, category) => {
    const categoryLabel = getCategoryLabel(category);
    const identifierLabel = getIdentifierLabel(category);
    
    return (
      <div className="stats-grid">
        <div className="stat-card stat-total">
          <div className="stat-icon">
            <FaBox />
          </div>
          <div className="stat-info">
            <span className="stat-value">{data.total}</span>
            <span className="stat-label">Total {categoryLabel}</span>
          </div>
        </div>
        <div className="stat-card stat-sold">
          <div className="stat-icon">
            <FaShoppingCart />
          </div>
          <div className="stat-info">
            <span className="stat-value">{data.soldItems.length}</span>
            <span className="stat-label">{identifierLabel}s Sold</span>
          </div>
        </div>
        <div className="stat-card stat-added">
          <div className="stat-icon">
            <FaPlus />
          </div>
          <div className="stat-info">
            <span className="stat-value">{data.added}</span>
            <span className="stat-label">Total Added</span>
          </div>
        </div>
        <div className="stat-card stat-period">
          <div className="stat-icon">
            <FaCalendarAlt />
          </div>
          <div className="stat-info">
            <span className="stat-value">{data.sales.length}</span>
            <span className="stat-label">Total Transactions</span>
          </div>
        </div>
      </div>
    );
  };

  const renderSoldItemsTable = (soldItems, category) => {
    const identifierLabel = getIdentifierLabel(category);
    
    if (soldItems.length === 0) {
      return (
        <div className="no-sales">
          <span>📭</span>
          <p>No {identifierLabel}s sold in this period</p>
          <small>Try adjusting the date range</small>
        </div>
      );
    }

    const headers = category === 'accessories' 
      ? ['#', 'Date', 'Customer', 'Product', identifierLabel, 'Qty', 'Price']
      : ['#', 'Date', 'Customer', 'Product', identifierLabel, 'Price'];

    return (
      <div className="table-container">
        <table className="report-table">
          <thead>
            <tr>
              {headers.map((h, i) => <th key={i}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {soldItems.map((item, index) => {
              const isAccessory = category === 'accessories';
              return (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{new Date(item.soldAt).toLocaleDateString()}</td>
                  <td>{item.customerName || 'Walk-in'}</td>
                  <td>
                    <div className="product-cell">
                      <span className="product-name">{item.productName || 'Unknown'}</span>
                      {item.model && item.model !== item.productName && (
                        <span className="product-model">{item.model}</span>
                      )}
                      {item.brand && item.brand !== 'N/A' && (
                        <span className="product-brand">{item.brand}</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="identifier-badge">{item.identifier || 'N/A'}</span>
                  </td>
                  {isAccessory && <td>{item.quantity || 1}</td>}
                  <td>KSh {(item.salePrice || 0).toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const getActiveData = () => {
    switch(activeTab) {
      case 'phones': return phonesData;
      case 'electronics': return electronicsData;
      case 'accessories': return accessoriesData;
      default: return phonesData;
    }
  };

  const activeData = getActiveData();
  const categoryLabel = getCategoryLabel(activeTab);
  const identifierLabel = getIdentifierLabel(activeTab);

  const getTotalRevenue = (data) => {
    return data.soldItems.reduce((sum, item) => sum + (item.salePrice || 0), 0);
  };

  return (
    <MainLayout title="Reports" breadcrumbs={['Home', 'Reports']}>
      <div className="reports-page">
        <div className="reports-header">
          <div className="header-left">
            <h2>📊 Reports</h2>
            <p>View and analyze sales reports by category</p>
          </div>
          <div className="header-actions">
            <button 
              className="btn-date-range"
              onClick={() => setShowDatePicker(!showDatePicker)}
            >
              <FaCalendarAlt />
              <span>Date Range</span>
            </button>
            <button className="btn-refresh" onClick={fetchData}>
              <FaSync /> Refresh
            </button>
          </div>
        </div>

        {/* Date Range Picker */}
        {showDatePicker && (
          <div className="date-range-picker">
            <div className="date-inputs">
              <div className="date-group">
                <label>Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={dateRange.startDate}
                  onChange={handleDateChange}
                />
              </div>
              <div className="date-group">
                <label>End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={dateRange.endDate}
                  onChange={handleDateChange}
                />
              </div>
            </div>
            <div className="date-actions">
              <button 
                className="btn-apply"
                onClick={applyDateRange}
              >
                Apply Filter
              </button>
              <button 
                className="btn-reset"
                onClick={() => {
                  setDateRange({
                    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
                    endDate: new Date().toISOString().split('T')[0]
                  });
                  setShowDatePicker(false);
                  fetchData();
                }}
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="error-state">
            <p>⚠️ {error}</p>
            <button onClick={fetchData}>Retry</button>
          </div>
        )}

        {/* Tabs */}
        <div className="reports-tabs">
          <button 
            className={`tab-btn ${activeTab === 'phones' ? 'active' : ''}`}
            onClick={() => setActiveTab('phones')}
          >
            📱 Phones
            <span className="tab-count">{phonesData.total}</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'electronics' ? 'active' : ''}`}
            onClick={() => setActiveTab('electronics')}
          >
            💻 Electronics
            <span className="tab-count">{electronicsData.total}</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'accessories' ? 'active' : ''}`}
            onClick={() => setActiveTab('accessories')}
          >
            🎧 Accessories
            <span className="tab-count">{accessoriesData.total}</span>
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading report data...</p>
          </div>
        ) : (
          <div className="tab-content">
            {/* Summary Row */}
            <div className="summary-row">
              <div className="summary-item">
                <span className="summary-label">Period</span>
                <span className="summary-value">
                  {new Date(dateRange.startDate).toLocaleDateString()} - {new Date(dateRange.endDate).toLocaleDateString()}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Total Revenue</span>
                <span className="summary-value revenue">
                  KSh {getTotalRevenue(activeData).toLocaleString()}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">{identifierLabel}s Sold</span>
                <span className="summary-value">{activeData.soldItems.length}</span>
              </div>
            </div>

            {/* Stats */}
            {renderStats(activeData, activeTab)}

            {/* Sold Items Table */}
            <div className="sales-section">
              <div className="section-header">
                <h3>📋 {categoryLabel} - {identifierLabel}s Sold</h3>
                <button 
                  className="btn-generate-report"
                  onClick={() => generateReport(activeTab)}
                >
                  <FaFileDownload /> Generate {categoryLabel} Report
                </button>
              </div>
              {renderSoldItemsTable(activeData.soldItems, activeTab)}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Reports;