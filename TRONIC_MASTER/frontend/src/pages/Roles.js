// /home/kk/RS/TRONIC_MASTER/frontend/src/pages/Roles.js

import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../context/AuthContext';
import './Roles.css';

const Roles = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [roleUsers, setRoleUsers] = useState([]);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    companyRole: 'company_staff',
    phone: ''
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
  const STATIC_URL = process.env.REACT_APP_STATIC_URL || 'http://localhost:5002';

  // Company Roles Configuration
  const COMPANY_ROLES = [
    {
      value: 'company_admin',
      label: 'Company Admin',
      icon: '👑',
      color: '#dc3545',
      description: 'Full access to all company features',
      permissions: [
        'Manage users and roles',
        'Manage products and inventory',
        'Manage sales and orders',
        'View reports and analytics',
        'Manage branches',
        'Full system access'
      ]
    },
    {
      value: 'company_manager',
      label: 'Company Manager',
      icon: '👔',
      color: '#0d6efd',
      description: 'Manage products, sales, and staff',
      permissions: [
        'Manage products and inventory',
        'Process sales and orders',
        'View reports',
        'Manage staff (except admins)',
        'Access to sales dashboard'
      ]
    },
    {
      value: 'company_cashier',
      label: 'Company Cashier',
      icon: '💳',
      color: '#198754',
      description: 'Process sales and manage POS',
      permissions: [
        'Process sales transactions',
        'Manage POS operations',
        'View sales history',
        'Handle customer payments',
        'Print receipts'
      ]
    },
    {
      value: 'company_agent',
      label: 'Company Agent',
      icon: '🤝',
      color: '#ffc107',
      description: 'View products and process sales',
      permissions: [
        'View product catalog',
        'Process sales',
        'Create customer orders',
        'View basic sales data',
        'Limited access to reports'
      ]
    },
    {
      value: 'company_staff',
      label: 'Company Staff',
      icon: '👤',
      color: '#6c757d',
      description: 'Basic read-only access',
      permissions: [
        'View products',
        'View sales',
        'View customers',
        'Read-only access',
        'No management permissions'
      ]
    }
  ];

  // Check permissions
  const canManageUsers = user?.companyRole === 'company_admin' || user?.companyRole === 'company_manager';
  const isCompanyAdmin = user?.companyRole === 'company_admin';
  const isCompanyManager = user?.companyRole === 'company_manager';

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUsers(data.data || []);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };


  // Get users count for each role
  const getRoleCount = (roleValue) => {
    return users.filter(u => u.companyRole === roleValue).length;
  };

  // Get users for a specific role
  const getUsersByRole = (roleValue) => {
    return users.filter(u => u.companyRole === roleValue);
  };

  // Handle role click to show users
  const handleRoleClick = (role) => {
    setSelectedRole(role);
    setRoleUsers(getUsersByRole(role.value));
    setShowRoleModal(true);
  };

  // Handle edit user
  const handleEditUser = (userToEdit) => {
    if (isCompanyManager && userToEdit.companyRole === 'company_admin') {
      setMessage({ type: 'error', text: 'Company Manager cannot edit Company Admin users' });
      return;
    }

    setEditingUser(userToEdit);
    setFormData({
      name: userToEdit.name || '',
      email: userToEdit.email || '',
      password: '',
      companyRole: userToEdit.companyRole || 'company_staff',
      phone: userToEdit.phone || ''
    });
    setMessage({ type: '', text: '' });
    setShowAddUserModal(true);
  };

  // Handle delete user
  const handleDeleteUser = async (userToDelete) => {
    if (isCompanyManager && userToDelete.companyRole === 'company_admin') {
      setMessage({ type: 'error', text: 'Company Manager cannot delete Company Admin users' });
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${userToDelete.name}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/${userToDelete._id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: 'User deleted successfully!' });
        fetchUsers();
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        alert(data.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Network error. Please try again.');
    }
  };

  // Handle toggle user status
  const handleToggleStatus = async (userToToggle) => {
    if (isCompanyManager && userToToggle.companyRole === 'company_admin') {
      setMessage({ type: 'error', text: 'Company Manager cannot deactivate Company Admin users' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/${userToToggle._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !userToToggle.isActive })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ 
          type: 'success', 
          text: `User ${!userToToggle.isActive ? 'activated' : 'deactivated'} successfully!` 
        });
        fetchUsers();
        setTimeout(() => {
          setMessage({ type: '', text: '' });
        }, 3000);
      } else {
        alert(data.message || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Network error. Please try again.');
    }
  };

  // Handle form submit (create/update user)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const url = editingUser 
        ? `${API_URL}/users/${editingUser._id}`
        : `${API_URL}/users`;
      
      const method = editingUser ? 'PUT' : 'POST';
      
      const dataToSend = { ...formData };
      if (editingUser && !dataToSend.password) {
        delete dataToSend.password;
      }

      if (isCompanyManager && dataToSend.companyRole === 'company_admin') {
        setMessage({ 
          type: 'error', 
          text: 'Company Manager cannot create or assign Company Admin role' 
        });
        setSubmitting(false);
        return;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(dataToSend)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ 
          type: 'success', 
          text: editingUser ? 'User updated successfully!' : 'User created successfully!' 
        });
        fetchUsers();
        setTimeout(() => {
          setMessage({ type: '', text: '' });
          setShowAddUserModal(false);
          setEditingUser(null);
        }, 1500);
      } else {
        setMessage({ 
          type: 'error', 
          text: data.message || 'Failed to save user' 
        });
      }
    } catch (error) {
      console.error('Error saving user:', error);
      setMessage({ 
        type: 'error', 
        text: 'Network error. Please try again.' 
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getProfilePictureUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return `${STATIC_URL}${path}`;
  };

  const getStatusColor = (isActive) => {
    return isActive ? '#198754' : '#dc3545';
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get allowed roles for user creation/editing
  const getAvailableRoles = () => {
    if (isCompanyAdmin) {
      return COMPANY_ROLES;
    } else if (isCompanyManager) {
      return COMPANY_ROLES.filter(r => r.value !== 'company_admin');
    }
    return [];
  };

  return (
    <MainLayout title="Roles & Permissions" breadcrumbs={['Home', 'Roles']}>
      <div className="roles-page">
        {/* Header */}
        <div className="roles-header">
          <div>
            <h2>Roles & Permissions</h2>
            <p>Manage company roles and view staff assignments</p>
          </div>
          <div className="header-actions">
            <button className="btn-refresh" onClick={fetchUsers}>
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`roles-message ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading roles...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>❌ {error}</p>
            <button onClick={fetchUsers}>Retry</button>
          </div>
        ) : (
          <>
            {/* Table List View */}
            <div className="roles-table-container">
              <table className="roles-table">
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Description</th>
                    <th>Users</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {COMPANY_ROLES.map((role) => {
                    const count = getRoleCount(role.value);
                    const isActive = count > 0;
                    
                    return (
                      <tr key={role.value} className={isActive ? 'active-row' : 'inactive-row'}>
                        <td>
                          <div className="role-cell">
                            <span className="role-icon-small" style={{ background: role.color }}>
                              {role.icon}
                            </span>
                            <div className="role-cell-info">
                              <span className="role-cell-name">{role.label}</span>
                              <span className="role-cell-value">{role.value}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="role-description-text">{role.description}</span>
                        </td>
                        <td>
                          <span className={`user-count ${isActive ? 'active' : 'inactive'}`}>
                            {count}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge-table ${isActive ? 'active-status' : 'inactive-status'}`}>
                            {isActive ? '✅ Active' : '⭕ Empty'}
                          </span>
                        </td>
                        <td>
                          <button 
                            className={`btn-view-users-table ${!isActive ? 'disabled' : ''}`}
                            onClick={() => isActive && handleRoleClick(role)}
                            disabled={!isActive}
                          >
                            {isActive ? `👥 View ${count} Users` : 'No Users'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Summary Stats */}
            <div className="roles-summary">
              <div className="summary-card">
                <span className="summary-icon">👥</span>
                <div className="summary-info">
                  <span className="summary-value">{users.length}</span>
                  <span className="summary-label">Total Staff</span>
                </div>
              </div>
              <div className="summary-card">
                <span className="summary-icon">📋</span>
                <div className="summary-info">
                  <span className="summary-value">{COMPANY_ROLES.length}</span>
                  <span className="summary-label">Total Roles</span>
                </div>
              </div>
              <div className="summary-card">
                <span className="summary-icon">✅</span>
                <div className="summary-info">
                  <span className="summary-value">
                    {COMPANY_ROLES.filter(r => getRoleCount(r.value) > 0).length}
                  </span>
                  <span className="summary-label">Active Roles</span>
                </div>
              </div>
              <div className="summary-card">
                <span className="summary-icon">📊</span>
                <div className="summary-info">
                  <span className="summary-value">
                    {Math.round((COMPANY_ROLES.filter(r => getRoleCount(r.value) > 0).length / COMPANY_ROLES.length) * 100)}%
                  </span>
                  <span className="summary-label">Role Coverage</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Role Users Modal */}
        {showRoleModal && selectedRole && (
          <div className="role-modal-overlay" onClick={() => setShowRoleModal(false)}>
            <div className="role-modal" onClick={(e) => e.stopPropagation()}>
              <div className="role-modal-header">
                <div className="modal-header-content">
                  <span className="modal-role-icon" style={{ background: selectedRole.color }}>
                    {selectedRole.icon}
                  </span>
                  <div>
                    <h2>{selectedRole.label}</h2>
                    <p className="modal-role-value">{selectedRole.value}</p>
                  </div>
                </div>
                <button className="close-btn" onClick={() => setShowRoleModal(false)}>✕</button>
              </div>

              <div className="role-modal-body">
                <div className="role-description-section">
                  <p>{selectedRole.description}</p>
                  <div className="permissions-list">
                    <h4>Permissions:</h4>
                    <ul>
                      {selectedRole.permissions.map((perm, index) => (
                        <li key={index}>
                          <span className="permission-check">✅</span>
                          {perm}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="role-users-section">
                  <h3>
                    Users with this role 
                    <span className="user-count-badge">{roleUsers.length}</span>
                  </h3>
                  
                  {roleUsers.length === 0 ? (
                    <div className="no-users-message">
                      <span>👤</span>
                      <p>No users assigned to this role</p>
                    </div>
                  ) : (
                    <div className="users-list">
                      {roleUsers.map((u) => {
                        const profilePic = getProfilePictureUrl(u.profilePicture);
                        const canEdit = isCompanyAdmin || 
                                      (isCompanyManager && u.companyRole !== 'company_admin');
                        const canDelete = isCompanyAdmin || 
                                        (isCompanyManager && u.companyRole !== 'company_admin');
                        const canToggle = isCompanyAdmin || 
                                        (isCompanyManager && u.companyRole !== 'company_admin');
                        
                        return (
                          <div key={u._id} className="user-item">
                            <div className="user-avatar">
                              {profilePic ? (
                                <img 
                                  src={profilePic} 
                                  alt={u.name} 
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                    const parent = e.target.parentElement;
                                    const initials = parent.querySelector('.avatar-initials');
                                    if (initials) initials.style.display = 'flex';
                                  }}
                                />
                              ) : (
                                <span className="avatar-initials">
                                  {u.name?.charAt(0)?.toUpperCase() || 'U'}
                                </span>
                              )}
                            </div>
                            <div className="user-info">
                              <span className="user-name">{u.name}</span>
                              <span className="user-email">{u.email}</span>
                            </div>
                            <div className="user-status">
                              <span 
                                className={`status-dot ${u.isActive ? 'active' : 'inactive'}`}
                                style={{ background: getStatusColor(u.isActive) }}
                              />
                              <span className="status-text">
                                {u.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                            <div className="user-joined">
                              Joined: {formatDate(u.createdAt)}
                            </div>
                            {canManageUsers && (
                              <div className="user-actions">
                                {canEdit && (
                                  <button 
                                    className="btn-action btn-edit"
                                    onClick={() => {
                                      setShowRoleModal(false);
                                      handleEditUser(u);
                                    }}
                                    title="Edit User"
                                  >
                                    ✏️
                                  </button>
                                )}
                                {canToggle && (
                                  <button 
                                    className={`btn-action ${u.isActive ? 'btn-deactivate' : 'btn-activate'}`}
                                    onClick={() => handleToggleStatus(u)}
                                    title={u.isActive ? 'Deactivate' : 'Activate'}
                                  >
                                    {u.isActive ? '🔒' : '🔓'}
                                  </button>
                                )}
                                {canDelete && (
                                  <button 
                                    className="btn-action btn-delete"
                                    onClick={() => handleDeleteUser(u)}
                                    title="Delete User"
                                  >
                                    🗑️
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="role-modal-footer">
                <button className="btn-close-modal" onClick={() => setShowRoleModal(false)}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit User Modal - Hidden (only accessible via edit buttons) */}
        {showAddUserModal && canManageUsers && (
          <div className="user-modal-overlay" onClick={() => setShowAddUserModal(false)}>
            <div className="user-modal" onClick={(e) => e.stopPropagation()}>
              <div className="user-modal-header">
                <h2>{editingUser ? 'Edit Staff' : 'Add Staff'}</h2>
                <button className="close-btn" onClick={() => setShowAddUserModal(false)}>✕</button>
              </div>
              <form onSubmit={handleSubmit} className="user-modal-body">
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    placeholder="Enter full name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    placeholder="Enter email address"
                    disabled={!!editingUser}
                  />
                  {editingUser && (
                    <span className="field-hint">Email cannot be changed</span>
                  )}
                </div>

                {!editingUser && (
                  <div className="form-group">
                    <label htmlFor="password">Password *</label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required={!editingUser}
                      placeholder="Enter password (min 6 characters)"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="companyRole">Company Role *</label>
                  <select
                    id="companyRole"
                    name="companyRole"
                    value={formData.companyRole}
                    onChange={(e) => setFormData({ ...formData, companyRole: e.target.value })}
                    required
                  >
                    {getAvailableRoles().map(role => (
                      <option key={role.value} value={role.value}>
                        {role.icon} {role.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Enter phone number"
                  />
                </div>

                {message.text && (
                  <div className={`user-message ${message.type}`}>
                    {message.text}
                  </div>
                )}

                <div className="user-modal-footer">
                  <button
                    type="button"
                    className="btn-cancel"
                    onClick={() => setShowAddUserModal(false)}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-save"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <span className="spinner-small"></span>
                    ) : (
                      editingUser ? 'Update Staff' : 'Add Staff'
                    )}
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

export default Roles;