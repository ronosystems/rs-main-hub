// /home/kk/RS/MAIN HUB/frontend/src/pages/UsersForm.js

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/layout/MainLayout';
import { userService } from '../services/userService';
import { companyService } from '../services/companyService';
import { projectService } from '../services/projectService';
import './UsersForm.css';

const UsersForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'guest',
    company: '',
    project: '',
    phone: '',
    projectRole: 'staff',
    companyRole: 'company_staff'
  });

  // ✅ Hardcoded permission checks based on role
  const userRole = currentUser?.role?.toLowerCase();
  const isSuperAdmin = userRole === 'super_admin';
  const isAdmin = userRole === 'admin';
  const isManager = userRole === 'manager';
  const isStaff = userRole === 'staff';

  // ✅ Can manage users - Super Admin and Admin only
  const canManageUsers = isSuperAdmin || isAdmin;

  // ✅ Get allowed roles based on current user's role
  const getAllowedRoles = useCallback(() => {
    if (isSuperAdmin) {
      return ['super_admin', 'admin', 'manager', 'staff', 'guest'];
    }
    if (isAdmin) {
      return ['manager', 'staff', 'guest'];
    }
    if (isManager) {
      return ['guest'];
    }
    return ['guest'];
  }, [isSuperAdmin, isAdmin, isManager]);

  // ✅ Get allowed company roles (for Guest users)
  const getAllowedCompanyRoles = useCallback(() => {
    return [
      { value: 'company_admin', label: 'Company Admin' },
      { value: 'company_manager', label: 'Company Manager' },
      { value: 'company_cashier', label: 'Company Cashier' },
      { value: 'company_agent', label: 'Company Agent' },
      { value: 'company_staff', label: 'Company Staff' }
    ];
  }, []);

  // ✅ Check if a role is allowed for the current user
  const isRoleAllowed = useCallback((role) => {
    const allowedRoles = getAllowedRoles();
    return allowedRoles.includes(role);
  }, [getAllowedRoles]);

  // ✅ Redirect if user doesn't have permission
  useEffect(() => {
    if (!canManageUsers) {
      navigate('/dashboard');
    }
  }, [canManageUsers, navigate]);

  // ✅ Fetch dropdown data (companies and projects)
  const fetchDropdownData = useCallback(async () => {
    try {
      const [companiesData, projectsData] = await Promise.all([
        companyService.getCompanies(),
        projectService.getProjects()
      ]);
      setCompanies(companiesData.data || []);
      setProjects(projectsData.data || []);
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  }, []);

  // ✅ Fetch user data for editing
  const fetchUserData = useCallback(async (userId) => {
    try {
      setLoading(true);
      const response = await userService.getUser(userId);
      if (response.success) {
        const userData = response.data;
        
        if (!isRoleAllowed(userData.role)) {
          setFormError('You do not have permission to edit this user');
          setTimeout(() => {
            navigate('/users');
          }, 2000);
          return;
        }
        
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          password: '',
          role: userData.role || 'guest',
          company: userData.company?._id || userData.company || '',
          project: userData.project?._id || userData.project || '',
          phone: userData.phone || '',
          projectRole: userData.projectRole || 'staff',
          companyRole: userData.companyRole || 'company_staff'
        });
        await fetchDropdownData();
      } else {
        setFormError('Failed to fetch user data');
      }
    } catch (error) {
      console.error('Error fetching user:', error);
      setFormError('Failed to fetch user data');
    } finally {
      setLoading(false);
    }
  }, [fetchDropdownData, navigate, isRoleAllowed]);

  // ✅ Check if editing
  useEffect(() => {
    if (id && id !== 'undefined' && id !== 'null') {
      setIsEdit(true);
      fetchUserData(id);
    } else {
      setIsEdit(false);
      const defaultRoles = getAllowedRoles();
      setFormData(prev => ({
        ...prev,
        role: defaultRoles[0] || 'guest',
        companyRole: 'company_staff'
      }));
      fetchDropdownData();
    }
  }, [id, fetchUserData, fetchDropdownData, getAllowedRoles]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (formError) {
      setFormError('');
    }
  };

  const handleRoleChange = (e) => {
    const role = e.target.value;
    if (!isRoleAllowed(role)) {
      setFormError('You do not have permission to assign this role');
      return;
    }
    setFormData(prev => ({
      ...prev,
      role: role
    }));
    if (formError) {
      setFormError('');
    }
  };

  const handleCompanyChange = (e) => {
    const companyId = e.target.value;
    setFormData(prev => ({
      ...prev,
      company: companyId,
      project: getProjectForCompany(companyId)
    }));
    if (formError) {
      setFormError('');
    }
  };

  const getProjectForCompany = (companyId) => {
    if (!companyId) return '';
    
    const selectedCompany = companies.find(c => c._id === companyId);
    if (!selectedCompany) return '';
    
    if (selectedCompany.project) {
      return selectedCompany.project;
    }
    
    if (selectedCompany.projectType) {
      const matchingProject = projects.find(p => 
        p.type === selectedCompany.projectType || 
        p.name === selectedCompany.projectType ||
        p.typeName === selectedCompany.projectType
      );
      if (matchingProject) {
        return matchingProject._id;
      }
    }
    
    return '';
  };

  const handleProjectChange = (e) => {
    const projectId = e.target.value;
    setFormData(prev => ({
      ...prev,
      project: projectId
    }));
    if (formError) {
      setFormError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setSubmitting(true);

    if (!formData.name) {
      setFormError('Name is required');
      setSubmitting(false);
      return;
    }
    
    if (!formData.email) {
      setFormError('Email is required');
      setSubmitting(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormError('Please enter a valid email address');
      setSubmitting(false);
      return;
    }

    if (!isRoleAllowed(formData.role)) {
      setFormError('You do not have permission to assign this role');
      setSubmitting(false);
      return;
    }

    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        role: formData.role || 'guest',
        company: formData.company || null,
        project: formData.project || null,
        phone: formData.phone || '',
        projectRole: formData.projectRole || 'staff'
      };

      if (formData.role === 'guest' && formData.companyRole) {
        userData.companyRole = formData.companyRole;
      }

      if (formData.password) {
        if (formData.password.length < 6) {
          setFormError('Password must be at least 6 characters');
          setSubmitting(false);
          return;
        }
        userData.password = formData.password;
      }

      let result;
      if (isEdit) {
        result = await userService.updateUser(id, userData);
      } else {
        if (!formData.password) {
          setFormError('Password is required for new users');
          setSubmitting(false);
          return;
        }
        result = await userService.createUser(userData);
      }

      if (result.success) {
        setFormSuccess(isEdit ? '✅ User updated successfully!' : '✅ User created successfully!');
        setTimeout(() => {
          navigate('/users');
        }, 1500);
      } else {
        setFormError(result.message || 'Failed to save user');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      setFormError(error.response?.data?.message || 'Failed to save user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate('/users');
  };

  if (!canManageUsers) {
    navigate('/dashboard');
    return null;
  }

  const allowedRoles = getAllowedRoles();
  const allowedCompanyRoles = getAllowedCompanyRoles();

  if (loading) {
    return (
      <MainLayout title={isEdit ? 'Edit User' : 'Create User'} breadcrumbs={['Home', 'Users', isEdit ? 'Edit' : 'Create']}>
        <div className="loading-state">Loading...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={isEdit ? 'Edit User' : 'Create User'} breadcrumbs={['Home', 'Users', isEdit ? 'Edit' : 'Create']}>
      <div className="users-form-page">
        <div className="form-header">
          <button className="btn-back" onClick={handleCancel}>
            ← Back to Users
          </button>
          <h2>{isEdit ? 'Edit User' : 'Create New User'}</h2>
        </div>

        {formError && (
          <div className="alert alert-error">
            <span className="alert-icon">❌</span>
            {formError}
          </div>
        )}
        {formSuccess && (
          <div className="alert alert-success">
            <span className="alert-icon">✅</span>
            {formSuccess}
          </div>
        )}

        <form onSubmit={handleSubmit} className="users-form">
          {/* ROW 1: Full Name, Email, Password */}
          <div className="form-row">
            <div className="form-group">
              <label>Full Name <span className="required">*</span></label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="form-group">
              <label>Email Address <span className="required">*</span></label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter email address"
                required
              />
            </div>

            <div className="form-group">
              <label>{isEdit ? 'New Password' : 'Password'}</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder={isEdit ? 'Enter new password (optional)' : 'Enter password (min 6 chars)'}
                required={!isEdit}
                minLength="6"
              />
              {isEdit && (
                <small className="form-hint">Leave blank to keep current password</small>
              )}
            </div>
          </div>

          {/* ROW 2: Phone, System Role, Company Role */}
          <div className="form-row">
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Enter phone number"
              />
            </div>

            <div className="form-group">
              <label>System Role</label>
              <select
                name="role"
                value={formData.role}
                onChange={handleRoleChange}
              >
                {allowedRoles.map(role => (
                  <option key={role} value={role}>
                    {role.replace('_', ' ').toUpperCase()}
                  </option>
                ))}
              </select>
              {isAdmin && (
                <small className="form-hint" style={{ color: '#4a6cf7' }}>
                  ℹ️ Admin can only assign Manager, Staff, or Guest roles
                </small>
              )}
            </div>

            {/* Company Role field - only visible for Guest users */}
            {formData.role === 'guest' ? (
              <div className="form-group">
                <label>Company Role</label>
                <select
                  name="companyRole"
                  value={formData.companyRole || 'company_staff'}
                  onChange={handleChange}
                >
                  {allowedCompanyRoles.map(role => (
                    <option key={role.value} value={role.value}>
                      {role.label}
                    </option>
                  ))}
                </select>
                <small className="form-hint" style={{ color: '#4a6cf7' }}>
                  ℹ️ Used within the project (e.g., TRONIC_MASTER)
                </small>
              </div>
            ) : (
              <div className="form-group">
                <label>Company Role</label>
                <div className="form-disabled">
                  <span className="disabled-text">Not applicable for system users</span>
                </div>
                <small className="form-hint">Only available for Guest users</small>
              </div>
            )}
          </div>

          {/* ROW 3: Project Role, Company, Project */}
          <div className="form-row">
            <div className="form-group">
              <label>Project Role</label>
              <select
                name="projectRole"
                value={formData.projectRole || 'staff'}
                onChange={handleChange}
              >
                <option value="admin">Project Admin</option>
                <option value="manager">Project Manager</option>
                <option value="staff">Project Staff</option>
              </select>
              <small className="form-hint">Role within the project</small>
            </div>

            <div className="form-group">
              <label>Company</label>
              <select
                name="company"
                value={formData.company}
                onChange={handleCompanyChange}
              >
                <option value="">No Company</option>
                {companies.map(company => (
                  <option key={company._id} value={company._id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Project</label>
              <select
                name="project"
                value={formData.project}
                onChange={handleProjectChange}
              >
                <option value="">No Project</option>
                {projects.map(project => (
                  <option key={project._id} value={project._id}>
                    {project.name}
                  </option>
                ))}
              </select>
              {formData.company && formData.project && (
                <small className="form-hint" style={{ color: '#4a6cf7' }}>
                  ✅ Auto-selected based on company
                </small>
              )}
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn-secondary" onClick={handleCancel}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : (isEdit ? 'Update User' : 'Create User')}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default UsersForm;