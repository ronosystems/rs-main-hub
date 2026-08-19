import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/layout/MainLayout';
import './Companies.css';

const Companies = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  
  // Action Modal
  const [showActionModal, setShowActionModal] = useState(false);
  const [actionCompany, setActionCompany] = useState(null);
  
  // Data from database
  const [projectTypesMap, setProjectTypesMap] = useState({});
  
  // Icon components
  const Icons = {
    Create: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    ),
    Company: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    Active: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    Pending: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    Inactive: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    ),
    View: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
    Edit: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    ),
    Delete: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        <line x1="10" y1="11" x2="10" y2="17"/>
        <line x1="14" y1="11" x2="14" y2="17"/>
      </svg>
    ),
    Deactivate: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
      </svg>
    ),
    Reactivate: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 1 1-3-6.7"/>
        <polyline points="21 3 21 9 15 9"/>
      </svg>
    ),
    Close: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    ),
    Error: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    ),
    Empty: () => (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    ChevronLeft: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    ),
    ChevronRight: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    ),
    ChevronsLeft: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="11 17 6 12 11 7"/>
        <polyline points="18 17 13 12 18 7"/>
      </svg>
    ),
    ChevronsRight: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="13 17 18 12 13 7"/>
        <polyline points="6 17 11 12 6 7"/>
      </svg>
    ),
    ThreeDots: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="1"/>
        <circle cx="12" cy="5" r="1"/>
        <circle cx="12" cy="19" r="1"/>
      </svg>
    )
  };

  const API_URL = 'https://main-hub-api-ea52e89c5128.herokuapp.com/api';
  const STATIC_URL = 'https://main-hub-api-ea52e89c5128.herokuapp.com';

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // Get status badge class
  const getStatusBadge = (status) => {
    if (!status) return 'badge-secondary';
    
    const statusMap = {
      'active': 'badge-success',
      'inactive': 'badge-danger',
      'suspended': 'badge-warning',
      'pending': 'badge-info',
      'trial': 'badge-info',
      'expired': 'badge-danger',
      'cancelled': 'badge-warning'
    };
    return statusMap[status.toLowerCase()] || 'badge-secondary';
  };

  // Get plan type badge
  const getPlanTypeBadge = (planType) => {
    if (!planType) return 'badge-secondary';
    
    const planMap = {
      'basic': 'badge-basic',
      'standard': 'badge-standard',
      'premium': 'badge-premium',
      'enterprise': 'badge-enterprise'
    };
    return planMap[planType.toLowerCase()] || 'badge-secondary';
  };

  // Format date
  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  };

  // Fetch companies
  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      const response = await axios.get(`${API_URL}/companies`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          page: currentPage,
          limit: entriesPerPage
        }
      });

      if (response.data.success) {
        const data = response.data.data || [];
        const pagination = response.data.pagination || {};
        
        setCompanies(Array.isArray(data) ? data : []);
        setTotalPages(pagination.pages || 1);
        setTotalCompanies(pagination.total || data.length || 0);
        setError(null);
      } else {
        setError(response.data.message || 'Failed to fetch companies');
      }
    } catch (err) {
      console.error('❌ Error fetching companies:', err);
      
      if (err.response?.status === 404) {
        setCompanies([]);
        setTotalPages(1);
        setTotalCompanies(0);
        setError(null);
      } else {
        setError(err.response?.data?.message || 'Failed to fetch companies');
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, entriesPerPage, API_URL]);

  // Fetch filter options from database
  const fetchFilterOptions = useCallback(async () => {
    try {
      const token = getAuthToken();
      
      const projectTypesRes = await axios.get(`${API_URL}/projects/types`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (projectTypesRes.data.success) {
        const typesData = projectTypesRes.data.data;
        setProjectTypesMap(typesData);
      }
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchCompanies();
    fetchFilterOptions();
  }, [fetchCompanies, fetchFilterOptions]);

  // ============================================
  // ACTION MODAL HANDLERS
  // ============================================
  const openActionModal = (company) => {
    console.log('Opening action modal for:', company);
    setActionCompany(company);
    setShowActionModal(true);
  };

  const closeActionModal = () => {
    setShowActionModal(false);
    setActionCompany(null);
  };

  // ============================================
  // COMPANY ACTION HANDLERS
  // ============================================
  const handleViewCompany = async (id) => {
    try {
      const token = getAuthToken();
      
      const response = await axios.get(`${API_URL}/companies/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const companyData = response.data.data.company;
        setSelectedCompany(companyData);
        setShowViewModal(true);
        closeActionModal();
      } else {
        alert('Failed to fetch company details');
      }
    } catch (err) {
      console.error('❌ Error fetching company details:', err);
      alert(err.response?.data?.message || 'Failed to fetch company details');
    }
  };

  const handleEditCompany = (id) => {
    navigate(`/companies/edit/${id}`);
    closeActionModal();
  };

  const handleDeactivateCompany = async (id) => {
    if (!window.confirm('⚠️ Deactivate Company\n\nAre you sure you want to deactivate this company?\n\nThis will:\n• Deactivate the company\n• Deactivate all users\n• Prevent access to the system\n\nThis action can be reversed by reactivating.')) return;
    
    try {
      const token = getAuthToken();
      const response = await axios.delete(`${API_URL}/companies/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        fetchCompanies();
        closeActionModal();
        alert('✅ Company deactivated successfully!');
      }
    } catch (err) {
      console.error('Error deactivating company:', err);
      alert(err.response?.data?.message || 'Failed to deactivate company');
    }
  };

  const handleReactivateCompany = async (id) => {
    if (!window.confirm('🔄 Reactivate Company\n\nAre you sure you want to reactivate this company?\n\nThis will:\n• Reactivate the company\n• Reactivate all users\n• Restore access to the system')) return;
    
    try {
      const token = getAuthToken();
      const response = await axios.put(`${API_URL}/companies/${id}/reactivate`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        fetchCompanies();
        closeActionModal();
        alert('✅ Company reactivated successfully!');
      }
    } catch (err) {
      console.error('Error reactivating company:', err);
      alert(err.response?.data?.message || 'Failed to reactivate company');
    }
  };

  const handlePermanentDeleteCompany = async (id) => {
    if (!window.confirm(
      '⚠️ PERMANENT DELETE\n\n' +
      'This will permanently delete the company and ALL associated data including:\n' +
      '• All users\n' +
      '• All products\n' +
      '• All orders\n' +
      '• All inventory records\n\n' +
      'This action CANNOT be undone!\n\n' +
      'Are you sure you want to proceed?'
    )) return;
    
    try {
      const token = getAuthToken();
      const response = await axios.delete(`${API_URL}/companies/${id}/permanent`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        fetchCompanies();
        closeActionModal();
        alert('✅ Company permanently deleted successfully!');
      }
    } catch (err) {
      console.error('Error permanently deleting company:', err);
      alert(err.response?.data?.message || 'Failed to permanently delete company');
    }
  };

  // Get project type display name
  const getProjectTypeDisplayName = (typeKey) => {
    if (!typeKey) return 'N/A';
    return projectTypesMap[typeKey]?.name || typeKey;
  };

  // ✅ Hardcoded permission checks based on role
  const userRole = user?.role?.toLowerCase();
  const isSuperAdmin = userRole === 'super_admin';
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  const isStaff = userRole === 'staff';
  
  // ✅ Super Admin and Admin can do everything
  const canCreate = isSuperAdmin || isAdmin;
  const canEdit = isSuperAdmin || isAdmin;
  const canDelete = isSuperAdmin; // Only Super Admin can delete

  // Pagination handlers
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

  // Breadcrumbs
  const breadcrumbs = ['Home', 'Companies'];

  return (
    <MainLayout title="Companies" breadcrumbs={breadcrumbs}>
      <div className="companies-page">
        {/* Header Section */}
        <div className="companies-header">
          <div className="header-left">
            <h2>Company Management</h2>
            <p className="subtitle">Manage all registered companies in the system</p>
          </div>
          <div className="header-right">
            {canCreate && (
              <button 
                className="btn btn-primary" 
                onClick={() => navigate('/companies/create')}
              >
                <Icons.Create />
                Create Company
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <Icons.Company />
            </div>
            <div className="stat-info">
              <span className="stat-value">{totalCompanies}</span>
              <span className="stat-label">Total Companies</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Icons.Active />
            </div>
            <div className="stat-info">
              <span className="stat-value">
                {companies.filter(c => c.status === 'active').length}
              </span>
              <span className="stat-label">Active Companies</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Icons.Pending />
            </div>
            <div className="stat-info">
              <span className="stat-value">
                {companies.filter(c => c.status === 'pending').length}
              </span>
              <span className="stat-label">Pending Companies</span>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Icons.Inactive />
            </div>
            <div className="stat-info">
              <span className="stat-value">
                {companies.filter(c => c.status === 'inactive' || c.status === 'suspended').length}
              </span>
              <span className="stat-label">Inactive Companies</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert alert-error">
            <span className="alert-icon">
              <Icons.Error />
            </span>
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading companies...</p>
          </div>
        ) : (
          <>
            {/* Companies Table */}
            <div className="table-container">
              {companies.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">
                    <Icons.Empty />
                  </span>
                  <h3>No Companies Found</h3>
                  <p>Start by creating your first company</p>
                  {canCreate && (
                    <button 
                      className="btn btn-primary" 
                      onClick={() => navigate('/companies/create')}
                    >
                      <Icons.Create />
                      Create Company
                    </button>
                  )}
                </div>
              ) : (
                <table className="companies-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Project Type</th>
                      <th>Plan</th>
                      <th>Status</th>
                      <th>Admin</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companies.map((company) => (
                      <tr key={company._id}>
                        <td>
                          <span className="company-code">{company.code || 'N/A'}</span>
                        </td>
                        <td>
                          <div className="company-name-cell">
                            <strong>{company.name || 'N/A'}</strong>
                          </div>
                        </td>
                        <td>{company.email || 'N/A'}</td>
                        <td>
                          <span className="badge badge-project">
                            {getProjectTypeDisplayName(company.projectType)}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getPlanTypeBadge(company.planType || company.plan?.name)}`}>
                            {company.planType || company.plan?.name || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadge(company.status)}`}>
                            {company.status || 'N/A'}
                          </span>
                        </td>
                        <td>
                          <div className="admin-info">
                            <span className="admin-name">{company.adminUser?.name || 'N/A'}</span>
                            <span className="admin-email">{company.adminUser?.email || 'N/A'}</span>
                          </div>
                        </td>
                        <td>{formatDate(company.createdAt)}</td>
                        <td>
                          <button 
                            className="btn-action-menu"
                            onClick={() => openActionModal(company)}
                            title="Actions"
                          >
                            <Icons.ThreeDots />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Pagination */}
            {companies.length > 0 && (
              <div className="pagination-container">
                <div className="pagination-info">
                  <span>
                    Showing {Math.min((currentPage - 1) * entriesPerPage + 1, totalCompanies)} to {Math.min(currentPage * entriesPerPage, totalCompanies)} of {totalCompanies} entries
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
                    <Icons.ChevronsLeft />
                  </button>
                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || totalPages === 0}
                  >
                    <Icons.ChevronLeft />
                  </button>

                  {renderPaginationButtons()}

                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <Icons.ChevronRight />
                  </button>
                  <button
                    className="pagination-btn"
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages || totalPages === 0}
                  >
                    <Icons.ChevronsRight />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ============================================ */}
        {/* ACTION MODAL - Clean Action Menu */}
        {/* ============================================ */}
        {showActionModal && actionCompany && (
          <div className="action-modal-overlay" onClick={closeActionModal}>
            <div className="action-modal" onClick={(e) => e.stopPropagation()}>
              <div className="action-modal-header">
                <h3>Company Actions</h3>
                <button className="action-modal-close" onClick={closeActionModal}>
                  <Icons.Close />
                </button>
              </div>
              <div className="action-modal-body">
                <div className="action-company-info">
                  <div className="action-company-name">{actionCompany.name}</div>
                  <div className="action-company-details">
                    <span className="action-company-code">Code: {actionCompany.code || 'N/A'}</span>
                    <span className={`badge ${getStatusBadge(actionCompany.status)}`}>
                      {actionCompany.status || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="action-buttons-grid">
                  <button 
                    className="action-btn action-btn-view"
                    onClick={() => handleViewCompany(actionCompany._id)}
                  >
                    <span className="action-btn-icon">👁️</span>
                    <span className="action-btn-label">View </span>
                  </button>

                  {canEdit && (
                    <button 
                      className="action-btn action-btn-edit"
                      onClick={() => handleEditCompany(actionCompany._id)}
                    >
                      <span className="action-btn-icon">✏️</span>
                      <span className="action-btn-label">Edit </span>
                    </button>
                  )}

                  {actionCompany.status === 'active' && canDelete && (
                    <button 
                      className="action-btn action-btn-deactivate"
                      onClick={() => handleDeactivateCompany(actionCompany._id)}
                    >
                      <span className="action-btn-icon">⛔</span>
                      <span className="action-btn-label">Deactivate</span>
                    </button>
                  )}

                  {actionCompany.status === 'inactive' && canDelete && (
                    <button 
                      className="action-btn action-btn-reactivate"
                      onClick={() => handleReactivateCompany(actionCompany._id)}
                    >
                      <span className="action-btn-icon">🔄</span>
                      <span className="action-btn-label">Reactivate</span>
                    </button>
                  )}

                  {isSuperAdmin && (
                    <button 
                      className="action-btn action-btn-delete"
                      onClick={() => handlePermanentDeleteCompany(actionCompany._id)}
                    >
                      <span className="action-btn-icon">🗑️</span>
                      <span className="action-btn-label">Delete</span>
                    </button>
                  )}
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

        {/* View Company Modal */}
        {showViewModal && selectedCompany && (
          <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
            <div className="modal modal-large" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Company Details</h3>
                <button 
                  className="modal-close"
                  onClick={() => setShowViewModal(false)}
                >
                  <Icons.Close />
                </button>
              </div>
              <div className="modal-body">
                <div className="company-detail-grid">
                  {/* Basic Information */}
                  <div className="detail-section">
                    <h4>Basic Information</h4>
                    <div className="detail-item">
                      <span className="detail-label">Code:</span>
                      <span className="detail-value">{selectedCompany.code || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Name:</span>
                      <span className="detail-value">{selectedCompany.name || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Email:</span>
                      <span className="detail-value">{selectedCompany.email || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Phone:</span>
                      <span className="detail-value">{selectedCompany.phone || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Address:</span>
                      <span className="detail-value">{selectedCompany.address || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">PIN:</span>
                      <span className="detail-value">{selectedCompany.pin || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Status:</span>
                      <span className={`badge ${getStatusBadge(selectedCompany.status)}`}>
                        {selectedCompany.status || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Project & Plan */}
                  <div className="detail-section">
                    <h4>Project & Plan</h4>
                    <div className="detail-item">
                      <span className="detail-label">Project Type:</span>
                      <span className="badge badge-project">
                        {getProjectTypeDisplayName(selectedCompany.projectType)}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Plan Type:</span>
                      <span className={`badge ${getPlanTypeBadge(selectedCompany.planType || selectedCompany.plan?.name)}`}>
                        {selectedCompany.planType || selectedCompany.plan?.name || 'N/A'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Project:</span>
                      <span className="detail-value">
                        {selectedCompany.projectDetails?.name || selectedCompany.project || 'N/A'}
                        {selectedCompany.projectDetails?.code && ` (${selectedCompany.projectDetails.code})`}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Plan:</span>
                      <span className="detail-value">
                        {selectedCompany.plan?.name ? (
                          <>
                            {selectedCompany.plan.name}
                            {selectedCompany.plan.price !== undefined && selectedCompany.plan.currency && 
                              ` - ${selectedCompany.plan.price} ${selectedCompany.plan.currency}`
                            }
                            {selectedCompany.plan.billingCycle && ` / ${selectedCompany.plan.billingCycle}`}
                          </>
                        ) : (
                          'N/A'
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Subscription */}
                  <div className="detail-section">
                    <h4>Subscription</h4>
                    <div className="detail-item">
                      <span className="detail-label">Status:</span>
                      <span className={`badge ${getStatusBadge(selectedCompany.subscription?.status)}`}>
                        {selectedCompany.subscription?.status || 'N/A'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Start Date:</span>
                      <span className="detail-value">{formatDate(selectedCompany.subscription?.startDate)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">End Date:</span>
                      <span className="detail-value">{formatDate(selectedCompany.subscription?.endDate)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Is Trial:</span>
                      <span className="detail-value">{selectedCompany.subscription?.isTrial ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Trial End:</span>
                      <span className="detail-value">{formatDate(selectedCompany.subscription?.trialEndDate)}</span>
                    </div>
                  </div>

                  {/* Admin User */}
                  <div className="detail-section">
                    <h4>Admin User</h4>
                    <div className="detail-item">
                      <span className="detail-label">Name:</span>
                      <span className="detail-value">{selectedCompany.adminUser?.name || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Email:</span>
                      <span className="detail-value">{selectedCompany.adminUser?.email || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Phone:</span>
                      <span className="detail-value">{selectedCompany.adminUser?.phone || 'N/A'}</span>
                    </div>
                  </div>

                  {/* Plan Renewal */}
                  <div className="detail-section">
                    <h4>Plan Renewal</h4>
                    <div className="detail-item">
                      <span className="detail-label">Type:</span>
                      <span className="detail-value">{selectedCompany.planRenewal?.type || 'N/A'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Auto-Renew:</span>
                      <span className="detail-value">{selectedCompany.planRenewal?.autoRenewEnabled ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Renewal Date:</span>
                      <span className="detail-value">{formatDate(selectedCompany.planRenewal?.renewalDate)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Next Renewal:</span>
                      <span className="detail-value">{formatDate(selectedCompany.planRenewal?.nextRenewalDate)}</span>
                    </div>
                  </div>

                  {/* Metadata */}
                  <div className="detail-section">
                    <h4>Metadata</h4>
                    <div className="detail-item">
                      <span className="detail-label">Created:</span>
                      <span className="detail-value">{formatDate(selectedCompany.createdAt)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Updated:</span>
                      <span className="detail-value">{formatDate(selectedCompany.updatedAt)}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Created By:</span>
                      <span className="detail-value">{selectedCompany.createdBy?.name || 'System'}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Companies;