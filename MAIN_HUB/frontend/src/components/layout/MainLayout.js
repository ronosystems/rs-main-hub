import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './MainLayout.css';

const MainLayout = ({ children, title, breadcrumbs }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  
  // Dropdown refs
  const userDropdownRef = useRef(null);
  const notificationRef = useRef(null);
  const calendarRef = useRef(null);
  
  // Dropdown states
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  
  // System Settings
  const [systemLogo, setSystemLogo] = useState(null);
  const [platformName, setPlatformName] = useState('RONOSYSTEMS HUB');
  const [primaryColor, setPrimaryColor] = useState('#00d4ff');
  const [sidebarColor, setSidebarColor] = useState('#0a0a0a');

  // Notification and Calendar states
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState([]);

  const API_URL = 'https://main-hub-api-ea52e89c5128.herokuapp.com/api';
  const STATIC_URL = 'https://main-hub-api-ea52e89c5128.herokuapp.com';

  // Update CSS variables when colors change
  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', primaryColor);
    document.documentElement.style.setProperty('--sidebar-color', sidebarColor);
    const rgb = hexToRgb(primaryColor);
    document.documentElement.style.setProperty('--primary-rgb', rgb);
  }, [primaryColor, sidebarColor]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
        setShowUserDropdown(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (calendarRef.current && !calendarRef.current.contains(e.target)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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

            localStorage.setItem('platformName', settings.platformName || 'RONOSYSTEMS HUB');
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

  // Fetch real notifications from the backend
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
  }, [user, API_URL]);

  // Fetch real calendar events
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
    setShowUserDropdown(false);
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
    setShowUserDropdown(false);
  };

  // Toggle calendar dropdown
  const toggleCalendar = (e) => {
    e.stopPropagation();
    setShowCalendar(!showCalendar);
    setShowNotifications(false);
    setShowUserDropdown(false);
  };

  // Toggle user dropdown
  const toggleUserDropdown = () => {
    setShowUserDropdown(!showUserDropdown);
    setShowNotifications(false);
    setShowCalendar(false);
  };

  // Mark notification as read
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

  // Mark all as read
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
    ),
    ChevronDown: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    ),
    Profile: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    Help: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    )
  };

  // Hardcoded menu items based on role
  const getMenuItems = () => {
    const role = user?.role?.toLowerCase();
    
    const roleMenus = {
      super_admin: [
        { icon: 'Dashboard', label: 'Dashboard', path: '/super-admin/dashboard' },
        { icon: 'Projects', label: 'Projects', path: '/super-admin/projects' },
        { icon: 'Companies', label: 'Companies', path: '/super-admin/companies' },
        { icon: 'Plans', label: 'Plans', path: '/super-admin/plans' },
        { icon: 'Users', label: 'Users', path: '/super-admin/users' },
        { icon: 'Roles', label: 'Roles', path: '/super-admin/roles' },
        { icon: 'Reports', label: 'Reports', path: '/super-admin/reports' },
        { icon: 'Settings', label: 'Settings', path: '/settings' }
      ],
      admin: [
        { icon: 'Dashboard', label: 'Dashboard', path: '/admin/dashboard' },
        { icon: 'Projects', label: 'Projects', path: '/admin/projects' },
        { icon: 'Companies', label: 'Companies', path: '/admin/companies' },
        { icon: 'Plans', label: 'Plans', path: '/admin/plans' },
        { icon: 'Users', label: 'Users', path: '/admin/users' },
        { icon: 'Reports', label: 'Reports', path: '/admin/reports' }
      ],
      manager: [
        { icon: 'Dashboard', label: 'Dashboard', path: '/manager/dashboard' },
        { icon: 'Projects', label: 'Projects', path: '/manager/projects' },
        { icon: 'Companies', label: 'Companies', path: '/manager/companies' },
        { icon: 'Users', label: 'Users', path: '/manager/users' },
        { icon: 'Reports', label: 'Reports', path: '/manager/reports' }
      ],
      staff: [
        { icon: 'Dashboard', label: 'Dashboard', path: '/staff/dashboard' },
        { icon: 'Projects', label: 'Projects', path: '/staff/projects' },
        { icon: 'Companies', label: 'Companies', path: '/staff/companies' }
      ]
    };

    const defaultMenu = [
      { icon: 'Dashboard', label: 'Dashboard', path: '/dashboard' }
    ];

    return roleMenus[role] || defaultMenu;
  };

  const menuItems = getMenuItems();

  function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
      `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : 
      '0, 212, 255';
  }

  const getUserDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  return (
    <div className="rs-layout">
      {/* ========== FIXED TOP NAVBAR ========== */}
      <nav className="rs-navbar">
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

        <div className="navbar-right">

          {/* ========== NOTIFICATION BUTTON ========== */}
          <div className="notification-wrapper" ref={notificationRef}>
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

          {/* ========== CALENDAR BUTTON ========== */}
          <div className="calendar-wrapper" ref={calendarRef}>
            <button 
              className="header-btn calendar-btn" 
              onClick={toggleCalendar}
              title="Calendar"
            >
              <Icons.Calendar />
            </button>
            
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

          {/* ========== USER DROPDOWN ========== */}
          <div className="navbar-user-dropdown" ref={userDropdownRef}>
            <button 
              className="user-dropdown-btn"
              onClick={toggleUserDropdown}
            >
              <span className="user-avatar">
                {displayProfilePicture ? (
                  <img 
                    src={displayProfilePicture} 
                    alt={user?.name || 'User'} 
                  />
                ) : (
                  <span>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                )}
              </span>
              <span className="user-name">
                {user?.name || 'Admin'}
              </span>
              <span className={`user-role ${getRoleBadgeClass(user?.role)}`}>
                {user?.role || 'User'}
              </span>
              <Icons.ChevronDown />
            </button>

            {showUserDropdown && (
              <div className="user-dropdown-menu">
                <div className="dropdown-user-info">
                  <div className="dropdown-user-name">{user?.name || 'User'}</div>
                  <div className="dropdown-user-email">{user?.email || ''}</div>
                  <div className="dropdown-user-role">
                    <span className={`role-badge ${getRoleBadgeClass(user?.role)}`}>
                      {user?.role || 'User'}
                    </span>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <Link 
                  to="/profile" 
                  className="dropdown-item"
                  onClick={() => setShowUserDropdown(false)}
                >
                  <Icons.Profile />
                  <span>Profile</span>
                </Link>
                <Link 
                  to="/support" 
                  className="dropdown-item"
                  onClick={() => setShowUserDropdown(false)}
                >
                  <Icons.Help />
                  <span>Help</span>
                </Link>
                <div className="dropdown-divider"></div>
                <button 
                  className="dropdown-item dropdown-logout"
                  onClick={handleLogout}
                >
                  <Icons.Logout />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </nav>

      {/* ========== FIXED SIDEBAR ========== */}
      <aside className={`rs-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="welcome-sidebar-header">
              <span className="welcome-icon-header">
                <Icons.Welcome />
              </span>
              <div className="welcome-text-container">
                <div className="welcome-greeting">
                  {getGreeting()}
                </div>
                <div className="welcome-name">
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
          >
            <div className="sidebar-user">
              <span className="user-avatar">
                {displayProfilePicture ? (
                  <img 
                    src={displayProfilePicture} 
                    alt={user?.name || 'User'} 
                  />
                ) : (
                  <span>{user?.name?.charAt(0)?.toUpperCase() || 'U'}</span>
                )}
              </span>
              {sidebarOpen && (
                <div className="user-info">
                  <div className="user-name">
                    {user?.name || 'Admin'}
                  </div>
                  <div className="user-role">
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
        <div className="rs-content-header">
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
            {/* Buttons removed - they are in navbar */}
          </div>
        </div>

        <div className="rs-content-body">
          {children}
        </div>

        <footer className="rs-footer">
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
    </div>
  );
};

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