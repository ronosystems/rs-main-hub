// /home/kk/RS/MAIN HUB/frontend/src/pages/CompanyForm.js

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
// ✅ Removed unused useAuth
// ✅ Removed unused usePermissions
import MainLayout from '../components/layout/MainLayout';
import './CompanyForm.css';

const CompanyForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [projects, setProjects] = useState([]);
  const [plans, setPlans] = useState([]);
  const [isEdit, setIsEdit] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    pin: '',
    description: '',
    projectId: '',
    planId: '',
    planRenewal: {
      type: 'manual',
      autoRenewEnabled: false,
      renewalDate: ''
    },
    adminUser: {
      name: '',
      email: '',
      password: '',
      phone: ''
    },
    subscription: {
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      trialEndDate: '',
      isTrial: true,
      status: 'trial'
    }
  });

  const [formErrors, setFormErrors] = useState({});

  const API_URL = 'https://main-hub-api-ea52e89c5128.herokuapp.com/api';

  const getAuthToken = () => {
    return localStorage.getItem('token');
  };

  // ✅ Fetch projects and plans - wrapped in useCallback
  const fetchDropdownData = useCallback(async () => {
    try {
      const token = getAuthToken();
      
      const [projectsRes, plansRes] = await Promise.all([
        axios.get(`${API_URL}/projects`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_URL}/plans`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      if (projectsRes.data.success) {
        const projectsList = projectsRes.data.data.map(p => ({
          ...p,
          type: p.type || p._id
        }));
        setProjects(projectsList);
        console.log('📋 Projects loaded:', projectsList);
      }
      if (plansRes.data.success) {
        setPlans(plansRes.data.data);
        console.log('📋 Plans loaded:', plansRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
    }
  }, [API_URL]);

  // ✅ Fetch company data for editing - wrapped in useCallback
  const fetchCompanyData = useCallback(async (companyId) => {
    try {
      setLoading(true);
      const token = getAuthToken();
      
      if (!companyId || companyId === 'undefined' || companyId === 'null') {
        alert('Invalid company ID. Please go back and try again.');
        navigate('/companies');
        return;
      }

      const response = await axios.get(`${API_URL}/companies/${companyId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        const data = response.data.data;
        const company = data.company;
        
        console.log('📋 Company data loaded:', company);
        console.log('📋 Project type:', company.projectType || company.project);
        
        setFormData({
          name: company.name || '',
          email: company.email || '',
          phone: company.phone || '',
          address: company.address || '',
          pin: company.pin || '',
          description: company.description || '',
          projectId: company.projectType || company.project || '',
          planId: company.plan?._id || '',
          planRenewal: {
            type: company.planRenewal?.type || 'manual',
            autoRenewEnabled: company.planRenewal?.autoRenewEnabled || false,
            renewalDate: company.planRenewal?.renewalDate ? company.planRenewal.renewalDate.split('T')[0] : ''
          },
          adminUser: {
            name: company.adminUser?.name || '',
            email: company.adminUser?.email || '',
            password: '',
            phone: company.adminUser?.phone || ''
          },
          subscription: {
            startDate: company.subscription?.startDate ? company.subscription.startDate.split('T')[0] : new Date().toISOString().split('T')[0],
            endDate: company.subscription?.endDate ? company.subscription.endDate.split('T')[0] : '',
            trialEndDate: company.subscription?.trialEndDate ? company.subscription.trialEndDate.split('T')[0] : '',
            isTrial: company.subscription?.isTrial !== undefined ? company.subscription.isTrial : true,
            status: company.subscription?.status || 'trial'
          }
        });
        
        await fetchDropdownData();
      } else {
        alert(response.data.message || 'Failed to fetch company data');
      }
    } catch (error) {
      console.error('Error fetching company:', error);
      if (error.response?.status === 404) {
        alert('Company not found.');
        navigate('/companies');
      } else {
        alert(error.response?.data?.message || 'Failed to fetch company data');
      }
    } finally {
      setLoading(false);
    }
  }, [API_URL, navigate, fetchDropdownData]); // ✅ Added fetchDropdownData to dependencies

  // ✅ Check if editing - with proper dependencies
  useEffect(() => {
    if (id && id !== 'undefined' && id !== 'null') {
      setIsEdit(true);
      fetchCompanyData(id);
    } else {
      setIsEdit(false);
      fetchDropdownData();
    }
  }, [id, fetchCompanyData, fetchDropdownData]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleAdminUserChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      adminUser: {
        ...prev.adminUser,
        [name]: value
      }
    }));
    const errorKey = `adminUser${name.charAt(0).toUpperCase() + name.slice(1)}`;
    if (formErrors[errorKey]) {
      setFormErrors(prev => ({ ...prev, [errorKey]: '' }));
    }
  };

  const handlePlanRenewalChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        planRenewal: {
          ...prev.planRenewal,
          [name]: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        planRenewal: {
          ...prev.planRenewal,
          [name]: value
        }
      }));
    }
  };

  const handleSubscriptionChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        subscription: {
          ...prev.subscription,
          [name]: checked
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        subscription: {
          ...prev.subscription,
          [name]: value
        }
      }));
    }
  };

  // Validate current step
  const validateStep = () => {
    const errors = {};
    
    if (currentStep === 1) {
      if (!formData.name || formData.name.trim() === '') {
        errors.name = 'Company name is required';
      }
      if (!formData.email || formData.email.trim() === '') {
        errors.email = 'Company email is required';
      } else if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = 'Invalid email format';
      }
    }
    
    if (currentStep === 2) {
      if (!formData.projectId || formData.projectId === '') {
        errors.projectId = 'Project selection is required';
      }
      if (!formData.planId || formData.planId === '') {
        errors.planId = 'Plan selection is required';
      }
    }
    
    if (currentStep === 3) {
      if (!formData.adminUser.name || formData.adminUser.name.trim() === '') {
        errors.adminUserName = 'Admin name is required';
      }
      if (!formData.adminUser.email || formData.adminUser.email.trim() === '') {
        errors.adminUserEmail = 'Admin email is required';
      } else if (formData.adminUser.email && !/\S+@\S+\.\S+/.test(formData.adminUser.email)) {
        errors.adminUserEmail = 'Invalid email format';
      }
      if (!isEdit) {
        if (!formData.adminUser.password || formData.adminUser.password.trim() === '') {
          errors.adminUserPassword = 'Admin password is required';
        } else if (formData.adminUser.password && formData.adminUser.password.length < 6) {
          errors.adminUserPassword = 'Password must be at least 6 characters';
        }
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Navigation
  const nextStep = () => {
    if (validateStep()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Submit form
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) {
      return;
    }

    try {
      setSubmitting(true);
      const token = getAuthToken();
      
      const submitData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone || '',
        address: formData.address || '',
        pin: formData.pin || '',
        description: formData.description || '',
        projectId: formData.projectId,
        planId: formData.planId,
        planRenewal: {
          type: formData.planRenewal.type || 'manual',
          autoRenewEnabled: formData.planRenewal.autoRenewEnabled || false,
          renewalDate: formData.planRenewal.renewalDate || null
        },
        adminUser: {
          name: formData.adminUser.name.trim(),
          email: formData.adminUser.email.trim().toLowerCase(),
          password: formData.adminUser.password,
          phone: formData.adminUser.phone || ''
        },
        subscription: {
          startDate: formData.subscription.startDate || new Date().toISOString().split('T')[0],
          endDate: formData.subscription.endDate || null,
          trialEndDate: formData.subscription.trialEndDate || null,
          isTrial: formData.subscription.isTrial !== undefined ? formData.subscription.isTrial : true,
          status: formData.subscription.status || 'trial'
        }
      };

      console.log('📤 Submitting data:', submitData);

      let response;
      if (isEdit) {
        response = await axios.put(`${API_URL}/companies/${id}`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        response = await axios.post(`${API_URL}/companies`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      if (response.data.success) {
        alert(isEdit ? '✅ Company updated successfully!' : '✅ Company created successfully!');
        navigate('/companies');
      }
    } catch (error) {
      console.error('Error saving company:', error);
      alert(error.response?.data?.message || 'Failed to save company');
    } finally {
      setSubmitting(false);
    }
  };

  // Get project name by type
  const getProjectName = (projectType) => {
    const project = projects.find(p => p.type === projectType || p._id === projectType);
    return project ? project.name : 'Not selected';
  };

  // Get plan name by ID
  const getPlanName = (planId) => {
    const plan = plans.find(p => p._id === planId);
    return plan ? plan.name : 'Not selected';
  };

  // Breadcrumbs
  const breadcrumbs = ['Home', 'Companies', isEdit ? 'Edit Company' : 'Create Company'];

  // Render step content
  const renderStepContent = () => {
    switch(currentStep) {
      case 1:
        return (
          <div className="form-step">
            <div className="step-header">
              <h3>📋 Company Information</h3>
              <p className="step-description">Enter the basic information about the company</p>
            </div>
            <div className="form-grid-compact">
              <div className="form-group">
                <label>Company Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter company name"
                  className={formErrors.name ? 'error' : ''}
                />
                {formErrors.name && <span className="error-text">{formErrors.name}</span>}
              </div>
              <div className="form-group">
                <label>Company Email <span className="required">*</span></label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter company email"
                  className={formErrors.email ? 'error' : ''}
                />
                {formErrors.email && <span className="error-text">{formErrors.email}</span>}
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="form-group">
                <label>PIN</label>
                <input
                  type="text"
                  name="pin"
                  value={formData.pin}
                  onChange={handleInputChange}
                  placeholder="Enter company PIN"
                />
              </div>
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter company address"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter company description"
                />
              </div>
            </div>
          </div>
        );
      
      case 2:
        return (
          <div className="form-step">
            <div className="step-header">
              <h3>⚙️ Project, Plan & Subscription</h3>
              <p className="step-description">Select project, plan and configure subscription</p>
            </div>
            
            <div className="form-grid-two-col">
              <div className="form-group">
                <label>Select Project <span className="required">*</span></label>
                <select
                  name="projectId"
                  value={formData.projectId || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    console.log('📌 Project selected:', value);
                    setFormData(prev => ({
                      ...prev,
                      projectId: value
                    }));
                    if (formErrors.projectId) {
                      setFormErrors(prev => ({ ...prev, projectId: '' }));
                    }
                  }}
                  className={formErrors.projectId ? 'error' : ''}
                >
                  <option value="">Select a Project</option>
                  {projects.map(project => {
                    const projectValue = project.type || project._id;
                    return (
                      <option key={project._id || project.type} value={projectValue}>
                        {project.name} ({project.code})
                      </option>
                    );
                  })}
                </select>
                {formErrors.projectId && <span className="error-text">{formErrors.projectId}</span>}
              </div>
              
              <div className="form-group">
                <label>Select Plan <span className="required">*</span></label>
                <select
                  name="planId"
                  value={formData.planId || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    console.log('📌 Plan selected:', value);
                    setFormData(prev => ({
                      ...prev,
                      planId: value
                    }));
                    if (formErrors.planId) {
                      setFormErrors(prev => ({ ...prev, planId: '' }));
                    }
                  }}
                  className={formErrors.planId ? 'error' : ''}
                >
                  <option value="">Select a Plan</option>
                  {plans.map(plan => (
                    <option key={plan._id} value={plan._id}>
                      {plan.name} - {plan.price} {plan.currency}
                    </option>
                  ))}
                </select>
                {formErrors.planId && <span className="error-text">{formErrors.planId}</span>}
              </div>
            </div>

            <div className="form-grid-four-col">
              <div className="form-group">
                <label>Renewal Type</label>
                <select
                  name="type"
                  value={formData.planRenewal.type}
                  onChange={handlePlanRenewalChange}
                >
                  <option value="manual">Manual</option>
                  <option value="automatic">Automatic</option>
                </select>
              </div>
              <div className="form-group">
                <label>Renewal Date</label>
                <input
                  type="date"
                  name="renewalDate"
                  value={formData.planRenewal.renewalDate}
                  onChange={handlePlanRenewalChange}
                />
              </div>
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.subscription.startDate}
                  onChange={handleSubscriptionChange}
                />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.subscription.endDate}
                  onChange={handleSubscriptionChange}
                />
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="autoRenewEnabled"
                    checked={formData.planRenewal.autoRenewEnabled}
                    onChange={handlePlanRenewalChange}
                  />
                  Auto-Renew
                </label>
              </div>
              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    name="isTrial"
                    checked={formData.subscription.isTrial}
                    onChange={handleSubscriptionChange}
                  />
                  Is Trial
                </label>
              </div>
              <div className="form-group full-width">
                <label>Trial End Date</label>
                <input
                  type="date"
                  name="trialEndDate"
                  value={formData.subscription.trialEndDate}
                  onChange={handleSubscriptionChange}
                />
              </div>
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="form-step">
            <div className="step-header">
              <h3>👤 Admin User <span className="required">*</span></h3>
              <p className="step-description">This user will be the owner/administrator of the company</p>
            </div>
            <div className="form-grid-two-col">
              <div className="form-group">
                <label>Full Name <span className="required">*</span></label>
                <input
                  type="text"
                  name="name"
                  value={formData.adminUser.name}
                  onChange={handleAdminUserChange}
                  placeholder="Enter admin full name"
                  className={formErrors.adminUserName ? 'error' : ''}
                />
                {formErrors.adminUserName && <span className="error-text">{formErrors.adminUserName}</span>}
              </div>
              <div className="form-group">
                <label>Email Address <span className="required">*</span></label>
                <input
                  type="email"
                  name="email"
                  value={formData.adminUser.email}
                  onChange={handleAdminUserChange}
                  placeholder="Enter admin email"
                  className={formErrors.adminUserEmail ? 'error' : ''}
                />
                {formErrors.adminUserEmail && <span className="error-text">{formErrors.adminUserEmail}</span>}
              </div>
              <div className="form-group">
                <label>Password {!isEdit && <span className="required">*</span>}</label>
                <input
                  type="password"
                  name="password"
                  value={formData.adminUser.password}
                  onChange={handleAdminUserChange}
                  placeholder={isEdit ? "Leave blank to keep current" : "Enter password (min 6 chars)"}
                  className={formErrors.adminUserPassword ? 'error' : ''}
                />
                {formErrors.adminUserPassword && <span className="error-text">{formErrors.adminUserPassword}</span>}
              </div>
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.adminUser.phone}
                  onChange={handleAdminUserChange}
                  placeholder="Enter admin phone number"
                />
              </div>
            </div>
          </div>
        );
      
      case 4:
        return (
          <div className="form-step">
            <div className="step-header">
              <h3>📋 Review & Confirm</h3>
              <p className="step-description">Please review all information before submitting</p>
            </div>
            <div className="review-grid-compact">
              <div className="review-section">
                <h5>Company Information</h5>
                <div className="review-item">
                  <span className="review-label">Name:</span>
                  <span className="review-value">{formData.name || 'Not provided'}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Email:</span>
                  <span className="review-value">{formData.email || 'Not provided'}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Phone:</span>
                  <span className="review-value">{formData.phone || 'Not provided'}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">PIN:</span>
                  <span className="review-value">{formData.pin || 'Not provided'}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Address:</span>
                  <span className="review-value">{formData.address || 'Not provided'}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Description:</span>
                  <span className="review-value">{formData.description || 'Not provided'}</span>
                </div>
              </div>

              <div className="review-section">
                <h5>Project & Plan</h5>
                <div className="review-item">
                  <span className="review-label">Project:</span>
                  <span className="review-value">{getProjectName(formData.projectId)}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Plan:</span>
                  <span className="review-value">{getPlanName(formData.planId)}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Renewal:</span>
                  <span className="review-value">{formData.planRenewal.type} {formData.planRenewal.autoRenewEnabled ? '(Auto)' : '(Manual)'}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Renewal Date:</span>
                  <span className="review-value">{formData.planRenewal.renewalDate || 'Not set'}</span>
                </div>
              </div>

              <div className="review-section">
                <h5>Subscription</h5>
                <div className="review-item">
                  <span className="review-label">Start Date:</span>
                  <span className="review-value">{formData.subscription.startDate || 'Not set'}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">End Date:</span>
                  <span className="review-value">{formData.subscription.endDate || 'Not set'}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Trial:</span>
                  <span className="review-value">{formData.subscription.isTrial ? 'Yes' : 'No'}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Trial End:</span>
                  <span className="review-value">{formData.subscription.trialEndDate || 'Not set'}</span>
                </div>
              </div>

              <div className="review-section">
                <h5>Admin User</h5>
                <div className="review-item">
                  <span className="review-label">Name:</span>
                  <span className="review-value">{formData.adminUser.name || 'Not provided'}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Email:</span>
                  <span className="review-value">{formData.adminUser.email || 'Not provided'}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Phone:</span>
                  <span className="review-value">{formData.adminUser.phone || 'Not provided'}</span>
                </div>
                <div className="review-item">
                  <span className="review-label">Password:</span>
                  <span className="review-value">••••••••</span>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <MainLayout title={isEdit ? 'Edit Company' : 'Create Company'} breadcrumbs={breadcrumbs}>
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={isEdit ? 'Edit Company' : 'Create Company'} breadcrumbs={breadcrumbs}>
      <div className="company-form-page">
        <div className="form-header">
          <div className="header-left">
            <button className="btn btn-secondary" onClick={() => navigate('/companies')}>
              ← Back
            </button>
            <h2>{isEdit ? 'Edit Company' : 'Create New Company'}</h2>
          </div>
          <div className="header-right">
            <span className="status-badge">{isEdit ? 'Editing' : 'New'}</span>
          </div>
        </div>

        <div className="form-container">
          {/* Compact Progress Steps */}
          <div className="steps-progress-compact">
            <div className={`step-compact ${currentStep >= 1 ? 'active' : ''}`}>
              <span className="step-number-compact">1</span>
              <span className="step-label-compact">Info</span>
            </div>
            <div className={`step-line-compact ${currentStep >= 2 ? 'active' : ''}`}></div>
            <div className={`step-compact ${currentStep >= 2 ? 'active' : ''}`}>
              <span className="step-number-compact">2</span>
              <span className="step-label-compact">Project</span>
            </div>
            <div className={`step-line-compact ${currentStep >= 3 ? 'active' : ''}`}></div>
            <div className={`step-compact ${currentStep >= 3 ? 'active' : ''}`}>
              <span className="step-number-compact">3</span>
              <span className="step-label-compact">Admin</span>
            </div>
            <div className={`step-line-compact ${currentStep >= 4 ? 'active' : ''}`}></div>
            <div className={`step-compact ${currentStep >= 4 ? 'active' : ''}`}>
              <span className="step-number-compact">4</span>
              <span className="step-label-compact">Review</span>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-content-compact">
              {renderStepContent()}
            </div>

            <div className="form-actions-compact">
              <div className="actions-left">
                <span className="step-indicator">Step {currentStep} of {totalSteps}</span>
              </div>
              <div className="actions-right">
                {currentStep > 1 && (
                  <button type="button" className="btn btn-secondary btn-sm" onClick={prevStep}>
                    ← Previous
                  </button>
                )}
                {currentStep < totalSteps ? (
                  <button type="button" className="btn btn-primary btn-sm" onClick={nextStep}>
                    Next →
                  </button>
                ) : (
                  <button type="submit" className="btn btn-success btn-sm" disabled={submitting}>
                    {submitting ? 'Saving...' : isEdit ? '💾 Update' : '✅ Create'}
                  </button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default CompanyForm;