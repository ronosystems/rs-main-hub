// /home/kk/RS/TRONIC_MASTER/frontend/src/pages/Cities.js

import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../context/AuthContext';
import './Branches.css';

const Cities = () => {
  const { user } = useAuth();
  const [cities, setCities] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingCity, setEditingCity] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCountry, setFilterCountry] = useState('all');

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    countryId: ''
  });

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch countries
      const countriesRes = await fetch(`${API_URL}/countries`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const countriesData = await countriesRes.json();
      if (countriesData.success) {
        setCountries(countriesData.data || []);
      }

      // Fetch cities
      const citiesRes = await fetch(`${API_URL}/cities`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const citiesData = await citiesRes.json();
      if (citiesData.success) {
        setCities(citiesData.data || []);
      } else {
        setError(citiesData.message || 'Failed to fetch cities');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (city = null) => {
    if (city) {
      setEditingCity(city);
      setFormData({
        name: city.name || '',
        code: city.code || '',
        countryId: city.country?._id || city.country || ''
      });
    } else {
      setEditingCity(null);
      setFormData({
        name: '',
        code: '',
        countryId: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCity(null);
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
    if (!formData.countryId) {
      alert('Please select a country');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const url = editingCity 
        ? `${API_URL}/cities/${editingCity._id}`
        : `${API_URL}/cities`;
      const method = editingCity ? 'PUT' : 'POST';

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
        await fetchData();
        handleCloseModal();
        alert(editingCity ? 'City updated successfully!' : 'City created successfully!');
      } else {
        alert(data.message || 'Failed to save city');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to deactivate this city?')) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/cities/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        await fetchData();
        alert('City deactivated successfully');
      } else {
        alert(data.message || 'Failed to delete city');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredCities = cities.filter(city => {
    const matchesSearch = city.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          city.code?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCountry = filterCountry === 'all' || city.country?._id === filterCountry || city.country === filterCountry;
    return matchesSearch && matchesCountry;
  });

  return (
    <MainLayout title="Cities" breadcrumbs={['Home', 'Branches', 'Cities']}>
      <div className="branches-page">
        <div className="branches-header">
          <div>
            <h2>🏙️ Cities</h2>
            <p>Manage cities within your countries</p>
          </div>
          <button className="btn-primary" onClick={() => handleOpenModal()}>
            <span>➕</span> Add City
          </button>
        </div>

        <div className="branches-filters">
          <input
            type="text"
            placeholder="Search cities..."
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
              <option key={country._id} value={country._id}>
                {country.name} ({country.code})
              </option>
            ))}
          </select>
          <button className="btn-refresh" onClick={fetchData}>
            🔄 Refresh
          </button>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading cities...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>❌ {error}</p>
            <button onClick={fetchData}>Retry</button>
          </div>
        ) : filteredCities.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">🏙️</span>
            <h3>No Cities Found</h3>
            <p>Start by adding your first city</p>
            <button className="btn-primary" onClick={() => handleOpenModal()}>
              <span>➕</span> Add City
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="branches-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>City</th>
                  <th>Code</th>
                  <th>Country</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCities.map((city, index) => (
                  <tr key={city._id}>
                    <td>{index + 1}</td>
                    <td>
                      <div className="city-name-cell">
                        <span className="city-icon">🏙️</span>
                        <span>{city.name}</span>
                      </div>
                    </td>
                    <td>{city.code || '-'}</td>
                    <td>
                      <span className="country-tag">
                        {city.country?.name} ({city.country?.code})
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${city.isActive ? 'active' : 'inactive'}`}>
                        {city.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn-action btn-edit"
                          onClick={() => handleOpenModal(city)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button 
                          className="btn-action btn-delete"
                          onClick={() => handleDelete(city._id)}
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
                <h2>{editingCity ? '✏️ Edit City' : '➕ Add New City'}</h2>
                <button className="modal-close" onClick={handleCloseModal}>✕</button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>City Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g., Nairobi"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>City Code</label>
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleChange}
                      placeholder="e.g., NBO"
                    />
                  </div>
                  <div className="form-group">
                    <label>Country *</label>
                    <select
                      name="countryId"
                      value={formData.countryId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Country</option>
                      {countries.map(country => (
                        <option key={country._id} value={country._id}>
                          {country.name} ({country.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn-cancel" onClick={handleCloseModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-save">
                    {editingCity ? '💾 Update' : '➕ Add'}
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

export default Cities;