// /home/kk/RS/MAIN HUB/frontend/src/pages/Users.js

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../context/PermissionContext';
import MainLayout from '../components/layout/MainLayout';
import { userService } from '../services/userService';
import './Users.css';

const Users = () => {
  const { user: currentUser } = useAuth();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formSuccess, setFormSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('system');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  
  // ✅ Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);

  const STATIC_URL = process.env.REACT_APP_STATIC_URL || 'http://localhost:5000';
  const TRONIC_API_URL = process.env.REACT_APP_TRONIC_API_URL || 'http://localhost:5002';
  const systemRoles = ['super_admin', 'admin', 'manager', 'staff'];

  // Icons
  const Icons = {
    Users: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    Add: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
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
    Active: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    Inactive: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
      </svg>
    ),
    SystemIcon: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
    ),
    CompanyIcon: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    Empty: () => (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    ChevronLeft: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
    ),
    ChevronRight: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    ),
    ChevronsLeft: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="11 17 6 12 11 7"/>
        <polyline points="18 17 13 12 18 7"/>
      </svg>
    ),
    ChevronsRight: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="13 17 18 12 13 7"/>
        <polyline points="6 17 11 12 6 7"/>
      </svg>
    )
  };

  const getAvatarColor = (name) => {
    if (!name) return '#6c5ce7';
    const colors = ['#6c5ce7', '#00b894', '#0984e3', '#fdcb6e', '#e17055', '#00cec9', '#fd79a8', '#a29bfe', '#55efc4', '#fdcb6e'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const getProfilePictureUrl = (user) => {
    if (!user || !user.profilePicture) return null;
    if (user.profilePicture.startsWith('http://') || user.profilePicture.startsWith('https://')) {
      return user.profilePicture;
    }
    if (user.project === 'TRONIC_MASTER') {
      return `${TRONIC_API_URL}${user.profilePicture}`;
    }
    return `${STATIC_URL}${user.profilePicture}`;
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const usersData = await userService.getUsers();
      setUsers(usersData.data || []);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (permissionsLoading) return;
    const canViewUsers = hasPermission('viewUsers') || currentUser?.role === 'super_admin' || currentUser?.role === 'admin';
    if (!canViewUsers) { navigate('/dashboard'); return; }
    loadData();
  }, [permissionsLoading, hasPermission, currentUser, navigate, loadData]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRole, activeTab]);

  const getSystemUsers = () => users.filter(user => user.role !== 'guest');
  const getCompanyUsers = () => users.filter(user => user.role === 'guest');

  const getFilteredUsers = () => {
    if (activeTab === 'system') return getSystemUsers();
    return getCompanyUsers();
  };

  const canManageUser = (user) => {
    if (currentUser?.role === 'super_admin') return true;
    if (currentUser?.role === 'admin') return user.role !== 'super_admin';
    if (currentUser?.role === 'manager') return user.role === 'staff' || user.role === 'guest';
    return false;
  };

  const canCreateUser = () => currentUser?.role === 'super_admin' || currentUser?.role === 'admin';

  const handleDelete = async (id) => {
    const userToDelete = users.find(u => u._id === id);
    if (!userToDelete || !canManageUser(userToDelete)) return alert('Permission denied');
    if (!window.confirm(`Delete ${userToDelete.name}?`)) return;
    try {
      await userService.deleteUser(id);
      setFormSuccess('✅ User deleted!');
      setTimeout(() => { loadData(); setFormSuccess(''); }, 1500);
    } catch (error) { alert('Failed to delete'); }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const userToUpdate = users.find(u => u._id === id);
    if (!userToUpdate || !canManageUser(userToUpdate)) return alert('Permission denied');
    try {
      await userService.updateStatus(id, !currentStatus);
      setFormSuccess('✅ Status updated!');
      setTimeout(() => { loadData(); setFormSuccess(''); }, 1500);
    } catch (error) { alert('Failed to update'); }
  };

  const getRoleBadge = (role) => {
    const badges = { super_admin: 'badge-super', admin: 'badge-admin', manager: 'badge-manager', staff: 'badge-staff', guest: 'badge-guest' };
    return `role-badge ${badges[role] || 'badge-guest'}`;
  };

  const getCompanyRoleBadge = (user) => {
    const role = user.companyRole || user.projectRole || 'staff';
    const badges = { 
      company_admin: 'badge-company-admin', 
      admin: 'badge-company-admin',
      company_manager: 'badge-company-manager', 
      manager: 'badge-company-manager',
      company_cashier: 'badge-company-cashier', 
      cashier: 'badge-company-cashier',
      company_agent: 'badge-company-agent', 
      agent: 'badge-company-agent',
      company_staff: 'badge-company-staff', 
      staff: 'badge-company-staff' 
    };
    return `company-role-badge ${badges[role] || 'badge-company-staff'}`;
  };

  const getRoleDisplayName = (role) => {
    const names = { super_admin: 'Super Admin', admin: 'Administrator', manager: 'Manager', staff: 'Staff', guest: 'Guest' };
    return names[role] || role || 'Guest';
  };

  const getCompanyRoleDisplayName = (user) => {
    const role = user.companyRole || user.projectRole || 'staff';
    const names = { 
      company_admin: 'Company Admin', 
      admin: 'Company Admin',
      company_manager: 'Company Manager', 
      manager: 'Company Manager',
      company_cashier: 'Company Cashier', 
      cashier: 'Company Cashier',
      company_agent: 'Company Agent', 
      agent: 'Company Agent',
      company_staff: 'Company Staff', 
      staff: 'Company Staff' 
    };
    return names[role] || role || 'Staff';
  };

  // ✅ Get filtered users
  const filteredUsers = getFilteredUsers().filter(user => {
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.company?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || 
                       (activeTab === 'system' && user.role === filterRole) ||
                       (activeTab === 'company' && (user.companyRole === filterRole || user.projectRole === filterRole));
    return matchesSearch && matchesRole;
  });

  // ✅ Pagination calculations
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const endIndex = Math.min(startIndex + entriesPerPage, totalItems);
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // ✅ Pagination handlers
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleEntriesChange = (e) => {
    setEntriesPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  // ✅ Render pagination buttons
  const renderPaginationButtons = () => {
    const buttons = [];
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);

    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          className={`pagination-btn ${i === currentPage ? 'active' : ''}`}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </button>
      );
    }
    return buttons;
  };

  const allSystemUsers = getSystemUsers();
  const allCompanyUsers = getCompanyUsers();
  const allActiveUsers = users.filter(u => u.isActive).length;
  const allInactiveUsers = users.filter(u => !u.isActive).length;

  const systemUsersCount = allSystemUsers.length;
  const companyUsersCount = allCompanyUsers.length;
  const activeUsersCount = allActiveUsers;
  const inactiveUsersCount = allInactiveUsers;

  const getFilterRoles = () => {
    if (activeTab === 'system') return systemRoles;
    return ['company_admin', 'company_manager', 'company_cashier', 'company_agent', 'company_staff'];
  };
  const filterRoles = getFilterRoles();

  const getStatusColor = (isActive) => isActive ? '#00b894' : '#e17055';

  if (loading || permissionsLoading) {
    return (
      <MainLayout title="Users Management" breadcrumbs={['Home', 'Users']}>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading users...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Users Management" breadcrumbs={['Home', 'Users']}>
      <div className="users-page">
        {/* Header */}
        <div className="page-header">
          <div className="header-left">
            <div className="header-icon">
              <Icons.Users />
            </div>
            <div>
              <h2>User Management</h2>
              <p className="page-subtitle">Manage system administrators and company staff</p>
            </div>
          </div>
          <div className="header-actions">
            {canCreateUser() && (
              <button className="btn-primary" onClick={() => navigate('/users/create')}>
                <Icons.Add /> Add New User
              </button>
            )}
          </div>
        </div>

        {/* Success Message */}
        {formSuccess && (
          <div className="form-success">
            <span className="success-icon">✅</span>
            <span>{formSuccess}</span>
          </div>
        )}

        {/* Stats Cards */}
        <div className="users-stats">
          <div className="stat-card stat-system">
            <div className="stat-icon">👑</div>
            <div className="stat-info">
              <span className="stat-number">{systemUsersCount}</span>
              <span className="stat-label">System Users</span>
            </div>
            <div className="stat-trend">System administrators</div>
          </div>
          <div className="stat-card stat-company">
            <div className="stat-icon">🏢</div>
            <div className="stat-info">
              <span className="stat-number">{companyUsersCount}</span>
              <span className="stat-label">Company Users</span>
            </div>
            <div className="stat-trend">Company staff members</div>
          </div>
          <div className="stat-card stat-active">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <span className="stat-number">{activeUsersCount}</span>
              <span className="stat-label">Active</span>
            </div>
            <div className="stat-trend">Currently active</div>
          </div>
          <div className="stat-card stat-inactive">
            <div className="stat-icon">⏸️</div>
            <div className="stat-info">
              <span className="stat-number">{inactiveUsersCount}</span>
              <span className="stat-label">Inactive</span>
            </div>
            <div className="stat-trend">Currently inactive</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="user-tabs">
          <button 
            className={`user-tab ${activeTab === 'system' ? 'active' : ''}`}
            onClick={() => { setActiveTab('system'); setSearchTerm(''); setFilterRole('all'); setCurrentPage(1); }}
          >
            <Icons.SystemIcon />
            <span>System Users</span>
            <span className="tab-badge">{systemUsersCount}</span>
            <span className="tab-hint">Super Admin, Admin, Manager, Staff</span>
          </button>
          <button 
            className={`user-tab ${activeTab === 'company' ? 'active' : ''}`}
            onClick={() => { setActiveTab('company'); setSearchTerm(''); setFilterRole('all'); setCurrentPage(1); }}
          >
            <Icons.CompanyIcon />
            <span>Company Users</span>
            <span className="tab-badge">{companyUsersCount}</span>
            <span className="tab-hint">Guest users with company roles</span>
          </button>
        </div>

        {/* Filters */}
        <div className="users-filters">
          <div className="search-wrapper">
            <Icons.Search />
            <input
              type="text"
              placeholder={activeTab === 'system' ? "Search by name or email..." : "Search by name, email, or company..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button className="search-clear" onClick={() => setSearchTerm('')}>✕</button>
            )}
          </div>
          <div className="filter-wrapper">
            <select 
              value={filterRole} 
              onChange={(e) => setFilterRole(e.target.value)} 
              className="filter-select"
            >
              <option value="all">All Roles</option>
              {filterRoles.map(role => (
                <option key={role} value={role}>
                  {activeTab === 'system' ? getRoleDisplayName(role) : role.replace('_', ' ').toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <button className="btn-refresh" onClick={loadData}>
            <Icons.Refresh /> Refresh
          </button>
        </div>

        {/* Table */}
        <div className="users-table-container">
          {filteredUsers.length === 0 ? (
            <div className="empty-state">
              <Icons.Empty />
              <h3>No users found</h3>
              <p>
                {searchTerm || filterRole !== 'all' 
                  ? 'Try adjusting your search or filters' 
                  : activeTab === 'system' 
                    ? 'System users manage projects and companies. Click "Add New User" to create one.'
                    : 'Company users are created by companies to manage their operations.'}
              </p>
            </div>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Phone</th>
                  {activeTab === 'system' ? (
                    <th>System Role</th>
                  ) : (
                    <>
                      <th>Company Role</th>
                      <th>Company</th>
                    </>
                  )}
                  <th>Status</th>
                  <th>Last Login</th>
                  <th className="actions-header">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => {
                  const profilePic = getProfilePictureUrl(user);
                  const canManage = canManageUser(user);
                  const avatarColor = getAvatarColor(user.name);
                  const statusColor = getStatusColor(user.isActive);
                  
                  return (
                    <tr key={user._id} className="user-row">
                      <td>
                        <div className="user-cell">
                          <div className="user-avatar-wrapper">
                            {profilePic ? (
                              <img 
                                src={profilePic} 
                                alt={user.name} 
                                className="user-avatar-img"
                                loading="lazy"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  const parent = e.target.parentElement;
                                  const avatar = parent.querySelector('.user-avatar-fallback');
                                  if (avatar) avatar.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <span 
                              className="user-avatar-fallback" 
                              style={{ 
                                background: avatarColor,
                                display: profilePic ? 'none' : 'flex'
                              }}
                            >
                              {user.name?.[0]?.toUpperCase() || 'U'}
                            </span>
                          </div>
                          <div className="user-info">
                            <span className="user-name">{user.name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="user-email">{user.email}</td>
                      <td className="user-phone">{user.phone || '—'}</td>
                      {activeTab === 'system' ? (
                        <td>
                          <span className={getRoleBadge(user.role)}>
                            {getRoleDisplayName(user.role)}
                          </span>
                        </td>
                      ) : (
                        <>
                          <td>
                            <span className={getCompanyRoleBadge(user)}>
                              {getCompanyRoleDisplayName(user)}
                            </span>
                          </td>
                          <td>
                            {user.company?.name ? (
                              <span className="company-name">{user.company.name}</span>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                        </>
                      )}
                      <td>
                        <button
                          className={`status-toggle ${user.isActive ? 'active' : 'inactive'}`}
                          onClick={() => handleToggleStatus(user._id, user.isActive)}
                          disabled={!canManage}
                          style={{ 
                            '--status-color': statusColor
                          }}
                        >
                          <span className="status-dot"></span>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="user-last-login">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                      </td>
                      <td>
                        {canManage && (
                          <div className="action-buttons">
                            <button 
                              className="action-btn edit" 
                              onClick={() => navigate(`/users/edit/${user._id}`)} 
                              title="Edit User"
                            >
                              <Icons.Edit />
                            </button>
                            <button 
                              className="action-btn delete" 
                              onClick={() => handleDelete(user._id)} 
                              title="Delete User"
                            >
                              <Icons.Delete />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ✅ Pagination */}
        {filteredUsers.length > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              <span>
                Showing {startIndex + 1} to {endIndex} of {totalItems} entries
              </span>
              <div className="entries-selector">
                <label>Show</label>
                <select value={entriesPerPage} onChange={handleEntriesChange}>
                  {[5, 10, 25, 50, 100].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <label>entries</label>
              </div>
            </div>

            <div className="pagination-controls">
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1 || totalPages === 0}
              >
                <Icons.ChevronsLeft />
              </button>
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1 || totalPages === 0}
              >
                <Icons.ChevronLeft />
              </button>

              {renderPaginationButtons()}

              <button
                className="pagination-btn"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                <Icons.ChevronRight />
              </button>
              <button
                className="pagination-btn"
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                <Icons.ChevronsRight />
              </button>
            </div>
          </div>
        )}

        {/* Footer Stats */}
        <div className="table-footer">
          <span className="footer-info">
            Showing <strong>{filteredUsers.length}</strong> of <strong>{activeTab === 'system' ? systemUsersCount : companyUsersCount}</strong> users
          </span>
          <span className="footer-info">
            Last updated: {new Date().toLocaleString()}
          </span>
        </div>
      </div>
    </MainLayout>
  );
};

export default Users;