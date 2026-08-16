// /home/kk/RS/TRONIC_MASTER/frontend/src/pages/Countries.js

import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../context/AuthContext';
import './Branches.css';

const Countries = () => {
  const { user } = useAuth();
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCountry, setEditingCountry] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    dialCode: '',
    currency: '',
    currencySymbol: ''
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/countries`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setCountries(data.data || []);
      } else {
        setError(data.message || 'Failed to fetch countries');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (country = null) => {
    if (country) {
      setEditingCountry(country);
      setFormData({
        name: country.name || '',
        code: country.code || '',
        dialCode: country.dialCode || '',
        currency: country.currency || '',
        currencySymbol: country.currencySymbol || ''
      });
    } else {
      setEditingCountry(null);
      setFormData({
        name: '',
        code: '',
        dialCode: '',
        currency: '',
        currencySymbol: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCountry(null);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const url = editingCountry 
        ? `${API_URL}/countries/${editingCountry._id}`
        : `${API_URL}/countries`;
      const method = editingCountry ? 'PUT' : 'POST';

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
        await fetchCountries();
        handleCloseModal();
        alert(editingCountry ? 'Country updated successfully!' : 'Country created successfully!');
      } else {
        alert(data.message || 'Failed to save country');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this country?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/countries/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        await fetchCountries();
        alert('Country deactivated successfully');
      } else {
        alert(data.message || 'Failed to delete country');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredCountries = countries.filter(country =>
    country.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    country.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <MainLayout title="Countries" breadcrumbs={['Home', 'Branches', 'Countries']}>
      <div className="branches-page">
        <div className="branches-header">
          <div>
            <h2>🌐 Countries</h2>
            <p>Manage all countries where you operate</p>
          </div>
          <button className="btn-primary" onClick={() => handleOpenModal()}>
            <span>➕</span> Add Country
          </button>
        </div>

        <div className="branches-filters">
          <input
            type="text"
            placeholder="Search countries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button className="btn-refresh" onClick={fetchCountries}>
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading countries...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>❌ {error}</p>
            <button onClick={fetchCountries}>Retry</button>
          </div>
        ) : filteredCountries.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🌐</span>
            <h3>No Countries Found</h3>
            <p>Start by adding your first country</p>
            <button className="btn-primary" onClick={() => handleOpenModal()}>
              <span>➕</span> Add Country
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="branches-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Country</th>
                  <th>Code</th>
                  <th>Dial Code</th>
                  <th>Currency</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCountries.map((country, index) => (
                  <tr key={country._id}>
                    <td>{index + 1}</td>
                    <td>
                      <div className="country-name-cell">
                        <span className="country-flag">{country.currencySymbol || '🌍'}</span>
                        <span>{country.name}</span>
                      </div>
                    </td>
                    <td><span className="code-badge">{country.code}</span></td>
                    <td>{country.dialCode || '-'}</td>
                    <td>{country.currency || '-'}</td>
                    <td>
                      <span className={`status-badge ${country.isActive ? 'active' : 'inactive'}`}>
                        {country.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-action btn-edit"
                          onClick={() => handleOpenModal(country)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn-action btn-delete"
                          onClick={() => handleDelete(country._id)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingCountry ? '✏️ Edit Country' : '➕ Add New Country'}</h2>
                <button className="modal-close" onClick={handleCloseModal}>✕</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Country Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g., Kenya"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Country Code *</label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      placeholder="e.g., KE"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Dial Code</label>
                    <input
                      type="text"
                      name="dialCode"
                      value={formData.dialCode}
                      onChange={handleChange}
                      placeholder="e.g., +254"
                    />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Currency</label>
                      <input
                        type="text"
                        name="currency"
                        value={formData.currency}
                        onChange={handleChange}
                        placeholder="e.g., Kenyan Shilling"
                      />
                    </div>
                    <div className="form-group">
                      <label>Currency Symbol</label>
                      <input
                        type="text"
                        name="currencySymbol"
                        value={formData.currencySymbol}
                        onChange={handleChange}
                        placeholder="e.g., KSh"
                      />
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-save">
                    {editingCountry ? '💾 Update' : '➕ Add'}
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

export default Countries;