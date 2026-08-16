// /home/kk/RS/MAIN HUB/frontend/src/pages/ProjectCompanies.js

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../context/PermissionContext';
import { projectService } from '../services/projectService';
import MainLayout from '../components/layout/MainLayout';
import './ProjectCompanies.css';

const ProjectCompanies = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();
  const location = useLocation();
  const { projectId } = useParams();
  
  const [companies, setCompanies] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // View Modal states
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);

  // Icon components
  const Icons = {
    Error: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    ),
    Back: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"/>
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
    Search: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
    Refresh: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10"/>
        <polyline points="1 20 1 14 7 14"/>
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
      </svg>
    ),
    Empty: () => (
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
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
    Close: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    ),
    Create: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    )
  };

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Get project type from URL params OR query params
  const getProjectType = useCallback(() => {
    if (projectId && projectId !== 'undefined' && projectId !== 'null') {
      return projectId;
    }
    
    const queryParams = new URLSearchParams(location.search);
    const queryType = queryParams.get('project');
    if (queryType && queryType !== 'undefined' && queryType !== 'null') {
      return queryType;
    }
    
    return null;
  }, [projectId, location.search]);

  const authToken = () => {
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

  // Fetch project and its companies - wrapped in useCallback
  const fetchProjectCompanies = useCallback(async () => {
    const projectType = getProjectType();
    
    if (!projectType) {
      setError('No project specified');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = authToken();
      
      console.log('🔍 Fetching project data for type:', projectType);
      
      // Get project from config using the correct method name
      try {
        const projectRes = await projectService.getProjectsByType(projectType);
        console.log('📦 Project response:', projectRes);
        
        if (projectRes && projectRes.data) {
          const projectData = Array.isArray(projectRes.data) ? projectRes.data[0] : projectRes.data;
          setProject(projectData);
        } else {
          setProject({
            name: projectType,
            type: projectType,
            code: projectType,
            status: 'active',
            description: 'Project from config'
          });
        }
      } catch (projectErr) {
        console.warn('Could not fetch project details, using default:', projectErr);
        setProject({
          name: projectType,
          type: projectType,
          code: projectType,
          status: 'active',
          description: 'Project from config'
        });
      }

      // Get all companies
      const companiesRes = await axios.get(`${API_URL}/companies`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('📦 Companies response:', companiesRes.data);

      if (companiesRes.data.success) {
        const filtered = companiesRes.data.data.filter(
          company => company.project === projectType || company.projectType === projectType
        );
        console.log(`✅ Found ${filtered.length} companies for project type: ${projectType}`);
        setCompanies(filtered);
      }

      setError(null);
    } catch (err) {
      console.error('❌ Error fetching project companies:', err);
      setError(err.response?.data?.message || 'Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  }, [getProjectType, API_URL]);

  // View company details
  const handleViewCompany = async (id) => {
    try {
      const token = authToken();
      console.log('🔍 Fetching company details for ID:', id);
      
      const response = await axios.get(`${API_URL}/companies/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('📦 Company details response:', response.data);
      
      if (response.data.success) {
        const companyData = response.data.data.company;
        console.log('✅ Company data:', companyData);
        setSelectedCompany(companyData);
        setShowViewModal(true);
      } else {
        console.error('❌ API returned success: false', response.data);
        alert('Failed to fetch company details');
      }
    } catch (err) {
      console.error('❌ Error fetching company details:', err);
      alert(err.response?.data?.message || 'Failed to fetch company details');
    }
  };

  // ✅ FIXED: Added fetchProjectCompanies to dependency array
  useEffect(() => {
    fetchProjectCompanies();
  }, [fetchProjectCompanies]);

  // Get filtered companies
  const getFilteredCompanies = () => {
    let filtered = companies;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(c => 
        c.name?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.code?.toLowerCase().includes(term)
      );
    }
    
    if (filterStatus !== 'all') {
      filtered = filtered.filter(c => c.status === filterStatus);
    }
    
    return filtered;
  };

  // Check permissions
  const canEdit = hasPermission('editCompanies') || user?.role === 'super_admin' || user?.role === 'admin';
  const canDelete = hasPermission('deleteCompanies') || user?.role === 'super_admin';

  const filteredCompanies = getFilteredCompanies();
  
  // Breadcrumbs
  const breadcrumbs = ['Home', 'Projects', project?.name || 'Companies'];

  if (loading) {
    return (
      <MainLayout title="Project Companies" breadcrumbs={breadcrumbs}>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading companies...</p>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Project Companies" breadcrumbs={breadcrumbs}>
        <div className="error-container">
          <div className="alert alert-error">
            <span className="alert-icon">
              <Icons.Error />
            </span>
            {error}
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/projects')}>
            <Icons.Back />
            Back to Projects
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={`Companies - ${project?.name || 'Project'}`} breadcrumbs={breadcrumbs}>
      <div className="project-companies-page">
        {/* Header Section */}
        <div className="companies-header">
          <div className="header-left">
            <button className="btn btn-secondary" onClick={() => navigate('/projects')}>
              <Icons.Back />
              Back to Projects
            </button>
            <div>
              <h2>{project?.name || 'Companies'}</h2>
              <p className="subtitle">
                {companies.length} companies assigned to this project
                {project?.code && ` (${project.code})`}
              </p>
            </div>
          </div>
          <div className="header-right">
            <span className={`project-status-badge ${project?.status || 'active'}`}>
              {project?.status || 'Active'}
            </span>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <Icons.Company />
            </div>
            <div className="stat-info">
              <span className="stat-value">{companies.length}</span>
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
              <span className="stat-label">Active</span>
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
              <span className="stat-label">Pending</span>
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
              <span className="stat-label">Inactive</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filters-left">
            <div className="search-box">
              <span className="search-icon">
                <Icons.Search />
              </span>
              <input
                type="text"
                placeholder="Search companies..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <select 
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div className="filters-right">
            <button className="btn btn-secondary" onClick={fetchProjectCompanies}>
              <Icons.Refresh />
              Refresh
            </button>
          </div>
        </div>

        {/* Companies Table */}
        <div className="table-container">
          {filteredCompanies.length === 0 ? (
            <div className="empty-state">
              <span className="empty-icon">
                <Icons.Empty />
              </span>
              <h3>No Companies Found</h3>
              <p>
                {companies.length === 0 
                  ? `No companies are assigned to "${project?.name || 'this project'}" yet.`
                  : 'No companies match your search criteria.'}
              </p>
              {companies.length === 0 && (
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
                {filteredCompanies.map((company) => (
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
                        {company.projectType || company.project || 'N/A'}
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
                      <div className="action-buttons">
                        <button 
                          className="btn-action btn-view"
                          onClick={() => handleViewCompany(company._id)}
                          title="View Details"
                        >
                          <Icons.View />
                        </button>
                        {canEdit && (
                          <button 
                            className="btn-action btn-edit"
                            onClick={() => navigate(`/companies/edit/${company._id}`)}
                            title="Edit Company"
                          >
                            <Icons.Edit />
                          </button>
                        )}
                        {canDelete && (
                          <button 
                            className="btn-action btn-delete"
                            onClick={() => {
                              if (window.confirm('Delete this company?')) {
                                // Handle delete
                              }
                            }}
                            title="Delete Company"
                          >
                            <Icons.Delete />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

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
                      {selectedCompany.projectType || selectedCompany.project || 'N/A'}
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
    </MainLayout>
  );
};

export default ProjectCompanies;