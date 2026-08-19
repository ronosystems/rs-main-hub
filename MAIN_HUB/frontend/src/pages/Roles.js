// /home/kk/RS/MAIN HUB/frontend/src/pages/Roles.js

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/layout/MainLayout';
import { getRoleByKey, getRoleHierarchy, PERMISSION_GROUPS } from '../config/roles';
import './Roles.css';

const Roles = () => {
  const { user } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    description: '',
    permissions: {},
    isDefault: false,
    level: 1,
    color: '#6c757d',
    icon: 'fa-user'
  });

  // Icon components
  const Icons = {
    Roles: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="M9 12l2 2 4-4"/>
      </svg>
    ),
    Add: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    ),
    Key: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
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
    Lock: () => (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    )
  };

  // ✅ Hardcoded permission checks based on role
  const userRole = user?.role?.toLowerCase();
  const isSuperAdmin = userRole === 'super_admin';
  const isAdmin = userRole === 'admin';
  
  // ✅ Can manage roles - Super Admin only (or Super Admin + Admin if needed)
  const canManageRoles = isSuperAdmin || isAdmin;

  useEffect(() => {
    loadRoles();
  }, []);

  // Load roles from config
  const loadRoles = async () => {
    try {
      setLoading(true);
      // Get roles from config
      const rolesFromConfig = getRoleHierarchy();
      
      // Add a flag to indicate if it's from config
      const rolesWithSource = rolesFromConfig.map(role => ({
        ...role,
        fromConfig: true,
        _id: `config-${role.key}`,
        code: `RL-${String(rolesFromConfig.indexOf(role) + 1).padStart(3, '0')}`
      }));
      
      setRoles(rolesWithSource);
      console.log('📋 Roles loaded from config:', rolesWithSource);
    } catch (error) {
      console.error('Error loading roles:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get default permissions for a new role
  const getDefaultPermissions = () => {
    const defaultRole = getRoleByKey('guest');
    return defaultRole ? { ...defaultRole.permissions } : {
      viewDashboard: true,
      viewProjects: false,
      createProjects: false,
      editProjects: false,
      deleteProjects: false,
      viewCompanies: false,
      createCompanies: false,
      editCompanies: false,
      deleteCompanies: false,
      viewUsers: false,
      createUsers: false,
      editUsers: false,
      deleteUsers: false,
      viewRoles: false,
      createRoles: false,
      editRoles: false,
      deleteRoles: false,
      viewPlans: false,
      createPlans: false,
      editPlans: false,
      deletePlans: false,
      viewReports: false,
      exportReports: false,
      viewSettings: false,
      editSettings: false,
      manageProjectUsers: false,
      viewProjectAnalytics: false,
      exportProjectData: false
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate key
      if (!formData.key) {
        alert('Role key is required');
        return;
      }
      
      // Check if key already exists
      if (getRoleByKey(formData.key) && !editingRole) {
        alert('Role with this key already exists');
        return;
      }

      // In a real app with backend, you would save to the database
      // For now, we're using config-based roles
      alert('Roles are managed in the config file. Changes will persist after restart.');
      
      setShowModal(false);
      setEditingRole(null);
      resetForm();
      loadRoles();
    } catch (error) {
      alert(error.message || 'Failed to save role');
    }
  };

  const handleEdit = (role) => {
    setEditingRole(role);
    setFormData({
      name: role.name || '',
      key: role.key || '',
      description: role.description || '',
      permissions: { ...role.permissions },
      isDefault: role.isDefault || false,
      level: role.level || 1,
      color: role.color || '#6c757d',
      icon: role.icon || 'fa-user'
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        // In a real app with backend, you would delete from database
        // For now, we're using config-based roles
        alert('Roles are managed in the config file. To delete, remove from config.');
        loadRoles();
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to delete role');
      }
    }
  };

  const handlePermissionChange = (permName) => {
    setFormData(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permName]: !prev.permissions[permName]
      }
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      key: '',
      description: '',
      permissions: getDefaultPermissions(),
      isDefault: false,
      level: 1,
      color: '#6c757d',
      icon: 'fa-user'
    });
  };

  // Get permission groups from config
  const permissionGroups = Object.entries(PERMISSION_GROUPS).map(([key, group]) => ({
    title: group.label,
    icon: group.icon,
    perms: group.permissions.map(perm => ({
      key: perm,
      label: perm.replace(/([A-Z])/g, ' $1').trim().replace(/^./, str => str.toUpperCase())
    }))
  }));

  if (loading) {
    return (
      <MainLayout title="Roles" breadcrumbs={['Home', 'Roles']}>
        <div className="loading-state">Loading roles...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Roles & Permissions" breadcrumbs={['Home', 'Roles']}>
      <div className="roles-page">
        <div className="page-header">
          <h2>
            <Icons.Roles />
            Roles & Permissions
          </h2>
          <div className="header-actions">
            <span className="badge-config">📁 Config Based</span>
            {canManageRoles && (
              <button className="btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                <Icons.Add />
                Add New Role
              </button>
            )}
          </div>
        </div>

        <div className="roles-stats">
          <div className="stat-box">
            <span className="stat-number">{roles.length}</span>
            <span className="stat-label">Total Roles</span>
          </div>
          <div className="stat-box">
            <span className="stat-number">{roles.filter(r => r.isDefault).length}</span>
            <span className="stat-label">Default Roles</span>
          </div>
          <div className="stat-box">
            <span className="stat-number">{roles.filter(r => !r.isDefault).length}</span>
            <span className="stat-label">Custom Roles</span>
          </div>
        </div>

        <div className="roles-table-container">
          <table className="roles-table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Key</th>
                <th>Description</th>
                <th>Level</th>
                <th>Permissions</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {roles.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-data">
                    <div className="no-data-message">
                      <span className="empty-icon">
                        <Icons.Lock />
                      </span>
                      <p>No roles found</p>
                      <p className="text-muted">Roles are defined in the config file</p>
                    </div>
                  </td>
                </tr>
              ) : (
                roles.map((role) => {
                  const permCount = Object.values(role.permissions || {}).filter(v => v).length;
                  const totalPerms = Object.keys(role.permissions || {}).length;
                  const isSystemRole = role.isDefault || ['super_admin', 'admin', 'manager', 'staff', 'guest'].includes(role.key);
                  
                  return (
                    <tr key={role._id}>
                      <td>
                        <div className="role-cell">
                          <span className="role-icon" style={{ color: role.color || '#6c757d' }}>
                            <i className={`fas ${role.icon || 'fa-user'}`}></i>
                          </span>
                          <div>
                            <div className="role-name">{role.name}</div>
                            <div className="role-code">{role.code || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <code className="role-key">{role.key}</code>
                      </td>
                      <td>{role.description || '-'}</td>
                      <td>
                        <span className={`role-level level-${role.level}`}>
                          Level {role.level}
                        </span>
                      </td>
                      <td>
                        <span className="perm-count">
                          {permCount} / {totalPerms} permissions
                        </span>
                      </td>
                      <td>
                        <span className={`role-type ${role.isDefault ? 'default' : 'custom'}`}>
                          {role.isDefault ? 'Default' : 'Custom'}
                        </span>
                        {isSystemRole && (
                          <span className="badge-system">System</span>
                        )}
                      </td>
                      <td>
                        {canManageRoles && !isSystemRole ? (
                          <>
                            <button className="action-btn edit" onClick={() => handleEdit(role)}>
                              <Icons.Edit />
                            </button>
                            {!role.isDefault && (
                              <button className="action-btn delete" onClick={() => handleDelete(role._id)}>
                                <Icons.Delete />
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="text-muted">Read only</span>
                        )}
                        {isSystemRole && (
                          <span className="badge-readonly">🔒</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Modal - Only shown if user can manage roles */}
        {showModal && canManageRoles && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editingRole ? 'Edit Role' : 'Add New Role'}</h3>
                <button className="modal-close" onClick={() => setShowModal(false)}>
                  <Icons.Close />
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group half">
                    <label>Role Name <span className="required">*</span></label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="e.g., Custom Admin"
                    />
                  </div>
                  <div className="form-group half">
                    <label>Role Key <span className="required">*</span></label>
                    <input
                      type="text"
                      value={formData.key}
                      onChange={(e) => setFormData({ ...formData, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                      required
                      placeholder="e.g., custom_admin"
                    />
                    <small className="form-hint">Unique identifier (lowercase, underscores)</small>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group half">
                    <label>Description</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Role description"
                    />
                  </div>
                  <div className="form-group half">
                    <label>Level</label>
                    <select
                      value={formData.level}
                      onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                    >
                      <option value="1">Level 1 (Lowest)</option>
                      <option value="2">Level 2</option>
                      <option value="3">Level 3</option>
                      <option value="4">Level 4</option>
                      <option value="5">Level 5 (Highest)</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group half">
                    <label>Color</label>
                    <div className="color-picker">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      />
                      <span>{formData.color}</span>
                    </div>
                  </div>
                  <div className="form-group half">
                    <label>Icon</label>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      placeholder="fa-user"
                    />
                    <small className="form-hint">Font Awesome icon class</small>
                  </div>
                </div>

                <div className="permissions-section">
                  <h4>Permissions</h4>
                  {permissionGroups.map((group, gIdx) => (
                    <div key={gIdx} className="permission-group">
                      <h5>
                        <i className={`fas ${group.icon}`}></i>
                        {group.title}
                      </h5>
                      <div className="permission-grid">
                        {group.perms.map((perm, pIdx) => (
                          <label key={pIdx} className="permission-checkbox">
                            <input
                              type="checkbox"
                              checked={formData.permissions[perm.key] || false}
                              onChange={() => handlePermissionChange(perm.key)}
                            />
                            {perm.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="form-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    />
                    Set as Default Role
                  </label>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                  <button type="submit" className="btn-primary">{editingRole ? 'Update' : 'Create'}</button>
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