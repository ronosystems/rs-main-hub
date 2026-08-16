// /home/kk/RS/MAIN HUB/frontend/src/pages/ManagerDashboard.js

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../context/PermissionContext';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { userService } from '../services/userService';
import { companyService } from '../services/companyService';
import { projectService } from '../services/projectService';
import './Dashboard.css';

// Import professional icons - removed unused ones
import { 
  FaUsers, 
  FaBuilding, 
  FaSignOutAlt,
  FaUserCircle,
  FaCheckCircle,
  FaTimesCircle,
  FaPhone,
  FaEnvelope,
  FaDatabase
} from 'react-icons/fa';

const ManagerDashboard = () => {
  const { user, logout } = useAuth();
  const { hasPermission, permissions } = usePermissions();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [stats, setStats] = useState({
    totalStaff: 0,
    totalManagers: 0,
    totalGuests: 0,
    totalCompanies: 0,
    totalAdmins: 0,
    totalCompanyManagers: 0,
    totalCompanyStaff: 0
  });

  const STATIC_URL = process.env.REACT_APP_STATIC_URL || 'http://localhost:5000';

  // ✅ Get full profile picture URL from server
  const getProfilePictureUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return `${STATIC_URL}${path}`;
  };

  // ✅ Define calculateStats
  const calculateStats = useCallback((usersList, companiesList) => {
    const companyUsers = usersList.filter(u => {
      const isNotSuperAdmin = u.role !== 'super_admin';
      const isNotSelf = u._id !== user?._id;
      return isNotSuperAdmin && isNotSelf;
    });
    
    console.log('👥 Company users count:', companyUsers.length);
    
    const admins = companyUsers.filter(u => u.projectRole === 'admin' || u.role === 'admin').length;
    const managers = companyUsers.filter(u => u.projectRole === 'manager' || u.role === 'manager').length;
    const staff = companyUsers.filter(u => u.projectRole === 'staff' || u.role === 'staff').length;
    const guests = companyUsers.filter(u => !u.projectRole || u.projectRole === 'guest' || u.role === 'guest').length;
    
    setStats({
      totalStaff: companyUsers.length,
      totalManagers: managers,
      totalGuests: guests,
      totalCompanies: companiesList.length,
      totalAdmins: admins,
      totalCompanyManagers: managers,
      totalCompanyStaff: staff
    });
  }, [user]);

  // ✅ Define loadData
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      let usersData = { data: [] };
      let companiesData = { data: [] };
      
      const companyId = user?.company?._id || user?.company;
      
      if (companyId) {
        console.log('📊 ManagerDashboard - Fetching users for company:', companyId);
        try {
          try {
            usersData = await userService.getUsersByCompanySafe(companyId);
            console.log('✅ Company users loaded:', usersData.data?.length || 0);
          } catch (err) {
            console.warn('⚠️ Company-specific endpoint failed, trying alternative:', err.message);
            try {
              usersData = await userService.getUsersSafe();
              if (usersData.data) {
                usersData.data = usersData.data.filter(u => {
                  const userCompanyId = u.company?._id || u.company;
                  return userCompanyId === companyId;
                });
              }
              console.log('✅ Filtered users loaded:', usersData.data?.length || 0);
            } catch (fallbackErr) {
              console.warn('⚠️ Fallback users fetch failed:', fallbackErr.message);
              usersData = { data: [] };
            }
          }
        } catch (error) {
          console.warn('⚠️ Could not load company users:', error.message);
          usersData = { data: [] };
        }
      } else {
        console.log('ℹ️ No company ID found for manager, skipping users');
        usersData = { data: [] };
      }
      
      console.log('📊 ManagerDashboard - Fetching companies');
      try {
        companiesData = await companyService.getCompaniesSafe();
        console.log('✅ Companies loaded:', companiesData.data?.length || 0);
      } catch (error) {
        console.warn('⚠️ Could not load companies:', error.message);
      }
      
      console.log('📊 ManagerDashboard - Fetching projects');
      try {
        await projectService.getProjectsSafe();
        console.log('✅ Projects loaded');
      } catch (error) {
        console.warn('⚠️ Could not load projects:', error.message);
      }
      
      const usersList = usersData.data || [];
      const companiesList = companiesData.data || [];
      
      console.log('📊 Total company users loaded:', usersList.length);
      
      setUsers(usersList);
      setCompanies(companiesList);
      
      calculateStats(usersList, companiesList);
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, calculateStats]);

  // ✅ Check if user has manager role or permission
  useEffect(() => {
    if (!permissions) {
      console.log('⏳ Waiting for permissions to load...');
      return;
    }

    const isManager = user?.role === 'manager' || user?.role === 'Manager';
    const canViewDashboard = hasPermission('viewDashboard');
    
    console.log('🔍 ManagerDashboard - User role:', user?.role);
    console.log('🔍 ManagerDashboard - Is manager:', isManager);
    console.log('🔍 ManagerDashboard - Can view dashboard:', canViewDashboard);
    
    if (!user) {
      console.log('🚫 Redirecting - No user found');
      navigate('/login');
      return;
    }
    
    if (!isManager) {
      console.log('🚫 Redirecting - User is not a manager, redirecting to dashboard');
      navigate('/dashboard');
      return;
    }
    
    if (!canViewDashboard) {
      console.log('🚫 Redirecting - No viewDashboard permission');
      navigate('/dashboard');
      return;
    }
    
    console.log('✅ All checks passed, loading dashboard data...');
    loadData();
    
  }, [user, permissions, hasPermission, navigate, loadData]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Get the manager's company
  const managerCompany = companies.find(c => c._id === user?.company?._id) || user?.company;

  // Get users for this company (already filtered)
  const companyUsers = users.filter(u => {
    const isNotSuperAdmin = u.role !== 'super_admin';
    const isNotSelf = u._id !== user?._id;
    return isNotSuperAdmin && isNotSelf;
  });

  // Filter users by role for tabs
  const getFilteredUsers = () => {
    if (activeTab === 'all') {
      return companyUsers;
    }
    return companyUsers.filter(u => u.role === activeTab);
  };

  // Get counts for each role
  const getRoleCount = (role) => {
    if (role === 'all') {
      return companyUsers.length;
    }
    return companyUsers.filter(u => u.role === role).length;
  };

  const filteredUsers = getFilteredUsers();

  // Role badge color mapping
  const getRoleBadgeClass = (role) => {
    const badges = {
      admin: 'badge-admin',
      manager: 'badge-manager',
      staff: 'badge-staff',
      guest: 'badge-guest'
    };
    return `role-badge ${badges[role] || 'badge-guest'}`;
  };

  // Role display name
  const getRoleDisplayName = (role) => {
    const names = {
      admin: 'Admin',
      manager: 'Manager',
      staff: 'Staff',
      guest: 'Guest'
    };
    return names[role] || role || 'Unknown';
  };

  if (loading) {
    return (
      <MainLayout title="Manager Dashboard" breadcrumbs={['Home', 'Manager']}>
        <div className="loading-state">
          <FaDatabase className="loading-icon" />
          <span>Loading dashboard...</span>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Manager Dashboard" breadcrumbs={['Home', 'Manager']}>
      <div className="dashboard-content">
        {/* Welcome Section */}
        <div className="welcome-section">
          <div className="welcome-header">
            <div>
              <h1>
                <FaUserCircle className="welcome-icon" />
                Welcome back, {user?.name || 'Manager'}!
              </h1>
              <p className="welcome-subtitle">
                Manage operations for: <strong>{managerCompany?.name || 'Your Company'}</strong>
              </p>
            </div>
            <div className="welcome-actions">
              <button className="btn-secondary" onClick={handleLogout}>
                <FaSignOutAlt className="btn-icon" />
                Logout
              </button>
            </div>
          </div>
          <div className="welcome-meta">
            <span className="meta-item">
              <FaBuilding className="meta-icon" />
              {stats.totalCompanies} Companies in the system
            </span>
            <span className="meta-item">
              <FaUsers className="meta-icon" />
              {users.length} Users in your company
            </span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.totalStaff}</div>
            <div className="stat-label">Team Members</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalCompanyManagers}</div>
            <div className="stat-label">Managers</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalCompanyStaff}</div>
            <div className="stat-label">Staff</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalCompanies}</div>
            <div className="stat-label">Companies</div>
          </div>
        </div>

        {/* Staff List with Role Tabs */}
        <div className="section">
          <div className="section-header">
            <h2 className="section-title">
              <FaUsers className="section-icon" />
              My Team
            </h2>
            <span className="section-badge">{companyUsers.length} members</span>
          </div>

          {/* Role Tabs */}
          <div className="role-tabs">
            <button 
              className={`role-tab ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All ({getRoleCount('all')})
            </button>
            <button 
              className={`role-tab ${activeTab === 'manager' ? 'active' : ''}`}
              onClick={() => setActiveTab('manager')}
            >
              Managers ({getRoleCount('manager')})
            </button>
            <button 
              className={`role-tab ${activeTab === 'staff' ? 'active' : ''}`}
              onClick={() => setActiveTab('staff')}
            >
              Staff ({getRoleCount('staff')})
            </button>
            <button 
              className={`role-tab ${activeTab === 'guest' ? 'active' : ''}`}
              onClick={() => setActiveTab('guest')}
            >
              Guests ({getRoleCount('guest')})
            </button>
          </div>

          {filteredUsers.length === 0 ? (
            <div className="no-data-message">
              <div className="no-data-icon">
                <FaUsers />
              </div>
              <p>No {activeTab !== 'all' ? getRoleDisplayName(activeTab).toLowerCase() : ''} members found in your company.</p>
            </div>
          ) : (
            <div className="users-grid">
              {filteredUsers.map((staff) => {
                const profilePic = staff.profilePicture ? getProfilePictureUrl(staff.profilePicture) : null;
                
                return (
                  <div key={staff._id} className="user-card">
                    <div className="user-cell">
                      {profilePic ? (
                        <img 
                          src={profilePic} 
                          alt={staff.name} 
                          className="user-avatar-img"
                        />
                      ) : (
                        <span className="user-avatar">
                          {staff.name?.[0]?.toUpperCase() || 'U'}
                        </span>
                      )}
                      <div>
                        <div className="user-name">{staff.name}</div>
                        <div className="user-email">
                          <FaEnvelope className="detail-icon" />
                          {staff.email}
                        </div>
                        <div className="user-phone">
                          <FaPhone className="detail-icon" />
                          {staff.phone || 'No phone'}
                        </div>
                      </div>
                    </div>
                    <div className="user-status">
                      <span className={getRoleBadgeClass(staff.role)}>
                        {getRoleDisplayName(staff.role)}
                      </span>
                      <span className={`status-indicator ${staff.isActive ? 'active' : 'inactive'}`}>
                        {staff.isActive ? (
                          <><FaCheckCircle className="status-icon" /> Active</>
                        ) : (
                          <><FaTimesCircle className="status-icon" /> Inactive</>
                        )}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .dashboard-content {
          max-width: 1400px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .welcome-section {
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
          color: white;
          padding: 25px 35px;
          border-radius: 12px;
          margin-bottom: 25px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          border-bottom: 3px solid #00d4ff;
        }

        .welcome-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          flex-wrap: wrap;
          gap: 15px;
        }

        .welcome-header h1 {
          margin: 0;
          font-size: 1.6rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 12px;
          color: #00d4ff;
        }

        .welcome-icon {
          font-size: 2rem;
        }

        .welcome-subtitle {
          margin: 8px 0 0 0;
          opacity: 0.9;
          font-size: 1rem;
          color: #a0aec0;
        }

        .welcome-subtitle strong {
          color: #00d4ff;
        }

        .welcome-actions .btn-secondary {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
          padding: 10px 24px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.3s;
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .welcome-actions .btn-secondary:hover {
          background: rgba(255, 255, 255, 0.3);
          transform: translateY(-2px);
        }

        .btn-icon {
          font-size: 1rem;
        }

        .welcome-meta {
          display: flex;
          gap: 30px;
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
        }

        .meta-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
          opacity: 0.9;
          color: #a0aec0;
        }

        .meta-icon {
          font-size: 1.1rem;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 25px;
        }

        .stat-card {
          background: white;
          padding: 16px 20px;
          border-radius: 10px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(0, 0, 0, 0.04);
          transition: all 0.3s;
          border-left: 3px solid #00d4ff;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        }

        .stat-value {
          font-size: 1.8rem;
          font-weight: 700;
          color: #0a0a0a;
        }

        .stat-label {
          font-size: 0.8rem;
          color: #4a5568;
          font-weight: 500;
          margin-top: 2px;
        }

        .section {
          background: white;
          border-radius: 12px;
          padding: 20px 25px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          border: 1px solid rgba(0, 0, 0, 0.04);
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }

        .section-title {
          margin: 0;
          font-size: 1.2rem;
          font-weight: 600;
          color: #0a0a0a;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .section-icon {
          color: #00d4ff;
        }

        .section-badge {
          background: #e2e8f0;
          padding: 4px 14px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 600;
          color: #0a0a0a;
        }

        /* Role Tabs */
        .role-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
          flex-wrap: wrap;
          border-bottom: 2px solid #e2e8f0;
          padding-bottom: 2px;
        }

        .role-tab {
          padding: 8px 18px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 500;
          color: #4a5568;
          border-radius: 6px 6px 0 0;
          transition: all 0.3s;
          position: relative;
        }

        .role-tab:hover {
          background: #f7fafc;
          color: #0a0a0a;
        }

        .role-tab.active {
          color: #00d4ff;
          background: rgba(0, 212, 255, 0.08);
        }

        .role-tab.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 2px;
          background: #00d4ff;
        }

        /* Users Grid */
        .users-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 14px;
        }

        .user-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          background: #f8fafc;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          transition: all 0.3s;
        }

        .user-card:hover {
          background: white;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
          transform: translateY(-2px);
        }

        .user-cell {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .user-avatar-img {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #e2e8f0;
        }

        .user-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(135deg, #00d4ff, #0099cc);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 14px;
          flex-shrink: 0;
        }

        .user-name {
          font-weight: 600;
          color: #0a0a0a;
          font-size: 0.95rem;
        }

        .user-email {
          font-size: 0.8rem;
          color: #4a5568;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .user-phone {
          font-size: 0.75rem;
          color: #718096;
          margin-top: 2px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .detail-icon {
          font-size: 0.7rem;
          color: #a0aec0;
        }

        .user-status {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
          flex-shrink: 0;
        }

        .role-badge {
          padding: 3px 12px;
          border-radius: 12px;
          font-size: 0.65rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }

        .role-badge.badge-admin {
          background: #e9d5ff;
          color: #6b21a8;
        }

        .role-badge.badge-manager {
          background: #fef3c7;
          color: #92400e;
        }

        .role-badge.badge-staff {
          background: #dbeafe;
          color: #1e40af;
        }

        .role-badge.badge-guest {
          background: #e2e8f0;
          color: #4a5568;
        }

        .status-indicator {
          font-size: 0.7rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .status-icon {
          font-size: 0.7rem;
        }

        .status-indicator.active {
          color: #48bb78;
        }

        .status-indicator.inactive {
          color: #fc8181;
        }

        .no-data-message {
          text-align: center;
          padding: 30px 20px;
          background: white;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .no-data-icon {
          font-size: 3rem;
          margin-bottom: 12px;
          color: #a0aec0;
        }

        .no-data-message p {
          margin: 0;
          color: #4a5568;
        }

        .loading-state {
          text-align: center;
          padding: 60px 20px;
          color: #4a5568;
          font-size: 1.1rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .loading-icon {
          font-size: 2.5rem;
          color: #00d4ff;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .dashboard-content {
            padding: 0 12px;
          }

          .welcome-section {
            padding: 18px 20px;
          }

          .welcome-header h1 {
            font-size: 1.3rem;
          }

          .welcome-meta {
            flex-direction: column;
            gap: 10px;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 10px;
          }

          .stat-value {
            font-size: 1.4rem;
          }

          .section {
            padding: 16px;
          }

          .role-tabs {
            gap: 4px;
          }

          .role-tab {
            padding: 6px 12px;
            font-size: 0.75rem;
          }

          .users-grid {
            grid-template-columns: 1fr;
          }

          .user-card {
            flex-wrap: wrap;
          }

          .user-status {
            flex-direction: row;
            width: 100%;
            justify-content: flex-start;
            gap: 10px;
            margin-top: 6px;
            padding-top: 6px;
            border-top: 1px solid #e2e8f0;
          }
        }

        @media (max-width: 480px) {
          .stats-grid {
            grid-template-columns: 1fr 1fr;
          }

          .stat-card {
            padding: 12px 14px;
          }

          .stat-value {
            font-size: 1.2rem;
          }

          .welcome-header {
            flex-direction: column;
          }

          .user-avatar-img {
            width: 32px;
            height: 32px;
          }

          .user-avatar {
            width: 32px;
            height: 32px;
            font-size: 12px;
          }
        }
      `}</style>
    </MainLayout>
  );
};

export default ManagerDashboard;