import React, { useState, useEffect } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../context/AuthContext';
import './Users.css';

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  // Branches state
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    companyRole: 'company_staff',
    phone: '',
    projectRole: 'staff',
    branch: '',
    assignedBranches: []
  });
  const [message, setMessage] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
  const STATIC_URL = process.env.REACT_APP_STATIC_URL || 'http://localhost:5002';

  // ========== CURRENT USER ROLE ==========
  const currentUserRole = user?.companyRole || 'company_staff';

  // ========== COMPANY ROLES - Filter based on user role ==========
  const allCompanyRoles = [
    { value: 'company_admin', label: 'Company Admin', icon: '👑', description: 'Full company access' },
    { value: 'company_manager', label: 'Company Manager', icon: '👔', description: 'Manage products & sales' },
    { value: 'company_cashier', label: 'Company Cashier', icon: '💳', description: 'Process sales' },
    { value: 'company_agent', label: 'Company Agent', icon: '🤝', description: 'View & sell products' },
    { value: 'company_staff', label: 'Company Staff', icon: '👤', description: 'Basic access' }
  ];

  // ✅ Only show Company Admin in the dropdown if current user is Admin or Super Admin
  const companyRoles = allCompanyRoles.filter(role => {
    // Super Admin and Admin can see all roles including Company Admin
    if (user?.role === 'super_admin' || user?.role === 'admin') {
      return true;
    }
    // Company Admin can see all roles including Company Admin (they are one)
    if (currentUserRole === 'company_admin') {
      return true;
    }
    // Other roles (Manager, Cashier, Agent, Staff) should NOT see Company Admin
    return role.value !== 'company_admin';
  });

  // ✅ Filter options for the filter dropdown - also hide Company Admin for non-admins
  const filterRoles = allCompanyRoles.filter(role => {
    if (user?.role === 'super_admin' || user?.role === 'admin') {
      return true;
    }
    if (currentUserRole === 'company_admin') {
      return true;
    }
    return role.value !== 'company_admin';
  });

  const projectRoles = ['admin', 'manager', 'staff'];

  // ========== FETCH BRANCHES ==========
  const fetchBranches = async () => {
    try {
      setLoadingBranches(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/branches`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setBranches(data.data || []);
        console.log('🏪 Branches loaded:', data.data.length);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    } finally {
      setLoadingBranches(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchBranches();
    console.log('👤 Current user:', user);
    console.log('📋 Company Role:', user?.companyRole);
    console.log('🔑 System Role:', user?.role);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

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
        console.log('👥 Users fetched:', data.data?.length);
        if (data.data && data.data.length > 0) {
          console.log('📋 First user structure:', JSON.stringify(data.data[0], null, 2));
        }
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

  const handleOpenModal = (userToEdit = null) => {
    if (userToEdit) {
      setEditingUser(userToEdit);
      const branchId = userToEdit.branch?._id || userToEdit.branch || '';
      const assignedBranchesIds = userToEdit.assignedBranches?.map(b => b._id || b) || [];
      
      setFormData({
        name: userToEdit.name || '',
        email: userToEdit.email || '',
        password: '',
        companyRole: userToEdit.companyRole || 'company_staff',
        phone: userToEdit.phone || '',
        projectRole: userToEdit.projectRole || 'staff',
        branch: branchId,
        assignedBranches: assignedBranchesIds
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        companyRole: 'company_staff',
        phone: '',
        projectRole: 'staff',
        branch: '',
        assignedBranches: []
      });
    }
    setMessage({ type: '', text: '' });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      companyRole: 'company_staff',
      phone: '',
      projectRole: 'staff',
      branch: '',
      assignedBranches: []
    });
    setMessage({ type: '', text: '' });
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'assignedBranches') {
      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
      setFormData(prev => ({
        ...prev,
        assignedBranches: selectedOptions
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

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

      // ========== CLEAN UP BASED ON ROLE ==========
      if (dataToSend.companyRole === 'company_admin') {
        delete dataToSend.branch;
        delete dataToSend.assignedBranches;
      }
      
      if (dataToSend.companyRole !== 'company_manager') {
        delete dataToSend.assignedBranches;
      }
      
      if (!dataToSend.branch) {
        delete dataToSend.branch;
      }

      console.log('📤 Sending data:', dataToSend);

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
          handleCloseModal();
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

  const handleDeleteUser = async (userId, userName) => {
    if (!window.confirm(`Are you sure you want to delete ${userName}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/${userId}`, {
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

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ 
          type: 'success', 
          text: `User ${!currentStatus ? 'activated' : 'deactivated'} successfully!` 
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

  // ========== HELPER FUNCTIONS ==========
  const getCompanyRoleBadgeClass = (role) => {
    const roleMap = {
      'company_admin': 'badge-company-admin',
      'company_manager': 'badge-company-manager',
      'company_cashier': 'badge-company-cashier',
      'company_agent': 'badge-company-agent',
      'company_staff': 'badge-company-staff'
    };
    return roleMap[role] || 'badge-company-staff';
  };

  const getCompanyRoleDisplay = (role) => {
    const roleMap = {
      'company_admin': 'Admin',
      'company_manager': 'Manager',
      'company_cashier': 'Cashier',
      'company_agent': 'Agent',
      'company_staff': 'Staff'
    };
    return roleMap[role] || role || 'Staff';
  };

  const getCompanyRoleIcon = (role) => {
    const roleMap = {
      'company_admin': '👑',
      'company_manager': '👔',
      'company_cashier': '💳',
      'company_agent': '🤝',
      'company_staff': '👤'
    };
    return roleMap[role] || '👤';
  };

  const getProfilePictureUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return `${STATIC_URL}${path}`;
  };

  // ========== SHOULD SHOW BRANCH FIELDS ==========
  const shouldShowBranchFields = () => {
    const role = formData.companyRole;
    return role !== 'company_admin';
  };

  const shouldShowMultiBranch = () => {
    return formData.companyRole === 'company_manager';
  };

  // ========== FILTER USERS ==========
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || u.companyRole === filterRole;
    return matchesSearch && matchesRole;
  });

  // ========== PERMISSION CHECKS ==========
  const userCompanyRole = user?.companyRole;
  
  const canManageUsers = userCompanyRole === 'company_admin' || 
                         userCompanyRole === 'company_manager' ||
                         user?.role === 'super_admin' ||
                         user?.role === 'admin';

  const canDeleteUsers = user?.role === 'super_admin' || 
                         userCompanyRole === 'company_admin';

  const canManageSpecificUser = (targetUser) => {
    if (user?.role === 'super_admin') return true;
    if (userCompanyRole === 'company_admin') return true;
    if (userCompanyRole === 'company_manager') {
      return targetUser.companyRole !== 'company_admin';
    }
    return false;
  };

  // ========== GET BRANCH NAME ==========
  const getBranchName = (branchData) => {
    if (branchData && typeof branchData === 'object' && branchData.name) {
      return branchData.name;
    }
    if (typeof branchData === 'string' && branchData) {
      const branch = branches.find(b => b._id === branchData);
      return branch ? branch.name : 'Not Assigned';
    }
    return 'Not Assigned';
  };

  const getAssignedBranchesNames = (assignedBranchesData) => {
    if (!assignedBranchesData || assignedBranchesData.length === 0) {
      return 'None';
    }
    
    const names = assignedBranchesData.map(item => {
      if (item && typeof item === 'object' && item.name) {
        return item.name;
      }
      if (typeof item === 'string') {
        const branch = branches.find(b => b._id === item);
        return branch ? branch.name : 'Unknown';
      }
      return 'Unknown';
    });
    
    return names.join(', ');
  };

  const getBranchDisplay = (user) => {
    if (user.companyRole === 'company_admin') {
      return '🏢 Full Access';
    }
    
    if (user.companyRole === 'company_manager') {
      if (user.assignedBranches && user.assignedBranches.length > 0) {
        return getAssignedBranchesNames(user.assignedBranches);
      }
      return '⚠️ No branches assigned';
    }
    
    if (user.branch) {
      return getBranchName(user.branch);
    }
    
    return '❌ Not Assigned';
  };

  return (
    <MainLayout title="Users" breadcrumbs={['Home', 'Users']}>
      <div className="users-page">
        {/* Header */}
        <div className="users-header">
          <div>
            <h2>User Management</h2>
            <p>Manage company staff and their permissions</p>
          </div>
          <div className="header-actions">
            {canManageUsers && (
              <button className="btn-primary" onClick={() => handleOpenModal()}>
                <span>➕</span> Add Staff
              </button>
            )}
            <button className="btn-refresh" onClick={fetchUsers}>
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Message */}
        {message.text && (
          <div className={`users-message ${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Filters */}
        <div className="users-filters">
          <div className="filter-group">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="filter-group">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Roles</option>
              {filterRoles.map(role => (
                <option key={role.value} value={role.value}>
                  {role.icon} {role.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading users...</p>
          </div>
        ) : error ? (
          <div className="error-state">
            <p>❌ {error}</p>
            <button onClick={fetchUsers}>Retry</button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">👥</span>
            <h3>No Staff Found</h3>
            <p>Start by adding your first staff member</p>
            {canManageUsers && (
              <button className="btn-primary" onClick={() => handleOpenModal()}>
                <span>➕</span> Add Staff
              </button>
            )}
          </div>
        ) : (
          <div className="table-container">
            <table className="users-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Staff</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Branch</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, index) => {
                  const profilePic = getProfilePictureUrl(u.profilePicture);
                  const roleIcon = getCompanyRoleIcon(u.companyRole);
                  const canManage = canManageSpecificUser(u);
                  const branchDisplay = getBranchDisplay(u);
                  
                  return (
                    <tr key={u._id}>
                      <td>{index + 1}</td>
                      <td>
                        <div className="user-cell">
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
                          <span className="user-name">{u.name}</span>
                        </div>
                      </td>
                      <td>{u.email}</td>
                      <td>
                        <span className={`role-badge ${getCompanyRoleBadgeClass(u.companyRole)}`}>
                          {roleIcon} {getCompanyRoleDisplay(u.companyRole)}
                        </span>
                      </td>
                      <td>
                        <span className="branch-badge" title={branchDisplay}>
                          {branchDisplay.length > 25 ? branchDisplay.substring(0, 25) + '...' : branchDisplay}
                        </span>
                      </td>
                      <td>{u.phone || 'N/A'}</td>
                      <td>
                        <span className={`status-badge ${u.isActive ? 'status-active' : 'status-inactive'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          {canManage ? (
                            <>
                              <button 
                                className="btn-action btn-edit"
                                onClick={() => handleOpenModal(u)}
                                title="Edit Staff"
                              >
                                ✏️
                              </button>
                              <button 
                                className="btn-action btn-status"
                                onClick={() => handleToggleStatus(u._id, u.isActive)}
                                title={u.isActive ? 'Deactivate' : 'Activate'}
                              >
                                {u.isActive ? '🔒' : '🔓'}
                              </button>
                              {canDeleteUsers && (
                                <button 
                                  className="btn-action btn-delete"
                                  onClick={() => handleDeleteUser(u._id, u.name)}
                                  title="Delete Staff"
                                >
                                  🗑️
                                </button>
                              )}
                            </>
                          ) : (
                            <span className="no-actions">View only</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* User Modal */}
        {showModal && canManageUsers && (
          <div className="user-modal-overlay" onClick={handleCloseModal}>
            <div className="user-modal" onClick={(e) => e.stopPropagation()}>
              <div className="user-modal-header">
                <h2>{editingUser ? 'Edit Staff' : 'Add Staff'}</h2>
                <button className="close-btn" onClick={handleCloseModal}>✕</button>
              </div>
              <form onSubmit={handleSubmit} className="user-modal-body">
                {/* Basic Info */}
                <div className="form-group">
                  <label htmlFor="name">Full Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
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
                    onChange={handleInputChange}
                    required
                    placeholder="Enter email address"
                    disabled={editingUser}
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
                      onChange={handleInputChange}
                      required={!editingUser}
                      placeholder="Enter password (min 6 characters)"
                    />
                  </div>
                )}

                {/* Role Selection */}
                <div className="form-group">
                  <label htmlFor="companyRole">Company Role *</label>
                  <select
                    id="companyRole"
                    name="companyRole"
                    value={formData.companyRole}
                    onChange={handleInputChange}
                    required
                  >
                    {companyRoles.map(role => (
                      <option key={role.value} value={role.value}>
                        {role.icon} {role.label} - {role.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ========== BRANCH FIELDS (Hidden for Admin) ========== */}
                {shouldShowBranchFields() && (
                  <>
                    <div className="form-group">
                      <label htmlFor="branch">Branch Assignment</label>
                      <select
                        id="branch"
                        name="branch"
                        value={formData.branch}
                        onChange={handleInputChange}
                        className="form-select"
                      >
                        <option value="">No Branch Assigned</option>
                        {branches.map(branch => (
                          <option key={branch._id} value={branch._id}>
                            {branch.name} {branch.city ? `(${branch.city})` : ''}
                          </option>
                        ))}
                      </select>
                      <span className="field-hint">
                        Assign user to a specific branch
                      </span>
                    </div>

                    {/* Multiple Branches - Managers Only */}
                    {shouldShowMultiBranch() && (
                      <div className="form-group">
                        <label htmlFor="assignedBranches">Assigned Branches (Managers Only)</label>
                        <select
                          id="assignedBranches"
                          name="assignedBranches"
                          multiple
                          value={formData.assignedBranches}
                          onChange={handleInputChange}
                          className="form-select-multiple"
                          size={4}
                        >
                          {branches.map(branch => (
                            <option key={branch._id} value={branch._id}>
                              {branch.name} {branch.city ? `(${branch.city})` : ''}
                            </option>
                          ))}
                        </select>
                        <span className="field-hint">
                          Hold Ctrl/Cmd to select multiple branches for this manager
                        </span>
                        {formData.assignedBranches.length > 0 && (
                          <div className="selected-branches">
                            <strong>Selected: </strong>
                            {formData.assignedBranches.map(id => {
                              const branch = branches.find(b => b._id === id);
                              return branch ? (
                                <span key={id} className="selected-branch-tag">
                                  {branch.name}
                                </span>
                              ) : null;
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* ========== ADMIN HINT ========== */}
                {formData.companyRole === 'company_admin' && (
                  <div className="form-group admin-hint">
                    <div className="admin-hint-box">
                      <span className="admin-hint-icon">👑</span>
                      <div>
                        <strong>Full Company Access</strong>
                        <p>Admins have full access to all branches and do not need branch assignments.</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="phone">Phone Number</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="projectRole">Project Role</label>
                  <select
                    id="projectRole"
                    name="projectRole"
                    value={formData.projectRole}
                    onChange={handleInputChange}
                  >
                    {projectRoles.map(role => (
                      <option key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </option>
                    ))}
                  </select>
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
                    onClick={handleCloseModal}
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

export default Users;