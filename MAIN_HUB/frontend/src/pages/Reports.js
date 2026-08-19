// /home/kk/RS/MAIN HUB/frontend/src/pages/Reports.js

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { userService } from '../services/userService';
import { companyService } from '../services/companyService';
import { projectService } from '../services/projectService';
import './Reports.css';

const Reports = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState('overview');

  // Icon components
  const Icons = {
    Overview: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
    Projects: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    ),
    Companies: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    Users: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
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
    Error: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    )
  };

  // ✅ Hardcoded permission checks based on role
  const userRole = user?.role?.toLowerCase();
  const isSuperAdmin = userRole === 'super_admin';
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  // ✅ REMOVED: const isStaff = userRole === 'staff';

  // ✅ Can view reports - Super Admin, Admin, and Manager
  const canViewReports = isSuperAdmin || isAdmin || isManager;

  // ✅ Can view users - Super Admin and Admin only
  const canViewUsers = isSuperAdmin || isAdmin;

  // Wrap loadData in useCallback
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      let usersData = { data: [] };
      let companiesData = { data: [] };
      let projectsData = { data: [] };
      
      // Only fetch users if user has permission (Super Admin or Admin)
      if (canViewUsers) {
        console.log('📊 Reports - Fetching users (has permission)');
        try {
          usersData = await userService.getUsers();
          console.log('✅ Reports - Users loaded:', usersData.data?.length || 0);
        } catch (error) {
          console.warn('⚠️ Reports - Could not load users:', error.message);
        }
      } else {
        console.log('ℹ️ Reports - Skipping users fetch (no viewUsers permission)');
        usersData = { data: [] };
      }
      
      // Always fetch companies
      console.log('📊 Reports - Fetching companies');
      try {
        companiesData = await companyService.getCompanies();
        console.log('✅ Reports - Companies loaded:', companiesData.data?.length || 0);
      } catch (error) {
        console.warn('⚠️ Reports - Could not load companies:', error.message);
      }
      
      // Always fetch projects
      console.log('📊 Reports - Fetching projects');
      try {
        projectsData = await projectService.getProjects();
        console.log('✅ Reports - Projects loaded:', projectsData.data?.length || 0);
      } catch (error) {
        console.warn('⚠️ Reports - Could not load projects:', error.message);
      }
      
      const usersList = usersData.data || [];
      const companiesList = companiesData.data || [];
      let projectsList = [];
      
      if (projectsData && projectsData.data) {
        projectsList = Array.isArray(projectsData.data) ? projectsData.data : [];
      }
      
      setUsers(usersList);
      setCompanies(companiesList);
      setProjects(projectsList);
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [canViewUsers]);

  // Check permissions when component mounts
  useEffect(() => {
    if (!canViewReports) {
      console.log('🚫 Reports: No permission, redirecting to dashboard');
      navigate('/dashboard');
      return;
    }

    loadData();
  }, [canViewReports, navigate, loadData]);

  // Stats
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.isActive !== false).length;
  const totalCompanies = companies.length;
  const activeCompanies = companies.filter(c => c.status === 'active').length;
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'active').length;
  const maintenanceProjects = projects.filter(p => p.status === 'maintenance').length;
  const archivedProjects = projects.filter(p => p.status === 'archived').length;

  // Get companies by project type (string matching)
  const getCompaniesByProjectType = (projectType) => {
    return companies.filter(c => c.project === projectType || c.projectType === projectType);
  };

  const getRoleCount = (role) => {
    return users.filter(u => u.role === role).length;
  };

  if (loading) {
    return (
      <MainLayout title="Reports" breadcrumbs={['Home', 'Reports']}>
        <div className="loading-state">Loading reports...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Reports & Analytics" breadcrumbs={['Home', 'Reports']}>
      <div className="reports-page">
        {/* Report Tabs */}
        <div className="report-tabs">
          <button 
            className={`report-tab ${selectedReport === 'overview' ? 'active' : ''}`}
            onClick={() => setSelectedReport('overview')}
          >
            <Icons.Overview />
            Overview
          </button>
          <button 
            className={`report-tab ${selectedReport === 'projects' ? 'active' : ''}`}
            onClick={() => setSelectedReport('projects')}
          >
            <Icons.Projects />
            Projects
          </button>
          <button 
            className={`report-tab ${selectedReport === 'companies' ? 'active' : ''}`}
            onClick={() => setSelectedReport('companies')}
          >
            <Icons.Companies />
            Companies
          </button>
          <button 
            className={`report-tab ${selectedReport === 'users' ? 'active' : ''}`}
            onClick={() => setSelectedReport('users')}
          >
            <Icons.Users />
            Users
          </button>
        </div>

        {/* ============================================ */}
        {/* OVERVIEW REPORT */}
        {/* ============================================ */}
        {selectedReport === 'overview' && (
          <div className="report-content">
            <div className="report-header">
              <h2>
                <Icons.Overview />
                Platform Overview
              </h2>
              <p>Summary of all RS Hub activities and statistics</p>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  <Icons.Projects />
                </div>
                <div className="stat-number">{totalProjects || 0}</div>
                <div className="stat-label">Total Projects</div>
                <div className="stat-sub">{activeProjects || 0} active</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <Icons.Companies />
                </div>
                <div className="stat-number">{totalCompanies || 0}</div>
                <div className="stat-label">Total Companies</div>
                <div className="stat-sub">{activeCompanies || 0} active</div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  <Icons.Users />
                </div>
                <div className="stat-number">{totalUsers || 0}</div>
                <div className="stat-label">Total Users</div>
                <div className="stat-sub">{activeUsers || 0} active</div>
              </div>
            </div>

            <div className="report-sections">
              <div className="report-section">
                <h3>User Distribution by Role</h3>
                <div className="role-distribution">
                  <div className="role-bar">
                    <span className="role-label">Super Admin</span>
                    <div className="bar-track">
                      <div className="bar-fill super" style={{ width: `${(getRoleCount('super_admin') / (totalUsers || 1)) * 100 || 0}%` }}></div>
                    </div>
                    <span className="role-count">{getRoleCount('super_admin') || 0}</span>
                  </div>
                  <div className="role-bar">
                    <span className="role-label">Admin</span>
                    <div className="bar-track">
                      <div className="bar-fill admin" style={{ width: `${(getRoleCount('admin') / (totalUsers || 1)) * 100 || 0}%` }}></div>
                    </div>
                    <span className="role-count">{getRoleCount('admin') || 0}</span>
                  </div>
                  <div className="role-bar">
                    <span className="role-label">Manager</span>
                    <div className="bar-track">
                      <div className="bar-fill manager" style={{ width: `${(getRoleCount('manager') / (totalUsers || 1)) * 100 || 0}%` }}></div>
                    </div>
                    <span className="role-count">{getRoleCount('manager') || 0}</span>
                  </div>
                  <div className="role-bar">
                    <span className="role-label">Staff</span>
                    <div className="bar-track">
                      <div className="bar-fill staff" style={{ width: `${(getRoleCount('staff') / (totalUsers || 1)) * 100 || 0}%` }}></div>
                    </div>
                    <span className="role-count">{getRoleCount('staff') || 0}</span>
                  </div>
                  <div className="role-bar">
                    <span className="role-label">Guest</span>
                    <div className="bar-track">
                      <div className="bar-fill guest" style={{ width: `${(getRoleCount('guest') / (totalUsers || 1)) * 100 || 0}%` }}></div>
                    </div>
                    <span className="role-count">{getRoleCount('guest') || 0}</span>
                  </div>
                </div>
              </div>
              <div className="report-section">
                <h3>Top Companies</h3>
                <div className="company-list">
                  {companies.length === 0 ? (
                    <div className="no-data-message">No companies found</div>
                  ) : (
                    companies.slice(0, 5).map(company => (
                      <div key={company._id} className="company-item">
                        <span className="company-name">{company.name || 'N/A'}</span>
                        <span className="company-project">{company.projectType || company.project || 'N/A'}</span>
                        <span className={`company-status ${company.status || 'pending'}`}>{company.status || 'pending'}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* PROJECTS REPORT */}
        {/* ============================================ */}
        {selectedReport === 'projects' && (
          <div className="report-content">
            <div className="report-header">
              <h2>
                <Icons.Projects />
                Projects Report
              </h2>
              <p>Project statistics and company distribution</p>
            </div>

            <div className="stats-grid-small">
              <div className="stat-card-small">
                <span className="stat-number-small">{totalProjects || 0}</span>
                <span className="stat-label-small">Total Projects</span>
              </div>
              <div className="stat-card-small">
                <span className="stat-number-small">{activeProjects || 0}</span>
                <span className="stat-label-small">Active</span>
              </div>
              <div className="stat-card-small">
                <span className="stat-number-small">{maintenanceProjects || 0}</span>
                <span className="stat-label-small">Maintenance</span>
              </div>
              <div className="stat-card-small">
                <span className="stat-number-small">{archivedProjects || 0}</span>
                <span className="stat-label-small">Archived</span>
              </div>
              <div className="stat-card-small">
                <span className="stat-number-small">{totalCompanies || 0}</span>
                <span className="stat-label-small">Total Companies</span>
              </div>
            </div>

            <div className="report-table-container">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Code</th>
                    <th>Type</th>
                    <th>Companies</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="no-data-message">No projects found</td>
                    </tr>
                  ) : (
                    projects.map(project => {
                      const projectCompanies = getCompaniesByProjectType(project.type || project._id);
                      return (
                        <tr key={project.code || project._id}>
                          <td><strong>{project.name || 'N/A'}</strong></td>
                          <td>{project.code || 'N/A'}</td>
                          <td>{project.typeName || project.type || 'N/A'}</td>
                          <td>{projectCompanies.length || 0}</td>
                          <td>
                            <span className={`status-badge ${project.status || 'inactive'}`}>
                              {project.status || 'inactive'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* COMPANIES REPORT */}
        {/* ============================================ */}
        {selectedReport === 'companies' && (
          <div className="report-content">
            <div className="report-header">
              <h2>
                <Icons.Companies />
                Companies Report
              </h2>
              <p>Company statistics and project distribution</p>
            </div>

            <div className="stats-grid-small">
              <div className="stat-card-small">
                <span className="stat-number-small">{totalCompanies || 0}</span>
                <span className="stat-label-small">Total Companies</span>
              </div>
              <div className="stat-card-small">
                <span className="stat-number-small">{activeCompanies || 0}</span>
                <span className="stat-label-small">Active</span>
              </div>
              <div className="stat-card-small">
                <span className="stat-number-small">{totalCompanies - activeCompanies || 0}</span>
                <span className="stat-label-small">Inactive</span>
              </div>
            </div>

            <div className="report-table-container">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Company</th>
                    <th>Code</th>
                    <th>Email</th>
                    <th>Project</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="no-data-message">No companies found</td>
                    </tr>
                  ) : (
                    companies.map(company => {
                      const projectType = company.projectType || company.project || 'N/A';
                      return (
                        <tr key={company._id}>
                          <td><strong>{company.name || 'N/A'}</strong></td>
                          <td>{company.code || 'N/A'}</td>
                          <td>{company.email || 'N/A'}</td>
                          <td>
                            <span className="badge badge-project">
                              {projectType}
                            </span>
                          </td>
                          <td>
                            <span className={`status-badge ${company.status || 'pending'}`}>
                              {company.status || 'pending'}
                            </span>
                          </td>
                          <td>{company.createdAt ? new Date(company.createdAt).toLocaleDateString() : 'N/A'}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ============================================ */}
        {/* USERS REPORT */}
        {/* ============================================ */}
        {selectedReport === 'users' && (
          <div className="report-content">
            <div className="report-header">
              <h2>
                <Icons.Users />
                Users Report
              </h2>
              <p>Detailed user statistics and distribution</p>
            </div>

            <div className="stats-grid-small">
              <div className="stat-card-small">
                <span className="stat-number-small">{totalUsers || 0}</span>
                <span className="stat-label-small">Total Users</span>
              </div>
              <div className="stat-card-small">
                <span className="stat-number-small">{activeUsers || 0}</span>
                <span className="stat-label-small">Active</span>
              </div>
              <div className="stat-card-small">
                <span className="stat-number-small">{totalUsers - activeUsers || 0}</span>
                <span className="stat-label-small">Inactive</span>
              </div>
            </div>

            {totalUsers === 0 ? (
              <div className="no-data-message" style={{ padding: '40px' }}>
                <div style={{ fontSize: '3rem', marginBottom: '12px' }}>🔒</div>
                <p>User data is restricted. You don't have permission to view user details.</p>
                <p style={{ fontSize: '0.85rem', color: '#a0aec0' }}>
                  Contact your administrator for access.
                </p>
              </div>
            ) : (
              <div className="report-table-container">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Role</th>
                      <th>Count</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>Super Admin</td>
                      <td>{getRoleCount('super_admin') || 0}</td>
                      <td>{((getRoleCount('super_admin') / (totalUsers || 1)) * 100 || 0).toFixed(1)}%</td>
                    </tr>
                    <tr>
                      <td>Admin</td>
                      <td>{getRoleCount('admin') || 0}</td>
                      <td>{((getRoleCount('admin') / (totalUsers || 1)) * 100 || 0).toFixed(1)}%</td>
                    </tr>
                    <tr>
                      <td>Manager</td>
                      <td>{getRoleCount('manager') || 0}</td>
                      <td>{((getRoleCount('manager') / (totalUsers || 1)) * 100 || 0).toFixed(1)}%</td>
                    </tr>
                    <tr>
                      <td>Staff</td>
                      <td>{getRoleCount('staff') || 0}</td>
                      <td>{((getRoleCount('staff') / (totalUsers || 1)) * 100 || 0).toFixed(1)}%</td>
                    </tr>
                    <tr>
                      <td>Guest</td>
                      <td>{getRoleCount('guest') || 0}</td>
                      <td>{((getRoleCount('guest') / (totalUsers || 1)) * 100 || 0).toFixed(1)}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Reports;