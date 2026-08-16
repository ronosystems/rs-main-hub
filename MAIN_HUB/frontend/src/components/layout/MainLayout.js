import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { usePermissions } from '../../context/PermissionContext';
import './MainLayout.css';

const MainLayout = ({ children, title, breadcrumbs }) => {
  const { user, logout } = useAuth();
  const { hasPermission, refreshPermissions, permissions, loading: permissionsLoading } = usePermissions();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [permissionsLoaded, setPermissionsLoaded] = useState(false);
  
  // System Settings
  const [systemLogo, setSystemLogo] = useState(null);
  const [platformName, setPlatformName] = useState('RS Hub');
  const [primaryColor, setPrimaryColor] = useState('#00d4ff');
  const [sidebarColor, setSidebarColor] = useState('#0a0a0a');

  // Notification and Calendar states
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState([]);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const STATIC_URL = process.env.REACT_APP_STATIC_URL || 'http://localhost:5000';

  // Load system settings from server
  useEffect(() => {
    const fetchSystemSettings = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          loadFromLocalStorage();
          return;
        }

        const response = await fetch(`${API_URL}/settings`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const settings = data.data;
            
            if (settings.platformName) setPlatformName(settings.platformName);
            if (settings.primaryColor) setPrimaryColor(settings.primaryColor);
            if (settings.sidebarColor) setSidebarColor(settings.sidebarColor);
            
            if (settings.logo) {
              const logoUrl = settings.logo.startsWith('http') ? settings.logo : `${STATIC_URL}${settings.logo}`;
              setSystemLogo(logoUrl);
              localStorage.setItem('systemLogo', logoUrl);
            } else {
              setSystemLogo(null);
              localStorage.removeItem('systemLogo');
            }

            localStorage.setItem('platformName', settings.platformName || 'RS Hub');
            localStorage.setItem('primaryColor', settings.primaryColor || '#00d4ff');
            localStorage.setItem('sidebarColor', settings.sidebarColor || '#0a0a0a');
            return;
          }
        }
        
        loadFromLocalStorage();
      } catch (error) {
        console.error('Error fetching system settings:', error);
        loadFromLocalStorage();
      }
    };

    const loadFromLocalStorage = () => {
      const savedLogo = localStorage.getItem('systemLogo');
      if (savedLogo) {
        setSystemLogo(savedLogo);
      }
      
      const savedPlatformName = localStorage.getItem('platformName');
      if (savedPlatformName) {
        setPlatformName(savedPlatformName);
      }
      
      const savedPrimaryColor = localStorage.getItem('primaryColor');
      if (savedPrimaryColor) {
        setPrimaryColor(savedPrimaryColor);
      }
      
      const savedSidebarColor = localStorage.getItem('sidebarColor');
      if (savedSidebarColor) {
        setSidebarColor(savedSidebarColor);
      }
    };

    fetchSystemSettings();

    const handleStorageChange = (e) => {
      if (e.key === 'systemLogo' && e.newValue) {
        setSystemLogo(e.newValue);
      }
      if (e.key === 'platformName' && e.newValue) {
        setPlatformName(e.newValue);
      }
      if (e.key === 'primaryColor' && e.newValue) {
        setPrimaryColor(e.newValue);
      }
      if (e.key === 'sidebarColor' && e.newValue) {
        setSidebarColor(e.newValue);
      }
    };

    const handleSettingsUpdated = (e) => {
      if (e.detail) {
        if (e.detail.logo) setSystemLogo(e.detail.logo);
        if (e.detail.platformName) setPlatformName(e.detail.platformName);
        if (e.detail.primaryColor) setPrimaryColor(e.detail.primaryColor);
        if (e.detail.sidebarColor) setSidebarColor(e.detail.sidebarColor);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('settingsUpdated', handleSettingsUpdated);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('settingsUpdated', handleSettingsUpdated);
    };
  }, [API_URL, STATIC_URL]);

  // ✅ Fetch real notifications from the backend (only once)
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      
      setNotificationsLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setNotifications([]);
          setNotificationsLoading(false);
          return;
        }

        const response = await fetch(`${API_URL}/notifications`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const formattedNotifications = data.data.map(notif => ({
              id: notif.id || notif._id,
              title: notif.title || notif.message || 'Notification',
              time: formatTime(notif.createdAt || notif.timestamp),
              read: notif.read || false,
              type: notif.type || 'info',
              link: notif.link || null
            }));
            setNotifications(formattedNotifications);
          } else {
            setNotifications([]);
          }
        } else {
          console.error('Failed to fetch notifications');
          setNotifications([]);
        }
      } catch (error) {
        console.error('Error fetching notifications:', error);
        setNotifications([]);
      } finally {
        setNotificationsLoading(false);
      }
    };

    fetchNotifications();

    // ✅ REMOVED: Auto-refresh interval - removed to prevent page misbehavior
    
    return () => {
      // Clean up any intervals
    };
  }, [user, API_URL]);

  // ✅ Fetch real calendar events (only once)
  useEffect(() => {
    const fetchCalendarEvents = async () => {
      if (!user) return;

      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`${API_URL}/calendar/events`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setCalendarEvents(data.data);
          }
        }
      } catch (error) {
        console.error('Error fetching calendar events:', error);
      }
    };

    fetchCalendarEvents();
  }, [user, API_URL]);

  // Helper function to format time
  const formatTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    
    const now = new Date();
    const date = new Date(timestamp);
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  // Refresh permissions only once when user logs in
  useEffect(() => {
    if (user && !permissionsLoaded) {
      console.log('🔄 MainLayout: Initial permissions load');
      refreshPermissions();
      setPermissionsLoaded(true);
    }
  }, [user, refreshPermissions, permissionsLoaded]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth <= 768) {
        setSidebarOpen(false);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showNotifications && !e.target.closest('.notification-wrapper')) {
        setShowNotifications(false);
      }
      if (showCalendar && !e.target.closest('.calendar-wrapper')) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showNotifications, showCalendar]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Handle profile click - navigate to profile settings
  const handleProfileClick = (e) => {
    e.preventDefault();
    navigate('/profile');
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Toggle notification dropdown
  const toggleNotifications = (e) => {
    e.stopPropagation();
    setShowNotifications(!showNotifications);
    setShowCalendar(false);
  };

  // Toggle calendar dropdown
  const toggleCalendar = (e) => {
    e.stopPropagation();
    setShowCalendar(!showCalendar);
    setShowNotifications(false);
  };

  // ✅ Mark notification as read (with API call)
  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // ✅ Mark all as read (with API call)
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Get unread count
  const getUnreadCount = () => {
    return notifications.filter(n => !n.read).length;
  };

  // Calendar functions
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const changeMonth = (delta) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + delta);
      return newDate;
    });
  };

  const getEventsForDate = (day) => {
    return calendarEvents.filter(event => {
      const eventDate = new Date(event.date || event.startDate);
      return eventDate.getDate() === day &&
             eventDate.getMonth() === currentDate.getMonth() &&
             eventDate.getFullYear() === currentDate.getFullYear();
    });
  };

  const getFullProfilePictureUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return `${STATIC_URL}${path}`;
  };

  const displayProfilePicture = user?.profilePicture ? getFullProfilePictureUrl(user.profilePicture) : null;

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'GOOD MORNING';
    if (hour >= 12 && hour < 17) return 'GOOD AFTERNOON';
    if (hour >= 17 && hour < 21) return 'GOOD EVENING';
    return 'GOOD NIGHT';
  };

  // Icon components
  const Icons = {
    Dashboard: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
    Projects: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
      </svg>
    ),
    Companies: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    Plans: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2"/>
        <path d="M8 12h8"/>
        <path d="M8 8h8"/>
        <path d="M8 16h4"/>
      </svg>
    ),
    Users: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    Roles: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="M9 12l2 2 4-4"/>
      </svg>
    ),
    Reports: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/>
        <line x1="12" y1="20" x2="12" y2="4"/>
        <line x1="6" y1="20" x2="6" y2="14"/>
        <rect x="2" y="2" width="20" height="20" rx="2"/>
      </svg>
    ),
    Settings: () => (
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
    ),
    Menu: () => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
    ),
    User: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    Logout: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
    ),
    Bell: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
    Calendar: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
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
    Welcome: () => (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
    )
  };

  // All possible menu items with permissions
  const allMenuItems = [
    { icon: 'Dashboard', label: 'Dashboard', path: '/dashboard', permission: 'viewDashboard' },
    { icon: 'Projects', label: 'Projects', path: '/projects', permission: 'viewProjects' },
    { icon: 'Companies', label: 'Companies', path: '/companies', permission: 'viewCompanies' },
    { icon: 'Plans', label: 'Plans', path: '/plans', permission: 'viewPlans' },
    { icon: 'Users', label: 'Users', path: '/users', permission: 'viewUsers' },
    { icon: 'Roles', label: 'Roles', path: '/roles', permission: 'manageRoles' },
    { icon: 'Reports', label: 'Reports', path: '/reports', permission: 'viewReports' },
    { icon: 'Settings', label: 'Settings', path: '/settings', permission: 'viewSettings' },
  ];

  // Get menu items based on hardcoded permissions
  const getMenuItems = () => {
    if (permissionsLoading || !permissions) {
      console.log('⏳ Permissions still loading, showing only dashboard...');
      return allMenuItems
        .filter(item => item.label === 'Dashboard')
        .map(item => ({
          ...item,
          path: user?.role === 'manager' ? '/manager' : 
                user?.role === 'admin' ? '/admin' : 
                user?.role === 'staff' ? '/staff' : '/dashboard'
        }));
    }

    console.log('🔍 ===== DEBUGGING PERMISSIONS =====');
    console.log('🔍 User role:', user?.role);
    console.log('🔍 Permissions loaded:', !!permissions);

    if (user?.role === 'super_admin' || user?.role === 'Super Admin') {
      console.log('👑 Super Admin - showing all menu items');
      return allMenuItems.map(item => ({
        ...item,
        path: `/super-admin${item.path}`
      }));
    }

    const pathMap = {
      admin: {
        '/dashboard': '/admin',
        '/projects': '/admin/projects',
        '/companies': '/admin/companies',
        '/users': '/admin/users',
        '/reports': '/admin/reports'
      },
      manager: {
        '/dashboard': '/manager',
        '/projects': '/manager/projects',
        '/companies': '/manager/companies',
        '/reports': '/manager/reports'
      },
      staff: {
        '/dashboard': '/staff',
        '/projects': '/staff/projects'
      }
    };

    const rolePaths = pathMap[user?.role?.toLowerCase()] || {};

    const filteredItems = allMenuItems
      .filter(item => {
        if (item.label === 'Dashboard') return true;
        const hasAccess = hasPermission(item.permission);
        console.log(`  📌 ${item.label}: ${hasAccess ? '✅ SHOW' : '❌ HIDE'} (${item.permission})`);
        return hasAccess;
      })
      .map(item => ({
        ...item,
        path: rolePaths[item.path] || `/${item.path}`
      }));

    console.log('📋 Final menu items:', filteredItems.map(i => i.label));
    return filteredItems;
  };

  const menuItems = getMenuItems();

  // Dynamic styles based on settings
  const navbarStyle = {
    background: `linear-gradient(135deg, #0a0a0a, #1a1a1a)`,
    borderBottom: `3px solid ${primaryColor}`
  };

  const sidebarStyle = {
    background: sidebarColor || '#ffffff',
    borderRight: '1px solid #e2e8f0'
  };

  const activeItemStyle = {
    background: `rgba(${hexToRgb(primaryColor)}, 0.1)`,
    color: primaryColor,
    borderLeft: `3px solid ${primaryColor}`
  };

  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
      `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
      '0, 212, 255';
  }

  // Get the user's display name
  const getUserDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  return (
    <div className="rs-layout">
      {/* ========== FIXED TOP NAVBAR ========== */}
      <nav className="rs-navbar" style={navbarStyle}>
        <div className="navbar-left">
          <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
            <Icons.Menu />
          </button>
          <div className="navbar-brand">
            <div className="system-logo">
              {systemLogo ? (
                <img 
                  src={systemLogo} 
                  alt="System Logo" 
                  className="logo-img" 
                  style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'contain' }}
                />
              ) : (
                <svg width="36" height="36" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="32" height="32" rx="8" fill={primaryColor} />
                  <text x="16" y="22" textAnchor="middle" fontSize="16" fontWeight="bold" fill="white" fontFamily="Arial, sans-serif">
                    RS
                  </text>
                </svg>
              )}
            </div>
            <span className="brand-text">{platformName}</span>
          </div>
        </div>
        <div className="navbar-center">
          <span className="navbar-title">{title || 'Dashboard'}</span>
        </div>
        <div className="navbar-right">
          <div className="navbar-user">
            <span className="user-avatar" style={{ 
              background: primaryColor, 
              color: '#ffffff',
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {displayProfilePicture ? (
                <img 
                  src={displayProfilePicture} 
                  alt={user?.name || 'User'} 
                  style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                  {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              )}
            </span>
            <span className="user-name" style={{ color: '#ffffff', fontWeight: '500' }}>
              {user?.name || 'Admin'}
            </span>
            <span className={`user-role ${getRoleBadgeClass(user?.role)}`}>
              {user?.role || 'User'}
            </span>
          </div>
          
          {/* Notification Button */}
          <div className="notification-wrapper">
            <button 
              className="header-btn notification-btn" 
              onClick={toggleNotifications}
              title="Notifications"
            >
              <Icons.Bell />
              {!notificationsLoading && getUnreadCount() > 0 && (
                <span className="notification-badge">{getUnreadCount()}</span>
              )}
            </button>
            
            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="notification-dropdown">
                <div className="dropdown-header">
                  <span className="dropdown-title">Notifications</span>
                  {!notificationsLoading && getUnreadCount() > 0 && (
                    <button className="mark-all-btn" onClick={markAllAsRead}>
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="notification-list">
                  {notificationsLoading ? (
                    <div className="empty-notifications">
                      <span>⏳</span>
                      <p>Loading notifications...</p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="empty-notifications">
                      <span>🔔</span>
                      <p>No notifications</p>
                    </div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif.id} 
                        className={`notification-item ${!notif.read ? 'unread' : ''}`}
                        onClick={() => markAsRead(notif.id)}
                      >
                        <div className="notification-content">
                          <div className="notification-title">{notif.title}</div>
                          <div className="notification-time">{notif.time}</div>
                        </div>
                        {!notif.read && <span className="notification-dot"></span>}
                      </div>
                    ))
                  )}
                </div>
                <div className="dropdown-footer">
                  <button 
                    className="view-all-btn" 
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/notifications');
                    }}
                  >
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Calendar Button */}
          <div className="calendar-wrapper">
            <button 
              className="header-btn calendar-btn" 
              onClick={toggleCalendar}
              title="Calendar"
            >
              <Icons.Calendar />
            </button>
            
            {/* Calendar Dropdown */}
            {showCalendar && (
              <div className="calendar-dropdown">
                <div className="calendar-header">
                  <button onClick={() => changeMonth(-1)} className="calendar-nav">
                    <Icons.ChevronLeft />
                  </button>
                  <span className="calendar-month">
                    {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                  </span>
                  <button onClick={() => changeMonth(1)} className="calendar-nav">
                    <Icons.ChevronRight />
                  </button>
                </div>
                <div className="calendar-grid">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="calendar-weekday">{day}</div>
                  ))}
                  {Array.from({ length: getFirstDayOfMonth(currentDate.getFullYear(), currentDate.getMonth()) }).map((_, i) => (
                    <div key={`empty-${i}`} className="calendar-day empty"></div>
                  ))}
                  {Array.from({ length: getDaysInMonth(currentDate.getFullYear(), currentDate.getMonth()) }).map((_, i) => {
                    const day = i + 1;
                    const events = getEventsForDate(day);
                    const isToday = day === new Date().getDate() && 
                                    currentDate.getMonth() === new Date().getMonth() && 
                                    currentDate.getFullYear() === new Date().getFullYear();
                    return (
                      <div 
                        key={day} 
                        className={`calendar-day ${isToday ? 'today' : ''} ${events.length > 0 ? 'has-event' : ''}`}
                      >
                        <span className="day-number">{day}</span>
                        {events.length > 0 && (
                          <div className="event-indicators">
                            {events.map((event, idx) => (
                              <span key={idx} className="event-dot" style={{ background: event.color || '#00d4ff' }}></span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="calendar-footer">
                  <span className="today-date">
                    {new Date().toLocaleDateString('default', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            )}
          </div>

          <button className="navbar-logout" onClick={handleLogout}>
            <Icons.Logout />
            Logout
          </button>
        </div>
      </nav>

      {/* ========== FIXED SIDEBAR ========== */}
      <aside className={`rs-sidebar ${sidebarOpen ? 'open' : 'closed'}`} style={sidebarStyle}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="welcome-sidebar-header" style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              width: '100%',
              padding: '8px 0',
              textAlign: 'center'
            }}>
              <span className="welcome-icon-header" style={{ marginBottom: '8px' }}>
                <Icons.Welcome />
              </span>
              <div className="welcome-text-container" style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center',
                width: '100%'
              }}>
                <div className="welcome-greeting" style={{ 
                  fontSize: '1.1rem', 
                  fontWeight: '700', 
                  color: '#0a0a0a',
                  letterSpacing: '0.5px',
                  lineHeight: '1.3'
                }}>
                  {getGreeting()}
                </div>
                <div className="welcome-name" style={{ 
                  fontSize: '0.9rem', 
                  fontWeight: '500', 
                  color: '#1a1a2e',
                  opacity: '0.85',
                  marginTop: '2px'
                }}>
                  {getUserDisplayName()}
                </div>
              </div>
            </div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {menuItems.map((item, index) => {
            const IconComponent = Icons[item.icon];
            return (
              <Link
                key={index}
                to={item.path}
                className={`sidebar-item ${window.location.pathname === item.path ? 'active' : ''}`}
                style={window.location.pathname === item.path ? activeItemStyle : {}}
                onClick={(e) => {
                  e.preventDefault();
                  navigate(item.path);
                }}
              >
                <span className="sidebar-icon">
                  {IconComponent && <IconComponent />}
                </span>
                {sidebarOpen && <span className="sidebar-label">{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        
        {/* ========== SIDEBAR FOOTER - PROFILE LINK ========== */}
        <div className="sidebar-footer">
          <div 
            className="sidebar-profile-link" 
            onClick={handleProfileClick}
            style={{ cursor: 'pointer' }}
          >
            <div className="sidebar-user">
              <span className="user-avatar" style={{
                background: primaryColor,
                color: '#ffffff',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {displayProfilePicture ? (
                  <img 
                    src={displayProfilePicture} 
                    alt={user?.name || 'User'} 
                    style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontSize: '16px', fontWeight: 'bold' }}>
                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </span>
              {sidebarOpen && (
                <div className="user-info">
                  <div className="user-name" style={{ color: '#0a0a0a', fontWeight: '600' }}>
                    {user?.name || 'Admin'}
                  </div>
                  <div className="user-role" style={{ color: '#4a5568', fontSize: '0.7rem' }}>
                    {user?.role || 'User'}
                  </div>
                </div>
              )}
              {sidebarOpen && (
                <span className="profile-arrow">
                  <Icons.ChevronRight />
                </span>
              )}
            </div>
          </div>
        </div>
      </aside>

      {/* ========== SIDEBAR OVERLAY (Mobile) ========== */}
      {isMobile && sidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}

      {/* ========== MAIN CONTENT AREA ========== */}
      <main className={`rs-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="rs-content-header" style={{ borderBottom: `2px solid ${primaryColor}` }}>
          <div className="header-left">
            <h1 className="header-title">{title || 'Dashboard'}</h1>
            {breadcrumbs && (
              <div className="header-breadcrumbs">
                {breadcrumbs.map((crumb, index) => (
                  <span key={index}>
                    {index > 0 && ' / '}
                    <span className={index === breadcrumbs.length - 1 ? 'breadcrumb-active' : 'breadcrumb-link'}>
                      {crumb}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="header-right">
            {/* Buttons removed from here - they are in the navbar now */}
          </div>
        </div>

        <div className="rs-content-body">
          {children}
        </div>

        <footer className="rs-footer" style={{ borderTop: `2px solid ${primaryColor}` }}>
          <div className="footer-left">
            © {new Date().getFullYear()} {platformName} - All Rights Reserved
          </div>
          <div className="footer-right">
            <span>Version 2.0</span>
            <span className="footer-separator">|</span>
            <span>Support: support@ronosystem.com</span>
          </div>
        </footer>
      </main>

      <style>{`
        .system-logo {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .system-logo .logo-img {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          object-fit: contain;
        }
        .system-logo svg {
          width: 36px;
          height: 36px;
        }
        .system-logo-small {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .system-logo-small .logo-img {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          object-fit: contain;
        }
        .system-logo-small svg {
          width: 32px;
          height: 32px;
        }
        
        /* Welcome Sidebar Header Styles */
        .welcome-sidebar-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          padding: 8px 0;
          text-align: center;
        }
        
        .welcome-icon-header {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
        }
        
        .welcome-icon-header svg {
          width: 28px;
          height: 28px;
          stroke: #0a0a0a;
        }
        
        .welcome-text-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }
        
        .welcome-greeting {
          font-size: 1.1rem;
          font-weight: 700;
          color: #0a0a0a;
          letter-spacing: 0.5px;
          line-height: 1.3;
        }
        
        .welcome-name {
          font-size: 0.9rem;
          font-weight: 500;
          color: #1a1a2e;
          opacity: 0.85;
          margin-top: 2px;
        }
        
        .rs-sidebar.closed .welcome-sidebar-header {
          padding: 8px 0;
        }
        
        .rs-sidebar.closed .welcome-text-container {
          display: none;
        }
        
        .rs-sidebar.closed .welcome-icon-header {
          margin-bottom: 0;
        }
        
        .rs-sidebar.closed .welcome-icon-header svg {
          width: 32px;
          height: 32px;
        }

        .breadcrumb-active {
          color: ${primaryColor} !important;
        }
        .sidebar-item.active {
          background: rgba(${hexToRgb(primaryColor)}, 0.1) !important;
          color: ${primaryColor} !important;
          borderLeft: 3px solid ${primaryColor} !important;
        }
        .sidebar-item {
          color: #4a5568 !important;
        }
        .sidebar-item:hover {
          background: rgba(${hexToRgb(primaryColor)}, 0.05) !important;
          color: ${primaryColor} !important;
        }
        .btn-primary {
          background: ${primaryColor} !important;
        }
        .btn-primary:hover {
          background: ${primaryColor}dd !important;
        }
        .sidebar-icon svg {
          width: 20px;
          height: 20px;
          color: #4a5568;
        }
        .sidebar-item:hover .sidebar-icon svg {
          color: ${primaryColor};
        }
        .sidebar-item.active .sidebar-icon svg {
          color: ${primaryColor};
        }
        .navbar-user .user-avatar svg {
          width: 20px;
          height: 20px;
        }
        .navbar-logout svg {
          width: 18px;
          height: 18px;
          margin-right: 6px;
        }
        .header-btn svg {
          width: 20px;
          height: 20px;
        }
        .sidebar-toggle-btn svg {
          width: 24px;
          height: 24px;
        }
        .sidebar-footer .user-name {
          color: #0a0a0a !important;
          font-weight: 600;
        }
        .sidebar-footer .user-role {
          color: #4a5568 !important;
        }
        .sidebar-brand .brand-text {
          color: ${sidebarColor === '#ffffff' || sidebarColor === '#f0f4f8' ? '#0a0a0a' : '#ffffff'} !important;
        }
        .sidebar-header {
          border-bottom: 1px solid #e2e8f0 !important;
          padding: 16px 15px !important;
        }
        .sidebar-footer {
          border-top: 1px solid #e2e8f0 !important;
          padding: 12px 15px;
          transition: all 0.2s;
        }
        .sidebar-footer:hover {
          background: rgba(0, 212, 255, 0.05);
        }
        .sidebar-profile-link {
          display: block;
          width: 100%;
          text-decoration: none;
          cursor: pointer;
        }
        .sidebar-user {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .user-info {
          flex: 1;
          overflow: hidden;
        }
        .profile-arrow {
          margin-left: auto;
          color: #a0aec0;
          transition: transform 0.2s;
        }
        .sidebar-footer:hover .profile-arrow {
          transform: translateX(4px);
          color: ${primaryColor};
        }
        .profile-avatar-img {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
        }
        .rs-sidebar.closed .sidebar-user {
          justify-content: center;
        }
        .rs-sidebar.closed .profile-arrow {
          display: none;
        }
        .rs-sidebar.closed .user-info {
          display: none;
        }
        .rs-sidebar.closed .sidebar-profile-link {
          display: flex;
          justify-content: center;
        }
        .rs-sidebar.closed .sidebar-user {
          gap: 0;
        }
        .rs-sidebar.closed .user-avatar {
          width: 40px !important;
          height: 40px !important;
          font-size: 18px !important;
        }
        .rs-sidebar.closed .user-avatar svg {
          width: 24px;
          height: 24px;
        }
        .rs-sidebar.closed .profile-avatar-img {
          width: 40px;
          height: 40px;
        }
        
        /* Navbar user avatar styles */
        .navbar-user .user-avatar {
          background: ${primaryColor} !important;
          color: #ffffff !important;
          width: 32px !important;
          height: 32px !important;
          border-radius: 50% !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-weight: bold !important;
          font-size: 14px !important;
        }
        .navbar-user .user-avatar img {
          width: 32px !important;
          height: 32px !important;
          border-radius: 50% !important;
          object-fit: cover !important;
        }
        .navbar-user .user-avatar svg {
          display: none !important;
        }
        .navbar-user .user-name {
          color: #ffffff !important;
          font-weight: 500 !important;
        }

        /* Notification & Calendar Styles */
        .notification-wrapper,
        .calendar-wrapper {
          position: relative;
          display: inline-block;
        }

        .notification-btn,
        .calendar-btn {
          position: relative;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: white;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .notification-btn:hover,
        .calendar-btn:hover {
          background: rgba(0, 212, 255, 0.2);
          border-color: ${primaryColor};
        }

        .notification-badge {
          position: absolute;
          top: -6px;
          right: -6px;
          background: #dc3545;
          color: white;
          font-size: 10px;
          font-weight: 700;
          min-width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          border: 2px solid #0a0a0a;
        }

        /* Notification Dropdown */
        .notification-dropdown,
        .calendar-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
          min-width: 320px;
          max-width: 400px;
          z-index: 1000;
          overflow: hidden;
          border: 1px solid rgba(0, 0, 0, 0.08);
          animation: slideDown 0.2s ease;
        }

        .calendar-dropdown {
          min-width: 340px;
          max-width: 380px;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .dropdown-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 18px;
          border-bottom: 1px solid #e2e8f0;
        }

        .dropdown-title {
          font-size: 0.95rem;
          font-weight: 600;
          color: #0a0a0a;
        }

        .mark-all-btn {
          font-size: 0.75rem;
          color: ${primaryColor};
          background: none;
          border: none;
          cursor: pointer;
          font-weight: 500;
          padding: 4px 8px;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .mark-all-btn:hover {
          background: rgba(0, 212, 255, 0.1);
        }

        .notification-list {
          max-height: 300px;
          overflow-y: auto;
        }

        .notification-list::-webkit-scrollbar {
          width: 4px;
        }

        .notification-list::-webkit-scrollbar-track {
          background: #f7fafc;
        }

        .notification-list::-webkit-scrollbar-thumb {
          background: #cbd5e0;
          border-radius: 4px;
        }

        .notification-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 18px;
          cursor: pointer;
          transition: background 0.2s;
          border-bottom: 1px solid #f7fafc;
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

        .notification-content {
          flex: 1;
        }

        .notification-title {
          font-size: 0.85rem;
          color: #0a0a0a;
          font-weight: 500;
        }

        .notification-time {
          font-size: 0.7rem;
          color: #a0aec0;
          margin-top: 2px;
        }

        .notification-dot {
          width: 8px;
          height: 8px;
          background: ${primaryColor};
          border-radius: 50%;
          flex-shrink: 0;
          margin-left: 10px;
        }

        .empty-notifications {
          padding: 30px 20px;
          text-align: center;
          color: #a0aec0;
        }

        .empty-notifications span {
          font-size: 2rem;
          display: block;
          margin-bottom: 8px;
        }

        .empty-notifications p {
          font-size: 0.9rem;
          margin: 0;
        }

        .dropdown-footer {
          padding: 10px 18px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
        }

        .view-all-btn {
          font-size: 0.8rem;
          color: ${primaryColor};
          background: none;
          border: none;
          cursor: pointer;
          font-weight: 500;
          padding: 6px 12px;
          border-radius: 4px;
          transition: background 0.2s;
        }

        .view-all-btn:hover {
          background: rgba(0, 212, 255, 0.1);
        }

        /* Calendar Styles */
        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 18px;
          border-bottom: 1px solid #e2e8f0;
        }

        .calendar-month {
          font-size: 0.95rem;
          font-weight: 600;
          color: #0a0a0a;
        }

        .calendar-nav {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          transition: background 0.2s;
          color: #4a5568;
          display: flex;
          align-items: center;
        }

        .calendar-nav:hover {
          background: #f7fafc;
        }

        .calendar-nav svg {
          width: 18px;
          height: 18px;
          stroke: #4a5568;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          padding: 10px 14px;
          gap: 2px;
        }

        .calendar-weekday {
          text-align: center;
          font-size: 0.7rem;
          font-weight: 600;
          color: #4a5568;
          padding: 6px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .calendar-day {
          text-align: center;
          padding: 6px 0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          position: relative;
          min-height: 40px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .calendar-day:hover {
          background: #f7fafc;
        }

        .calendar-day.empty {
          cursor: default;
        }

        .calendar-day.empty:hover {
          background: none;
        }

        .calendar-day.today {
          background: ${primaryColor};
          color: white;
        }

        .calendar-day.today .day-number {
          color: white;
        }

        .calendar-day.today:hover {
          background: ${primaryColor}dd;
        }

        .calendar-day .day-number {
          font-size: 0.8rem;
          font-weight: 500;
          color: #0a0a0a;
        }

        .calendar-day.has-event .day-number {
          font-weight: 700;
        }

        .calendar-day:not(.today) .day-number {
          color: #0a0a0a;
        }

        .event-indicators {
          display: flex;
          gap: 2px;
          margin-top: 2px;
        }

        .event-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          display: inline-block;
        }

        .calendar-footer {
          padding: 10px 18px;
          border-top: 1px solid #e2e8f0;
          text-align: center;
        }

        .today-date {
          font-size: 0.8rem;
          color: #0a0a0a;
          font-weight: 500;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .notification-dropdown,
          .calendar-dropdown {
            position: fixed;
            top: 70px;
            right: 10px;
            left: 10px;
            min-width: unset;
            max-width: unset;
            width: auto;
          }

          .notification-btn,
          .calendar-btn {
            padding: 6px 10px;
          }

          .navbar-right {
            gap: 8px;
          }

          .calendar-grid {
            padding: 8px 10px;
          }

          .calendar-day {
            min-height: 34px;
            padding: 4px 0;
          }
        }

        @media (max-width: 480px) {
          .notification-dropdown,
          .calendar-dropdown {
            right: 5px;
            left: 5px;
          }

          .calendar-day {
            min-height: 30px;
            font-size: 0.7rem;
          }
        }
      `}</style>
    </div>
  );
};

// Helper function for role badge class
function getRoleBadgeClass(role) {
  const roleMap = {
    'super_admin': 'badge-super-admin',
    'admin': 'badge-admin',
    'manager': 'badge-manager',
    'staff': 'badge-staff',
    'guest': 'badge-guest'
  };
  return roleMap[role?.toLowerCase()] || 'badge-guest';
}

export default MainLayout;