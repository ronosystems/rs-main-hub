// /home/kk/RS/MAIN HUB/frontend/src/pages/AdminDashboard.js

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import MainLayout from '../components/layout/MainLayout';
import { userService } from '../services/userService';
import { companyService } from '../services/companyService';
import './Dashboard.css';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  const STATIC_URL = process.env.REACT_APP_STATIC_URL || 'http://localhost:5000';

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, companiesData] = await Promise.all([
        userService.getUsers(),
        companyService.getCompanies()
      ]);
      setUsers(usersData.data || []);
      setCompanies(companiesData.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get the admin's company
  const adminCompany = companies.find(c => c._id === user?.company?._id);

  // Get users for this company (excluding super_admin)
  const companyUsers = users.filter(u => 
    u.company === user?.company?._id && 
    u.role !== 'super_admin'
  );

  // Filter users by role
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

  // ✅ Get full profile picture URL from server (same as Users.js)
  const getProfilePictureUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return `${STATIC_URL}${path}`;
  };

  // Stats
  const totalStaff = companyUsers.length;
  const totalManagers = companyUsers.filter(u => u.role === 'manager').length;
  const totalAdmins = companyUsers.filter(u => u.role === 'admin').length;
  const totalGuests = companyUsers.filter(u => u.role === 'guest').length;
  const totalCompanies = companies.length;

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
      <MainLayout title="Admin Dashboard" breadcrumbs={['Home', 'Admin']}>
        <div className="loading-state">Loading dashboard...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Admin Dashboard" breadcrumbs={['Home', 'Admin']}>
      <div className="dashboard-content">
        <div className="welcome-section">
          <h1>Welcome, {user?.name}!</h1>
          <p>Manage your company: <strong>{adminCompany?.name || user?.company?.name || 'Your Company'}</strong></p>
          <p>Project: {user?.project?.name || 'N/A'}</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{totalStaff}</div>
            <div className="stat-label">Team Members</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalAdmins}</div>
            <div className="stat-label">Admins</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalManagers}</div>
            <div className="stat-label">Managers</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalGuests}</div>
            <div className="stat-label">Guests</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{totalCompanies}</div>
            <div className="stat-label">Companies</div>
          </div>
        </div>

        <div className="section">
          <div className="section-header">
            <h2 className="section-title">👥 Team Members</h2>
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
              className={`role-tab ${activeTab === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveTab('admin')}
            >
              Admins ({getRoleCount('admin')})
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
              <p>No {activeTab !== 'all' ? getRoleDisplayName(activeTab).toLowerCase() : ''} members found in your company.</p>
            </div>
          ) : (
            <div className="users-grid">
              {filteredUsers.map((staff) => {
                // ✅ Get profile picture URL (same as Users.js)
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
                        <div className="user-email">{staff.email}</div>
                        {staff.phone && (
                          <div className="user-phone">{staff.phone}</div>
                        )}
                      </div>
                    </div>
                    <div className="user-status">
                      <span className={getRoleBadgeClass(staff.role)}>
                        {getRoleDisplayName(staff.role)}
                      </span>
                      <span className={`status-indicator ${staff.isActive ? 'active' : 'inactive'}`}>
                        {staff.isActive ? 'Active' : 'Inactive'}
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
          color: #ffffff;
          padding: 25px 35px;
          border-radius: 12px;
          margin-bottom: 25px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          border-bottom: 3px solid #00d4ff;
        }

        .welcome-section h1 {
          margin: 0 0 5px 0;
          font-size: 1.6rem;
          font-weight: 700;
          color: #00d4ff;
        }

        .welcome-section p {
          margin: 4px 0;
          opacity: 0.9;
          color: #f2f3f5;
        }

        .welcome-section strong {
          color: #00d4ff;
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

        /* ✅ Same as Users.js user-cell */
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
        }

        .user-phone {
          font-size: 0.75rem;
          color: #718096;
          margin-top: 2px;
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
          color: #4a5568;
        }

        .loading-state {
          text-align: center;
          padding: 60px 20px;
          color: #4a5568;
          font-size: 1.1rem;
        }

        @media (max-width: 768px) {
          .dashboard-content {
            padding: 0 12px;
          }

          .welcome-section {
            padding: 18px 20px;
          }

          .welcome-section h1 {
            font-size: 1.3rem;
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

export default AdminDashboard;