// /home/kk/RS/TRONIC_MASTER/frontend/src/pages/Branches.js

import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../components/layout/MainLayout';
import './Branches.css';

const Branches = () => {
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCountry, setFilterCountry] = useState('all');
  const [countries, setCountries] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    mainBranches: 0,
    countries: 0
  });

  // Countries with currencies data
  const countriesData = [
    { code: 'KE', name: 'Kenya', currency: 'KES', currencySymbol: 'KSh' },
    { code: 'TZ', name: 'Tanzania', currency: 'TZS', currencySymbol: 'TSh' },
    { code: 'UG', name: 'Uganda', currency: 'UGX', currencySymbol: 'USh' },
    { code: 'RW', name: 'Rwanda', currency: 'RWF', currencySymbol: 'RF' },
    { code: 'NG', name: 'Nigeria', currency: 'NGN', currencySymbol: '₦' },
    { code: 'ZA', name: 'South Africa', currency: 'ZAR', currencySymbol: 'R' },
    { code: 'GH', name: 'Ghana', currency: 'GHS', currencySymbol: '₵' },
    { code: 'EG', name: 'Egypt', currency: 'EGP', currencySymbol: 'E£' },
    { code: 'US', name: 'United States', currency: 'USD', currencySymbol: '$' },
    { code: 'GB', name: 'United Kingdom', currency: 'GBP', currencySymbol: '£' },
    { code: 'EU', name: 'Europe', currency: 'EUR', currencySymbol: '€' },
    { code: 'IN', name: 'India', currency: 'INR', currencySymbol: '₹' },
    { code: 'CN', name: 'China', currency: 'CNY', currencySymbol: '¥' },
    { code: 'JP', name: 'Japan', currency: 'JPY', currencySymbol: '¥' },
    { code: 'AU', name: 'Australia', currency: 'AUD', currencySymbol: 'A$' },
    { code: 'CA', name: 'Canada', currency: 'CAD', currencySymbol: 'C$' },
    { code: 'BR', name: 'Brazil', currency: 'BRL', currencySymbol: 'R$' },
    { code: 'MX', name: 'Mexico', currency: 'MXN', currencySymbol: '$' },
    { code: 'AE', name: 'UAE', currency: 'AED', currencySymbol: 'د.إ' },
    { code: 'SA', name: 'Saudi Arabia', currency: 'SAR', currencySymbol: 'ر.س' }
  ];

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'branch',
    country: '',
    countryCode: '',
    currency: 'KES',
    currencySymbol: 'KSh',
    city: '',
    address: '',
    phone: '',
    email: '',
    isMainBranch: false,
    manager: {
      name: '',
      phone: '',
      email: ''
    }
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

  // ============================================
  // FETCH BRANCHES
  // ============================================
  const fetchBranches = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/branches`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setBranches(data.data || []);
        // Extract unique countries for filter
        const uniqueCountries = [...new Set(data.data.map(b => b.country).filter(Boolean))];
        setCountries(uniqueCountries);
      } else {
        setError(data.message || 'Failed to fetch branches');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  // ============================================
  // FETCH STATS
  // ============================================
  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('📊 Fetching branch stats...');
      const response = await fetch(`${API_URL}/branches/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      console.log('📊 Stats response:', data);
      
      if (data.success) {
        setStats({
          total: data.data?.total || 0,
          mainBranches: data.data?.mainBranches || 0,
          countries: data.data?.countries || 0
        });
        console.log('✅ Stats loaded:', data.data);
      } else {
        console.error('❌ Failed to fetch stats:', data.message);
      }
    } catch (err) {
      console.error('❌ Error fetching stats:', err);
    }
  }, [API_URL]);

  // ============================================
  // LOAD DATA ON MOUNT
  // ============================================
  useEffect(() => {
    fetchBranches();
    fetchStats();
  }, [fetchBranches, fetchStats]);

  // ============================================
  // HANDLERS
  // ============================================
  const handleCountryChange = (countryCode) => {
    const selectedCountry = countriesData.find(c => c.code === countryCode);
    if (selectedCountry) {
      setFormData(prev => ({
        ...prev,
        countryCode: selectedCountry.code,
        country: selectedCountry.name,
        currency: selectedCountry.currency,
        currencySymbol: selectedCountry.currencySymbol
      }));
    }
  };

  const handleOpenModal = (branch = null) => {
    if (branch) {
      setEditingBranch(branch);
      setFormData({
        name: branch.name || '',
        code: branch.code || '',
        type: branch.type || 'branch',
        country: branch.country || '',
        countryCode: branch.countryCode || '',
        currency: branch.currency || 'KES',
        currencySymbol: branch.currencySymbol || 'KSh',
        city: branch.city || '',
        address: branch.address || '',
        phone: branch.phone || '',
        email: branch.email || '',
        isMainBranch: branch.isMainBranch || false,
        manager: {
          name: branch.manager?.name || '',
          phone: branch.manager?.phone || '',
          email: branch.manager?.email || ''
        }
      });
    } else {
      setEditingBranch(null);
      setFormData({
        name: '',
        code: '',
        type: 'branch',
        country: '',
        countryCode: '',
        currency: 'KES',
        currencySymbol: 'KSh',
        city: '',
        address: '',
        phone: '',
        email: '',
        isMainBranch: false,
        manager: {
          name: '',
          phone: '',
          email: ''
        }
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingBranch(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editingBranch 
        ? `${API_URL}/branches/${editingBranch._id}`
        : `${API_URL}/branches`;
      const method = editingBranch ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (data.success) {
        await fetchBranches();
        await fetchStats();
        handleCloseModal();
        alert(editingBranch ? 'Branch updated successfully!' : 'Branch created successfully!');
      } else {
        alert(data.message || 'Failed to save branch');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this branch?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/branches/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        await fetchBranches();
        await fetchStats();
        alert('Branch deactivated successfully');
      } else {
        alert(data.message || 'Failed to delete branch');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredBranches = branches.filter(branch => {
    const matchesSearch = branch.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          branch.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          branch.city?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCountry = filterCountry === 'all' || branch.country === filterCountry;
    return matchesSearch && matchesCountry;
  });

  const getTypeBadge = (type) => {
    const types = {
      main: { label: '🏢 Main', class: 'type-main' },
      branch: { label: '🏪 Branch', class: 'type-branch' },
      warehouse: { label: '🏭 Warehouse', class: 'type-warehouse' },
      outlet: { label: '🛍️ Outlet', class: 'type-outlet' }
    };
    return types[type] || { label: type, class: '' };
  };

  return (
    <MainLayout title="Branches" breadcrumbs={['Home', 'Branches']}>
      <div className="branches-page">
        {/* Stats Cards */}
        <div className="branches-stats">
          <div className="stat-card">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Total Branches</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.mainBranches}</span>
            <span className="stat-label">Main Branches</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.countries}</span>
            <span className="stat-label">Countries</span>
          </div>
        </div>

        <div className="branches-header">
          <div>
            <h2>🏪 Branches</h2>
            <p>Manage your company shop branches</p>
          </div>
          <button className="btn-primary" onClick={() => handleOpenModal()}>
            <span>➕</span> Add Branch
          </button>
        </div>

        <div className="branches-filters">
          <input
            type="text"
            placeholder="Search branches..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <select
            value={filterCountry}
            onChange={(e) => setFilterCountry(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Countries</option>
            {countries.map(country => (
              <option key={country} value={country}>{country}</option>
            ))}
          </select>
          <button className="btn-refresh" onClick={() => { fetchBranches(); fetchStats(); }}>
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading branches...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>❌ {error}</p>
            <button onClick={fetchBranches}>Retry</button>
          </div>
        ) : filteredBranches.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🏪</span>
            <h3>No Branches Found</h3>
            <p>Start by adding your first branch</p>
            <button className="btn-primary" onClick={() => handleOpenModal()}>
              <span>➕</span> Add Branch
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="branches-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Branch</th>
                  <th>Code</th>
                  <th>Type</th>
                  <th>Location</th>
                  <th>Currency</th>
                  <th>Manager</th>
                  <th>Products</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredBranches.map((branch, index) => {
                  const typeInfo = getTypeBadge(branch.type);
                  return (
                    <tr key={branch._id} className={branch.isMainBranch ? 'main-branch-row' : ''}>
                      <td>{index + 1}</td>
                      <td>
                        <div className="branch-name-cell">
                          <span className="branch-icon">{branch.isMainBranch ? '🏢' : '🏪'}</span>
                          <div>
                            <div className="branch-name">{branch.name}</div>
                            {branch.isMainBranch && <span className="main-badge">Main</span>}
                          </div>
                        </div>
                      </td>
                      <td><span className="code-badge">{branch.code}</span></td>
                      <td>
                        <span className={`type-badge ${typeInfo.class}`}>
                          {typeInfo.label}
                        </span>
                      </td>
                      <td>
                        <div className="location-cell">
                          <div>{branch.city}</div>
                          <div className="country-text">{branch.country}</div>
                        </div>
                      </td>
                      <td>
                        <div className="currency-cell">
                          <span className="currency-symbol">{branch.currencySymbol}</span>
                          <span className="currency-code">{branch.currency}</span>
                        </div>
                      </td>
                      <td>
                        {branch.manager?.name ? (
                          <div className="manager-cell">
                            <div>{branch.manager.name}</div>
                            <div className="manager-phone">{branch.manager.phone}</div>
                          </div>
                        ) : (
                          <span className="no-manager">-</span>
                        )}
                      </td>
                      <td>
                        <span className="products-count">{branch.productCount || 0}</span>
                      </td>
                      <td>
                        <span className={`status-badge ${branch.isActive ? 'active' : 'inactive'}`}>
                          {branch.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button 
                            className="btn-action btn-edit"
                            onClick={() => handleOpenModal(branch)}
                            title="Edit"
                          >
                            ✏️
                          </button>
                          <button 
                            className="btn-action btn-delete"
                            onClick={() => handleDelete(branch._id)}
                            title="Delete"
                            disabled={branch.isMainBranch}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingBranch ? '✏️ Edit Branch' : '➕ Add New Branch'}</h2>
                <button className="modal-close" onClick={handleCloseModal}>✕</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Branch Name *</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g., Nairobi Main Shop"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Branch Code *</label>
                      <input
                        type="text"
                        name="code"
                        value={formData.code}
                        onChange={handleChange}
                        placeholder="e.g., NBO-001"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Type</label>
                      <select name="type" value={formData.type} onChange={handleChange}>
                        <option value="main">🏢 Main</option>
                        <option value="branch">🏪 Branch</option>
                        <option value="warehouse">🏭 Warehouse</option>
                        <option value="outlet">🛍️ Outlet</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Main Branch</label>
                      <div className="checkbox-group">
                        <input
                          type="checkbox"
                          name="isMainBranch"
                          checked={formData.isMainBranch}
                          onChange={(e) => setFormData(prev => ({ ...prev, isMainBranch: e.target.checked }))}
                        />
                        <label>Set as main branch</label>
                      </div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Country *</label>
                      <select
                        name="countryCode"
                        value={formData.countryCode}
                        onChange={(e) => handleCountryChange(e.target.value)}
                        required
                      >
                        <option value="">Select Country</option>
                        {countriesData.map(country => (
                          <option key={country.code} value={country.code}>
                            {country.name} ({country.currency} - {country.currencySymbol})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>City *</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="e.g., Nairobi"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Currency</label>
                      <input
                        type="text"
                        name="currency"
                        value={formData.currency}
                        onChange={handleChange}
                        disabled
                        className="disabled-field"
                      />
                      <small className="field-hint">💡 Auto-set based on country selection</small>
                    </div>
                    <div className="form-group">
                      <label>Currency Symbol</label>
                      <input
                        type="text"
                        name="currencySymbol"
                        value={formData.currencySymbol}
                        onChange={handleChange}
                        disabled
                        className="disabled-field"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Address</label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="e.g., Kenyatta Avenue, Nairobi"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Phone</label>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="e.g., +254 700 000 000"
                      />
                    </div>
                    <div className="form-group">
                      <label>Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="e.g., branch@company.com"
                      />
                    </div>
                  </div>

                  <div className="form-section">
                    <h4>👤 Branch Manager</h4>
                    <div className="form-row">
                      <div className="form-group">
                        <label>Manager Name</label>
                        <input
                          type="text"
                          name="manager.name"
                          value={formData.manager.name}
                          onChange={handleChange}
                          placeholder="e.g., John Doe"
                        />
                      </div>
                      <div className="form-group">
                        <label>Manager Phone</label>
                        <input
                          type="text"
                          name="manager.phone"
                          value={formData.manager.phone}
                          onChange={handleChange}
                          placeholder="e.g., +254 700 000 000"
                        />
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Manager Email</label>
                      <input
                        type="email"
                        name="manager.email"
                        value={formData.manager.email}
                        onChange={handleChange}
                        placeholder="e.g., manager@company.com"
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-save">
                    {editingBranch ? '💾 Update' : '➕ Add'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Branches;