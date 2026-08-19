// /home/kk/RS/MAIN HUB/frontend/src/pages/SuperAdminDashboard.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/layout/MainLayout';
import { userService } from '../services/userService';
import { companyService } from '../services/companyService';
import { projectService } from '../services/projectService';
import './Dashboard.css';

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [projects, setProjects] = useState([]);
  // ✅ REMOVED loading state - no spinner

  // Icon components
  const Icons = {
    Projects: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    ),
    Companies: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    Users: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    Company: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    Tag: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
        <line x1="7" y1="7" x2="7.01" y2="7"/>
      </svg>
    )
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('🔍 Loading dashboard data...');
      
      const [usersData, companiesData, projectsData] = await Promise.all([
        userService.getUsers(),
        companyService.getCompanies(),
        projectService.getProjects({ limit: 100 })
      ]);
      
      console.log('📦 Users data:', usersData);
      console.log('📦 Companies data:', companiesData);
      console.log('📦 Projects data:', projectsData);
      
      setUsers(usersData.data || []);
      setCompanies(companiesData.data || []);
      
      // Handle projects data - could be array or object
      let projectsList = [];
      if (projectsData && projectsData.data) {
        projectsList = Array.isArray(projectsData.data) ? projectsData.data : [];
      }
      setProjects(projectsList);
      
      console.log('✅ Dashboard loaded successfully');
      console.log(`📊 Projects count: ${projectsList.length}`);
      
    } catch (error) {
      console.error('❌ Error loading data:', error);
    }
  };

  // Top Stats
  const totalUsers = users.length;
  const totalCompanies = companies.length;
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'active').length;

  // Get companies for a project
  const getProjectCompanies = (project) => {
    return companies.filter(c => c.project === project.type || c.projectType === project.type);
  };

  // Get user count for a company
  const getUserCountForCompany = (companyId) => {
    return users.filter(u => u.company === companyId || u.company?._id === companyId).length;
  };

  // Get top 4 projects by company count
  const top4Projects = projects.length > 0
    ? [...projects]
        .map(project => ({
          ...project,
          companyCount: getProjectCompanies(project).length
        }))
        .sort((a, b) => b.companyCount - a.companyCount)
        .slice(0, 4)
    : [];

  // Get recent 4 companies with user count
  const recentCompanies = companies.length > 0
    ? [...companies]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 4)
        .map(company => ({
          ...company,
          userCount: getUserCountForCompany(company._id)
        }))
    : [];

  // ✅ REMOVED loading check - always render

  return (
    <MainLayout title="Super Admin Dashboard" breadcrumbs={['Home', 'Dashboard']}>
      <div className="dashboard-content">
        {/* Welcome Section */}
        <div className="welcome-section">
          <h1>Welcome, {user?.name}!</h1>
          <p>You have full access to all RS Hub systems, projects and companies.</p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{totalProjects}</div>
            <div className="stat-label">
              <Icons.Projects />
              Projects
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalCompanies}</div>
            <div className="stat-label">
              <Icons.Companies />
              Companies
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalUsers}</div>
            <div className="stat-label">
              <Icons.Users />
              Users
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{activeProjects}</div>
            <div className="stat-label">
              <Icons.Projects />
              Active Projects
            </div>
          </div>
        </div>

        {/* Top 4 Projects */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">
              <Icons.Projects />
              Top 4 Projects
            </h2>
            <button 
              className="view-all-btn"
              onClick={() => navigate('/projects')}
            >
              View All Projects →
            </button>
          </div>

          {/* Top 4 Projects Grid */}
          <div className="top-projects-grid">
            {top4Projects.length === 0 ? (
              <div className="no-data-message">
                <p>No projects found.</p>
              </div>
            ) : (
              top4Projects.map((project) => {
                const projectCompanies = getProjectCompanies(project);
                
                return (
                  <div key={project.code} className="top-project-card">
                    {/* Card Header */}
                    <div className="project-card-header" style={{ backgroundColor: project.color || '#6c757d' }}>
                      <div className="project-icon-wrapper">
                        <i className={`fas ${project.icon || 'fa-cube'}`}></i>
                      </div>
                      <div className="project-header-info">
                        <span className="project-code">{project.code}</span>
                        <span className={`project-status ${project.status}`}>
                          {project.status === 'active' && '● Active'}
                          {project.status === 'inactive' && '● Inactive'}
                          {project.status === 'maintenance' && '● Maintenance'}
                          {project.status === 'archived' && '● Archived'}
                        </span>
                      </div>
                      <div className="project-header-company-count">
                        <span className="company-count-number">{projectCompanies.length}</span>
                        <span className="company-count-label">Companies</span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="project-card-body">
                      <h3 className="project-name">{project.name}</h3>
                      <p className="project-type">
                        <span className="type-label">Type:</span>
                        <span className="type-value">{project.typeName || project.type}</span>
                      </p>
                      <p className="project-description">{project.description}</p>
                    </div>

                    {/* Card Footer */}
                    <div className="project-card-footer">
                      <button 
                        className="btn-view-companies"
                        onClick={() => navigate(`/companies/project/${project.type}`)}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                          <polyline points="9 22 9 12 15 12 15 22"/>
                        </svg>
                        View Companies
                        <span className="company-count-badge">{projectCompanies.length}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Companies */}
        <div className="section">
          <h2 className="section-title">
            <Icons.Companies />
            Recent Companies
          </h2>
          <div className="companies-grid">
            {recentCompanies.length === 0 ? (
              <div className="no-data-message">
                <p>No companies found.</p>
              </div>
            ) : (
              recentCompanies.map((company) => (
                <div key={company._id} className="company-card">
                  <div className="company-card-header">
                    <h3>{company.name}</h3>
                    <span className={`company-status ${company.status || 'pending'}`}>
                      {company.status === 'active' && '● Active'}
                      {company.status === 'inactive' && '● Inactive'}
                      {company.status === 'suspended' && '● Suspended'}
                      {company.status === 'pending' && '● Pending'}
                      {!company.status && '● Pending'}
                    </span>
                  </div>
                  <p className="company-email">{company.email || 'N/A'}</p>
                  <p className="company-type">Type: {company.projectType || 'N/A'}</p>
                  <div className="company-meta">
                    <span className="company-code">{company.code || 'N/A'}</span>
                    <span className="company-users">
                      <Icons.Users />
                      {company.userCount || 0} users
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        /* Stats Grid - 4 columns */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          border-bottom: 4px solid #00d4ff;
          transition: all 0.3s;
        }

        .stat-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .stat-card:nth-child(2) { border-bottom-color: #28a745; }
        .stat-card:nth-child(3) { border-bottom-color: #dc3545; }
        .stat-card:nth-child(4) { border-bottom-color: #ffc107; }

        .stat-value {
          font-size: 2.2rem;
          font-weight: 700;
          color: #0a0a0a;
          display: block;
        }

        .stat-label {
          font-size: 0.9rem;
          color: #718096;
          margin-top: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }

        .stat-label svg {
          width: 18px;
          height: 18px;
          stroke: #718096;
        }

        /* Section Header */
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .section-title {
          font-size: 1.2rem;
          font-weight: 600;
          color: #1a1a2e;
          display: flex;
          align-items: center;
          gap: 10px;
          border-bottom: none;
          padding-bottom: 0;
        }

        .section-title svg {
          width: 22px;
          height: 22px;
          stroke: #00d4ff;
        }

        .view-all-btn {
          background: transparent;
          border: none;
          color: #00d4ff;
          cursor: pointer;
          font-size: 0.95rem;
          font-weight: 500;
          padding: 8px 16px;
          border-radius: 8px;
          transition: all 0.3s;
        }

        .view-all-btn:hover {
          background: #00d4ff;
          color: white;
        }

        .text-muted {
          color: #718096;
          font-size: 0.9rem;
        }

        .welcome-section {
          background: white;
          padding: 25px 30px;
          border-radius: 12px;
          margin-bottom: 25px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          border-left: 4px solid #00d4ff;
        }

        .welcome-section h1 {
          font-size: 1.5rem;
          color: #1a1a2e;
          margin-bottom: 5px;
        }

        .welcome-section p {
          color: #718096;
          font-size: 1rem;
          margin: 0;
        }

        .section {
          margin-bottom: 30px;
        }

        /* Top Projects Grid - 4 columns */
        .top-projects-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-top: 15px;
        }

        .top-project-card {
          background: white;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          transition: all 0.3s ease;
          display: flex;
          flex-direction: column;
        }

        .top-project-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
        }

        /* Card Header */
        .project-card-header {
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: white;
          position: relative;
          min-height: 70px;
        }

        .project-icon-wrapper {
          width: 40px;
          height: 40px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.4rem;
          flex-shrink: 0;
        }

        .project-header-info {
          flex: 1;
          margin-left: 14px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .project-code {
          font-size: 0.8rem;
          font-weight: 600;
          opacity: 0.9;
          letter-spacing: 0.5px;
        }

        .project-status {
          font-size: 0.7rem;
          font-weight: 500;
          opacity: 0.9;
        }

        .project-status.active { color: #90ee90; }
        .project-status.inactive { color: #ffb3b3; }
        .project-status.maintenance { color: #ffd700; }
        .project-status.archived { color: #d3d3d3; }

        .project-header-company-count {
          text-align: center;
          background: rgba(255, 255, 255, 0.15);
          padding: 4px 12px;
          border-radius: 8px;
          flex-shrink: 0;
        }

        .company-count-number {
          display: block;
          font-size: 1.3rem;
          font-weight: 700;
          line-height: 1.2;
        }

        .company-count-label {
          font-size: 0.6rem;
          opacity: 0.8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        /* Card Body */
        .project-card-body {
          padding: 18px 20px;
          flex: 1;
        }

        .project-name {
          font-size: 1rem;
          font-weight: 700;
          color: #1a1a2e;
          margin: 0 0 4px 0;
        }

        .project-type {
          font-size: 0.85rem;
          color: #718096;
          margin: 0 0 10px 0;
        }

        .type-label {
          font-weight: 500;
          color: #a0aec0;
        }

        .type-value {
          color: #4a5568;
          font-weight: 500;
        }

        .project-description {
          font-size: 0.85rem;
          color: #4a5568;
          line-height: 1.4;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        /* Card Footer */
        .project-card-footer {
          padding: 14px 20px;
          border-top: 1px solid #e2e8f0;
          background: #f7fafc;
        }

        .btn-view-companies {
          width: 100%;
          padding: 10px;
          background: white;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          color: #4a5568;
          font-weight: 500;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-view-companies:hover {
          background: #00d4ff;
          border-color: #00d4ff;
          color: white;
        }

        .btn-view-companies svg {
          width: 16px;
          height: 16px;
        }

        .company-count-badge {
          background: #e2e8f0;
          color: #4a5568;
          padding: 2px 10px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }

        .btn-view-companies:hover .company-count-badge {
          background: rgba(255, 255, 255, 0.2);
          color: white;
        }

        /* Companies Grid */
        .companies-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
          margin-top: 15px;
        }

        .company-card {
          background: white;
          padding: 20px;
          border-radius: 12px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          transition: all 0.3s;
          border-top: 4px solid #00d4ff;
        }

        .company-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
        }

        .company-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .company-card-header h3 {
          font-size: 1.1rem;
          color: #1a1a2e;
          margin: 0;
        }

        .company-status {
          font-size: 0.75rem;
          font-weight: 500;
          padding: 2px 10px;
          border-radius: 10px;
        }

        .company-status.active {
          color: #155724;
          background: #d4edda;
        }

        .company-status.inactive {
          color: #721c24;
          background: #f8d7da;
        }

        .company-status.suspended {
          color: #856404;
          background: #fff3cd;
        }

        .company-status.pending {
          color: #0c5460;
          background: #d1ecf1;
        }

        .company-email {
          color: #4a5568;
          font-size: 0.85rem;
          margin: 4px 0;
        }

        .company-type {
          color: #718096;
          font-size: 0.8rem;
          margin: 4px 0 12px 0;
        }

        .company-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 10px;
          border-top: 1px solid #e2e8f0;
        }

        .company-code {
          font-size: 0.75rem;
          color: #00d4ff;
          font-weight: 600;
          font-family: monospace;
        }

        .company-users {
          font-size: 0.8rem;
          color: #718096;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .company-users svg {
          width: 14px;
          height: 14px;
          stroke: #718096;
        }

        .no-data-message {
          grid-column: 1 / -1;
          text-align: center;
          padding: 30px;
          background: white;
          border-radius: 12px;
          color: #718096;
        }

        .loading-state {
          text-align: center;
          padding: 60px 20px;
          color: #718096;
          font-size: 1.1rem;
        }

        /* Responsive */
        @media (max-width: 1200px) {
          .top-projects-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          
          .top-projects-grid {
            grid-template-columns: 1fr;
          }
          
          .companies-grid {
            grid-template-columns: 1fr;
          }
          
          .welcome-section {
            padding: 20px;
          }
          
          .welcome-section h1 {
            font-size: 1.2rem;
          }
          
          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
        }

        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </MainLayout>
  );
};

export default SuperAdminDashboard;