// /home/kk/RS/MAIN HUB/frontend/src/pages/Plans.js

import React, { useState, useEffect, useCallback } from 'react';
// ✅ Removed unused useAuth import
import MainLayout from '../components/layout/MainLayout';
import { planService } from '../services/planService';
import './Plans.css';

const Plans = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    currency: 'KES',
    billingCycle: 'monthly',
    features: {
      maxUsers: 1,
      maxProjects: 1,
      maxCompanies: 1,
      maxStorage: '1GB',
      customDomain: false,
      apiAccess: false,
      prioritySupport: false,
      advancedReports: false
    },
    status: 'active'
  });

  // ✅ Helper function to safely get features with defaults - wrapped in useCallback
  const getSafeFeatures = useCallback((features) => {
    const defaultFeatures = {
      maxUsers: 1,
      maxProjects: 1,
      maxCompanies: 1,
      maxStorage: '1GB',
      customDomain: false,
      apiAccess: false,
      prioritySupport: false,
      advancedReports: false
    };
    
    if (!features || typeof features !== 'object') {
      return { ...defaultFeatures };
    }
    return {
      maxUsers: features.maxUsers ?? defaultFeatures.maxUsers,
      maxProjects: features.maxProjects ?? defaultFeatures.maxProjects,
      maxCompanies: features.maxCompanies ?? defaultFeatures.maxCompanies,
      maxStorage: features.maxStorage ?? defaultFeatures.maxStorage,
      customDomain: features.customDomain ?? defaultFeatures.customDomain,
      apiAccess: features.apiAccess ?? defaultFeatures.apiAccess,
      prioritySupport: features.prioritySupport ?? defaultFeatures.prioritySupport,
      advancedReports: features.advancedReports ?? defaultFeatures.advancedReports
    };
  }, []); // Empty dependency array since defaultFeatures is defined inside

  // Icon components
  const Icons = {
    Plans: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2"/>
        <path d="M8 12h8"/>
        <path d="M8 8h8"/>
        <path d="M8 16h4"/>
      </svg>
    ),
    Add: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    ),
    Users: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    Projects: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    ),
    Companies: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    Storage: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
    Domain: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="2" y1="12" x2="22" y2="12"/>
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
      </svg>
    ),
    API: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 7h16"/>
        <path d="M4 12h16"/>
        <path d="M4 17h10"/>
        <path d="M18 17l4-4-4-4"/>
      </svg>
    ),
    Support: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    Reports: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
        <rect x="2" y="2" width="20" height="20" rx="2"/>
      </svg>
    ),
    Edit: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
      </svg>
    ),
    Delete: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
    Empty: () => (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2"/>
        <path d="M8 12h8"/>
        <path d="M8 8h8"/>
        <path d="M8 16h4"/>
      </svg>
    ),
    Highlight: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    )
  };

  // ✅ Wrapped loadPlans in useCallback with getSafeFeatures as dependency
  const loadPlans = useCallback(async () => {
    try {
      setLoading(true);
      const data = await planService.getPlans();
      // Ensure each plan has features with defaults
      const plansWithDefaults = (data.data || []).map(plan => ({
        ...plan,
        features: getSafeFeatures(plan.features)
      }));
      setPlans(plansWithDefaults);
    } catch (error) {
      console.error('Error loading plans:', error);
    } finally {
      setLoading(false);
    }
  }, [getSafeFeatures]); // ✅ Added getSafeFeatures as dependency

  // ✅ Added loadPlans to dependency array
  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        features: {
          maxUsers: parseInt(formData.features.maxUsers) || 1,
          maxProjects: parseInt(formData.features.maxProjects) || 1,
          maxCompanies: parseInt(formData.features.maxCompanies) || 1,
          maxStorage: formData.features.maxStorage || '1GB',
          customDomain: formData.features.customDomain || false,
          apiAccess: formData.features.apiAccess || false,
          prioritySupport: formData.features.prioritySupport || false,
          advancedReports: formData.features.advancedReports || false
        }
      };

      if (editingPlan) {
        await planService.updatePlan(editingPlan._id, submitData);
      } else {
        await planService.createPlan(submitData);
      }
      setShowModal(false);
      setEditingPlan(null);
      resetForm();
      loadPlans();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to save plan');
    }
  };

  const resetForm = () => {
    // ✅ defaultFeatures defined inside the function
    const defaultFeatures = {
      maxUsers: 1,
      maxProjects: 1,
      maxCompanies: 1,
      maxStorage: '1GB',
      customDomain: false,
      apiAccess: false,
      prioritySupport: false,
      advancedReports: false
    };
    setFormData({
      name: '',
      description: '',
      price: '',
      currency: 'KES',
      billingCycle: 'monthly',
      features: { ...defaultFeatures },
      status: 'active'
    });
  };

  const handleEdit = (plan) => {
    setEditingPlan(plan);
    const safeFeatures = getSafeFeatures(plan.features);
    setFormData({
      name: plan.name || '',
      description: plan.description || '',
      price: plan.price || '',
      currency: plan.currency || 'KES',
      billingCycle: plan.billingCycle || 'monthly',
      features: safeFeatures,
      status: plan.status || 'active'
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this plan?')) {
      try {
        await planService.deletePlan(id);
        loadPlans();
      } catch (error) {
        alert('Failed to delete plan');
      }
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      active: 'badge-active',
      inactive: 'badge-inactive',
      archived: 'badge-archived'
    };
    return <span className={`plan-status ${badges[status] || 'badge-active'}`}>{status || 'active'}</span>;
  };

  const getBillingLabel = (cycle) => {
    const labels = {
      monthly: 'Per Month',
      yearly: 'Per Year',
      'one-time': 'One Time'
    };
    return labels[cycle] || cycle || 'monthly';
  };

  const formatPrice = (price, currency) => {
    const safePrice = parseFloat(price) || 0;
    return `${currency || 'KES'} ${safePrice.toLocaleString()}`;
  };

  if (loading) {
    return (
      <MainLayout title="Plans" breadcrumbs={['Home', 'Plans']}>
        <div className="loading-state">Loading plans...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Subscription Plans" breadcrumbs={['Home', 'Plans']}>
      <div className="plans-page">
        <div className="page-header">
          <h2>
            <Icons.Plans />
            Subscription Plans
          </h2>
          <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
            <Icons.Add />
            Add New Plan
          </button>
        </div>

        <div className="plans-stats">
          <div className="stat-box">
            <span className="stat-number">{plans.length}</span>
            <span className="stat-label">Total Plans</span>
          </div>
          <div className="stat-box">
            <span className="stat-number">{plans.filter(p => p.status === 'active').length}</span>
            <span className="stat-label">Active</span>
          </div>
          <div className="stat-box">
            <span className="stat-number">{plans.filter(p => p.status === 'inactive').length}</span>
            <span className="stat-label">Inactive</span>
          </div>
        </div>

        <div className="plans-grid">
          {plans.length === 0 ? (
            <div className="no-data-message">
              <span className="empty-icon">
                <Icons.Empty />
              </span>
              <p>No subscription plans found</p>
              <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                <Icons.Add />
                Add Your First Plan
              </button>
            </div>
          ) : (
            plans.map((plan) => {
              const features = getSafeFeatures(plan.features);
              return (
                <div key={plan._id} className="plan-card">
                  <div className="plan-header">
                    <div className="plan-name">{plan.name || 'Unnamed Plan'}</div>
                    <div className="plan-code">{plan.code || 'N/A'}</div>
                  </div>
                  <div className="plan-price">
                    <span className="price-amount">{formatPrice(plan.price, plan.currency)}</span>
                    <span className="price-cycle">/{getBillingLabel(plan.billingCycle)}</span>
                  </div>
                  <div className="plan-description">{plan.description || 'No description'}</div>
                  <div className="plan-features">
                    <div className="feature-item">
                      <span className="feature-icon">
                        <Icons.Users />
                      </span>
                      <span>{features.maxUsers || 1} Users</span>
                    </div>
                    <div className="feature-item">
                      <span className="feature-icon">
                        <Icons.Projects />
                      </span>
                      <span>{features.maxProjects || 1} Projects</span>
                    </div>
                    <div className="feature-item">
                      <span className="feature-icon">
                        <Icons.Companies />
                      </span>
                      <span>{features.maxCompanies || 1} Companies</span>
                    </div>
                    <div className="feature-item">
                      <span className="feature-icon">
                        <Icons.Storage />
                      </span>
                      <span>{features.maxStorage || '1GB'} Storage</span>
                    </div>
                    {features.customDomain && (
                      <div className="feature-item highlight">
                        <span className="feature-icon">
                          <Icons.Domain />
                        </span>
                        <span>Custom Domain</span>
                      </div>
                    )}
                    {features.apiAccess && (
                      <div className="feature-item highlight">
                        <span className="feature-icon">
                          <Icons.API />
                        </span>
                        <span>API Access</span>
                      </div>
                    )}
                    {features.prioritySupport && (
                      <div className="feature-item highlight">
                        <span className="feature-icon">
                          <Icons.Support />
                        </span>
                        <span>Priority Support</span>
                      </div>
                    )}
                    {features.advancedReports && (
                      <div className="feature-item highlight">
                        <span className="feature-icon">
                          <Icons.Reports />
                        </span>
                        <span>Advanced Reports</span>
                      </div>
                    )}
                  </div>
                  <div className="plan-footer">
                    {getStatusBadge(plan.status)}
                    <div className="plan-actions">
                      <button className="action-btn edit" onClick={() => handleEdit(plan)}>
                        <Icons.Edit />
                      </button>
                      <button className="action-btn delete" onClick={() => handleDelete(plan._id)}>
                        <Icons.Delete />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingPlan ? 'Edit Plan' : 'Add New Plan'}</h3>
                <button className="modal-close" onClick={() => setShowModal(false)}>
                  <Icons.Close />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group half">
                    <label>Plan Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group half">
                    <label>Description</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group half">
                    <label>Price</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      placeholder="0"
                      required
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="form-group half">
                    <label>Currency</label>
                    <select
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    >
                      <option value="KES">KES</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Billing Cycle</label>
                  <select
                    value={formData.billingCycle}
                    onChange={(e) => setFormData({ ...formData, billingCycle: e.target.value })}
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                    <option value="one-time">One Time</option>
                  </select>
                </div>

                <div className="features-section">
                  <h4>Features</h4>
                  <div className="form-row">
                    <div className="form-group half">
                      <label>Max Users</label>
                      <input
                        type="number"
                        value={formData.features.maxUsers}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          features: { ...formData.features, maxUsers: parseInt(e.target.value) || 1 } 
                        })}
                        min="1"
                      />
                    </div>
                    <div className="form-group half">
                      <label>Max Projects</label>
                      <input
                        type="number"
                        value={formData.features.maxProjects}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          features: { ...formData.features, maxProjects: parseInt(e.target.value) || 1 } 
                        })}
                        min="1"
                      />
                    </div>
                  </div>
                  <div className="form-row">
                    <div className="form-group half">
                      <label>Max Companies</label>
                      <input
                        type="number"
                        value={formData.features.maxCompanies}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          features: { ...formData.features, maxCompanies: parseInt(e.target.value) || 1 } 
                        })}
                        min="1"
                      />
                    </div>
                    <div className="form-group half">
                      <label>Max Storage</label>
                      <select
                        value={formData.features.maxStorage}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          features: { ...formData.features, maxStorage: e.target.value } 
                        })}
                      >
                        <option value="1GB">1 GB</option>
                        <option value="5GB">5 GB</option>
                        <option value="10GB">10 GB</option>
                        <option value="25GB">25 GB</option>
                        <option value="50GB">50 GB</option>
                        <option value="100GB">100 GB</option>
                        <option value="500GB">500 GB</option>
                        <option value="1TB">1 TB</option>
                        <option value="Unlimited">Unlimited</option>
                      </select>
                    </div>
                  </div>
                  <div className="checkbox-grid">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.features.customDomain}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          features: { ...formData.features, customDomain: e.target.checked } 
                        })}
                      />
                      Custom Domain
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.features.apiAccess}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          features: { ...formData.features, apiAccess: e.target.checked } 
                        })}
                      />
                      API Access
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.features.prioritySupport}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          features: { ...formData.features, prioritySupport: e.target.checked } 
                        })}
                      />
                      Priority Support
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={formData.features.advancedReports}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          features: { ...formData.features, advancedReports: e.target.checked } 
                        })}
                      />
                      Advanced Reports
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">{editingPlan ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Plans;