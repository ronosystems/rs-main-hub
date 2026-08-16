// /home/kk/RS/MAIN HUB/frontend/src/pages/Projects.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
//import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/layout/MainLayout';
import { projectService } from '../services/projectService';
import { companyService } from '../services/companyService';
import './Projects.css';

const Projects = () => {
  //const { user } = useAuth(); // ✅ Removed the unused 'currentUser' alias
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [projectTypes, setProjectTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [projectsData, companiesData, typesData] = await Promise.all([
        projectService.getProjects({ limit: 100 }),
        companyService.getCompanies(),
        projectService.getProjectTypes()
      ]);
      
      console.log('📦 Projects from config:', projectsData);
      
      setProjects(projectsData.data || []);
      setCompanies(companiesData.data || []);
      setProjectTypes(typesData.data || []);
      
    } catch (error) {
      console.error('❌ Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter projects by type and search
  const getFilteredProjects = () => {
    let filtered = projects;
    
    if (selectedType !== 'all') {
      filtered = filtered.filter(p => p.type === selectedType);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(term) ||
        p.code.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term) ||
        p.typeName?.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  };

  const filteredProjects = getFilteredProjects();
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'active').length;

  // Get companies for a project
  const getProjectCompanies = (project) => {
    return companies.filter(c => c.project === project.type || c.projectType === project.type);
  };

  if (loading) {
    return (
      <MainLayout title="Projects" breadcrumbs={['Home', 'Projects']}>
        <div className="loading-state">Loading projects...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Projects Management" breadcrumbs={['Home', 'Projects']}>
      <div className="projects-page">
        <div className="page-header">
          <h2>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
            All Projects
          </h2>
          <div className="header-actions">
            <span className="text-muted">Total: {totalProjects} projects</span>
          </div>
        </div>

        {/* Stats */}
        <div className="projects-stats">
          <div className="stat-box">
            <span className="stat-number">{totalProjects}</span>
            <span className="stat-label">Total Projects</span>
          </div>
          <div className="stat-box">
            <span className="stat-number">{activeProjects}</span>
            <span className="stat-label">Active Projects</span>
          </div>
          <div className="stat-box">
            <span className="stat-number">{companies.length}</span>
            <span className="stat-label">Total Companies</span>
          </div>
          <div className="stat-box">
            <span className="stat-number">{companies.filter(c => c.status === 'active').length}</span>
            <span className="stat-label">Active Companies</span>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <select 
            value={selectedType} 
            onChange={(e) => setSelectedType(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Types</option>
            {projectTypes.map(type => (
              <option key={type.key} value={type.key}>
                {type.name} ({type.count || 0})
              </option>
            ))}
          </select>
        </div>

        {/* Projects Grid Cards */}
        <div className="projects-grid-container">
          {filteredProjects.length === 0 ? (
            <div className="no-data-message">
              <span className="no-data-icon">📦</span>
              <p>No projects found matching your criteria</p>
            </div>
          ) : (
            filteredProjects.map((project) => {
              const projectCompanies = getProjectCompanies(project);
              
              return (
                <div key={project.code} className="project-card">
                  {/* Card Header - Consistent padding */}
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

                  {/* Card Body - Consistent padding */}
                  <div className="project-card-body">
                    <h3 className="project-name">{project.name}</h3>
                    <p className="project-type">
                      <span className="type-label">Type:</span>
                      <span className="type-value">{project.typeName || project.type}</span>
                    </p>
                    <p className="project-description">{project.description}</p>
                  </div>

                  {/* Card Footer - Consistent padding */}
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
    </MainLayout>
  );
};

export default Projects;