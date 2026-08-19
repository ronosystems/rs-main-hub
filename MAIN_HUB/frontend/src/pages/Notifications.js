// /home/kk/RS/MAIN HUB/frontend/src/pages/Notifications.js

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import './Notifications.css';

// SVG Icon Components - defined outside component
const UserIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const CompanyIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);

const SystemIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M12 1v2"/>
    <path d="M12 21v2"/>
    <path d="M4.22 4.22l1.42 1.42"/>
    <path d="M18.36 18.36l1.42 1.42"/>
    <path d="M1 12h2"/>
    <path d="M21 12h2"/>
    <path d="M4.22 19.78l1.42-1.42"/>
    <path d="M18.36 5.64l1.42-1.42"/>
  </svg>
);

const PlanIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="M8 12h8"/>
    <path d="M8 8h8"/>
    <path d="M8 16h4"/>
  </svg>
);

const SecurityIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="M9 12l2 2 4-4"/>
  </svg>
);

const ProjectIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
  </svg>
);

const TaskIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const SuccessIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const ErrorIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </svg>
);

const WarningIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 9v4"/>
    <path d="M12 17h.01"/>
    <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
  </svg>
);

const InfoIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>
);

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);

// Icon map - constant
const iconMap = {
  'user': UserIcon,
  'company': CompanyIcon,
  'system': SystemIcon,
  'plan': PlanIcon,
  'security': SecurityIcon,
  'project': ProjectIcon,
  'task': TaskIcon,
  'success': SuccessIcon,
  'error': ErrorIcon,
  'warning': WarningIcon,
  'info': InfoIcon
};

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);

  const API_URL = 'https://main-hub-api-ea52e89c5128.herokuapp.com/api';

  // Get icon component based on notification type - no useCallback needed
  const getIconComponent = (type) => {
    return iconMap[type] || BellIcon;
  };

  // Helper function to format time
  const formatTime = useCallback((timestamp) => {
    if (!timestamp) return 'Just now';
    
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  }, []);

  // Get color based on notification type
  const getTypeColor = useCallback((type) => {
    const colors = {
      user: '#00d4ff',
      company: '#28a745',
      system: '#f39c12',
      plan: '#8b5cf6',
      security: '#dc3545',
      project: '#fd7e14',
      task: '#20c997',
      success: '#28a745',
      error: '#dc3545',
      warning: '#ffc107',
      info: '#17a2b8'
    };
    return colors[type] || '#6c757d';
  }, []);

  // Fallback notifications for development/testing
  const getFallbackNotifications = useCallback(() => {
    return [
      {
        id: 1,
        title: 'Welcome to RS Hub',
        description: 'Your notification system is ready. You\'ll see real notifications here once the backend is connected.',
        time: 'Just now',
        read: false,
        type: 'system'
      },
      {
        id: 2,
        title: 'API Endpoint Not Found',
        description: 'The notifications API endpoint is not available. Please check your backend configuration.',
        time: '1 minute ago',
        read: false,
        type: 'warning'
      },
      {
        id: 3,
        title: 'Development Mode',
        description: 'You are seeing fallback notifications. These will be replaced with real data when the API is connected.',
        time: '2 minutes ago',
        read: false,
        type: 'info'
      }
    ];
  }, []);

  // Fetch notifications from API
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      console.log('🔍 Token:', token ? 'Present' : 'Missing');
      
      if (!token) {
        setError('Authentication required. Please login.');
        setLoading(false);
        return;
      }

      console.log('📡 Fetching notifications from:', `${API_URL}/notifications`);
      
      const response = await fetch(`${API_URL}/notifications`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📦 Notifications data:', data);
        
        if (data.success && data.data) {
          const formattedNotifications = data.data.map(notif => ({
            id: notif.id || notif._id,
            title: notif.title || notif.message || 'Notification',
            description: notif.description || notif.message || '',
            time: formatTime(notif.createdAt || notif.timestamp || new Date().toISOString()),
            read: notif.read || false,
            type: notif.type || 'system',
            link: notif.link || null,
            metadata: notif.metadata || {}
          }));
          setNotifications(formattedNotifications);
          setError(null);
        } else {
          console.warn('⚠️ API returned success: false or no data');
          setNotifications([]);
        }
      } else if (response.status === 401) {
        console.error('❌ Unauthorized - token expired or invalid');
        setError('Session expired. Please login again.');
        setNotifications([]);
      } else if (response.status === 404) {
        console.warn('⚠️ Notifications endpoint not found (404)');
        setNotifications(getFallbackNotifications());
        setError(null);
      } else {
        console.error(`❌ Server error: ${response.status}`);
        setError(`Failed to fetch notifications (Status: ${response.status})`);
        setNotifications([]);
      }
    } catch (error) {
      console.error('❌ Network error fetching notifications:', error);
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Using fallback notifications for development');
        setNotifications(getFallbackNotifications());
        setError(null);
      } else {
        setError('Network error. Please check your connection.');
        setNotifications([]);
      }
    } finally {
      setLoading(false);
    }
  }, [API_URL, formatTime, getFallbackNotifications]);

  // Initial fetch and polling
  useEffect(() => {
    fetchNotifications();
    
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
      } else {
        console.error('Failed to mark notification as read');
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    }
  }, [API_URL]);

  const markAllAsRead = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, read: true }))
        );
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
    }
  }, [API_URL]);

  const deleteNotification = useCallback(async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch(`${API_URL}/notifications/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
      } else {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      setNotifications(prev => prev.filter(n => n.id !== id));
    }
  }, [API_URL]);

  const clearAll = useCallback(async () => {
    if (window.confirm('Are you sure you want to clear all notifications?')) {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${API_URL}/notifications/clear-all`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          setNotifications([]);
        } else {
          setNotifications([]);
        }
      } catch (error) {
        console.error('Error clearing notifications:', error);
        setNotifications([]);
      }
    }
  }, [API_URL]);

  const getFilteredNotifications = useCallback(() => {
    if (filter === 'all') return notifications;
    if (filter === 'unread') return notifications.filter(n => !n.read);
    if (filter === 'read') return notifications.filter(n => n.read);
    return notifications.filter(n => n.type === filter);
  }, [filter, notifications]);

  const getUnreadCount = useCallback(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  const filteredNotifications = getFilteredNotifications();

  const handleRetry = useCallback(() => {
    setError(null);
    fetchNotifications();
  }, [fetchNotifications]);

  // Render icon function
  const renderIcon = (type) => {
    const IconComponent = getIconComponent(type);
    return <IconComponent />;
  };

  return (
    <MainLayout title="Notifications" breadcrumbs={['Home', 'Notifications']}>
      <div className="notifications-page">
        <div className="notifications-header">
          <div className="header-left">
            <h2>
              <BellIcon /> Notifications
            </h2>
            <span className="notification-count">
              {getUnreadCount()} unread
            </span>
          </div>
          <div className="header-right">
            {!loading && notifications.length > 0 && (
              <>
                <button className="btn-secondary btn-sm" onClick={markAllAsRead}>
                  Mark All as Read
                </button>
                <button className="btn-danger btn-sm" onClick={clearAll}>
                  Clear All
                </button>
              </>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="notification-filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            <BellIcon /> All ({notifications.length})
          </button>
          <button 
            className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
            onClick={() => setFilter('unread')}
          >
            <InfoIcon /> Unread ({getUnreadCount()})
          </button>
          <button 
            className={`filter-btn ${filter === 'read' ? 'active' : ''}`}
            onClick={() => setFilter('read')}
          >
            <SuccessIcon /> Read ({notifications.filter(n => n.read).length})
          </button>
          <button 
            className={`filter-btn ${filter === 'user' ? 'active' : ''}`}
            onClick={() => setFilter('user')}
          >
            <UserIcon /> Users
          </button>
          <button 
            className={`filter-btn ${filter === 'company' ? 'active' : ''}`}
            onClick={() => setFilter('company')}
          >
            <CompanyIcon /> Companies
          </button>
          <button 
            className={`filter-btn ${filter === 'system' ? 'active' : ''}`}
            onClick={() => setFilter('system')}
          >
            <SystemIcon /> System
          </button>
        </div>

        {/* Notifications List */}
        <div className="notifications-list">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading notifications...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <ErrorIcon />
              <h3>Error loading notifications</h3>
              <p>{error}</p>
              <button className="btn-primary btn-sm" onClick={handleRetry}>
                Retry
              </button>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="empty-state">
              <BellIcon />
              <h3>No notifications</h3>
              <p>{filter === 'all' ? "You're all caught up!" : `No ${filter} notifications`}</p>
            </div>
          ) : (
            filteredNotifications.map(notif => (
              <div 
                key={notif.id} 
                className={`notification-item ${!notif.read ? 'unread' : ''}`}
                onClick={() => markAsRead(notif.id)}
              >
                <div className="notification-icon" style={{ background: getTypeColor(notif.type) }}>
                  {renderIcon(notif.type)}
                </div>
                <div className="notification-content">
                  <div className="notification-title">{notif.title}</div>
                  <div className="notification-description">{notif.description}</div>
                  <div className="notification-time">{notif.time}</div>
                </div>
                <div className="notification-actions">
                  {!notif.read && (
                    <span className="unread-dot"></span>
                  )}
                  <button 
                    className="delete-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm('Delete this notification?')) {
                        deleteNotification(notif.id);
                      }
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer with stats */}
        {!loading && !error && (
          <div className="notifications-footer">
            <span>
              Showing {filteredNotifications.length} of {notifications.length} notifications
            </span>
            <button 
              className="btn-secondary btn-sm"
              onClick={() => navigate('/')}
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>

      <style>{`
        .loading-state,
        .error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top: 4px solid #00d4ff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 16px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .error-state svg {
          width: 48px;
          height: 48px;
          stroke: #dc3545;
          margin-bottom: 16px;
        }

        .error-state h3 {
          margin: 0 0 8px 0;
          color: #dc3545;
        }

        .error-state p {
          color: #6c757d;
          margin-bottom: 16px;
        }

        .error-state .btn-primary {
          background: #00d4ff;
          color: white;
          border: none;
          padding: 8px 24px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.3s;
        }

        .error-state .btn-primary:hover {
          background: #00b8e6;
        }

        .notification-item {
          display: flex;
          align-items: flex-start;
          padding: 16px 20px;
          border-bottom: 1px solid #e2e8f0;
          cursor: pointer;
          transition: background 0.2s;
          gap: 16px;
        }

        .notification-item:hover {
          background: #f7fafc;
        }

        .notification-item.unread {
          background: #ebf8ff;
        }

        .notification-item.unread:hover {
          background: #dbeafe;
        }

        .notification-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: white;
        }

        .notification-icon svg {
          width: 20px;
          height: 20px;
          stroke: white;
        }

        .notification-content {
          flex: 1;
          min-width: 0;
        }

        .notification-title {
          font-weight: 600;
          color: #0a0a0a;
          margin-bottom: 4px;
        }

        .notification-description {
          color: #4a5568;
          font-size: 0.9rem;
          margin-bottom: 4px;
        }

        .notification-time {
          color: #a0aec0;
          font-size: 0.75rem;
        }

        .notification-actions {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }

        .unread-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #00d4ff;
          display: inline-block;
        }

        .delete-btn {
          background: none;
          border: none;
          color: #a0aec0;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.2s;
          font-size: 14px;
        }

        .delete-btn:hover {
          color: #dc3545;
          background: #fff5f5;
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          text-align: center;
        }

        .empty-state svg {
          width: 48px;
          height: 48px;
          stroke: #cbd5e0;
          margin-bottom: 16px;
        }

        .empty-state h3 {
          margin: 0 0 8px 0;
          color: #0a0a0a;
        }

        .empty-state p {
          color: #6c757d;
          margin: 0;
        }

        .notifications-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px 20px;
          border-top: 1px solid #e2e8f0;
          color: #6c757d;
          font-size: 0.9rem;
        }

        .btn-secondary,
        .btn-danger {
          padding: 6px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.85rem;
          transition: all 0.2s;
        }

        .btn-secondary {
          background: #e2e8f0;
          color: #0a0a0a;
        }

        .btn-secondary:hover {
          background: #cbd5e0;
        }

        .btn-danger {
          background: #dc3545;
          color: white;
        }

        .btn-danger:hover {
          background: #c82333;
        }

        .btn-sm {
          padding: 4px 12px;
          font-size: 0.8rem;
        }

        .notifications-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 24px;
          border-bottom: 1px solid #e2e8f0;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .header-left h2 {
          margin: 0;
          font-size: 1.5rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .header-left h2 svg {
          width: 24px;
          height: 24px;
          stroke: #0a0a0a;
        }

        .notification-count {
          background: #00d4ff;
          color: white;
          padding: 2px 12px;
          border-radius: 12px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        .header-right {
          display: flex;
          gap: 8px;
        }

        .notification-filters {
          display: flex;
          gap: 8px;
          padding: 12px 24px;
          border-bottom: 1px solid #e2e8f0;
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: 6px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 20px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .filter-btn svg {
          width: 16px;
          height: 16px;
          stroke: #4a5568;
        }

        .filter-btn:hover {
          background: #f7fafc;
        }

        .filter-btn.active {
          background: #00d4ff;
          color: white;
          border-color: #00d4ff;
        }

        .filter-btn.active svg {
          stroke: white;
        }
      `}</style>
    </MainLayout>
  );
};

export default Notifications;