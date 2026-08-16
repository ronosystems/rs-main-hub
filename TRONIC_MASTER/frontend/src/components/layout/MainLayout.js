import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getMenuForRole } from '../../config/roles';
import './MainLayout.css';

const MainLayout = ({ children, title, breadcrumbs }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  // System Settings
  const [platformName, setPlatformName] = useState('TRONIC_MASTER');
  const [sidebarColor, setSidebarColor] = useState('#ffffff');
  const [companyLogo, setCompanyLogo] = useState(null);

  // ============================================
  // SEARCH BAR STATE
  // ============================================
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchRef = useRef(null);

  // ============================================
  // COMPANY SUPPORT MODE STATE
  // ============================================
  const [isLoginAs, setIsLoginAs] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [originalUser, setOriginalUser] = useState(null);
  const [showSupportBanner, setShowSupportBanner] = useState(true);

  const STATIC_URL = process.env.REACT_APP_STATIC_URL || 'http://localhost:5002';

  // ============================================
  // CHECK FOR SUPPORT MODE
  // ============================================
  useEffect(() => {
    console.log('🔍 === LOCALSTORAGE DEBUG ===');
    console.log('loginAsCompany:', localStorage.getItem('loginAsCompany'));
    console.log('companyName:', localStorage.getItem('companyName'));
    console.log('originalUser:', localStorage.getItem('originalUser'));
    console.log('userData:', localStorage.getItem('userData'));
    console.log('token:', localStorage.getItem('token'));
    console.log('===============================');
    
    const loginAsCompany = localStorage.getItem('loginAsCompany') === 'true';
    const name = localStorage.getItem('companyName');
    const originalUserData = localStorage.getItem('originalUser');
    
    const userData = localStorage.getItem('userData');
    let userDataLoginAs = false;
    let userNameFromData = '';
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        userDataLoginAs = parsed?.loginAs === true;
        userNameFromData = parsed?.company?.name || parsed?.companyName || '';
      } catch (e) {
        console.error('Error parsing userData:', e);
      }
    }
    
    const userLoginAs = user?.loginAs === true;
    
    const isSupportMode = loginAsCompany || userDataLoginAs || userLoginAs;
    const finalCompanyName = name || userNameFromData || (user?.company?.name) || '';
    
    console.log('🔍 Support Mode Check:', { 
      loginAsCompany, 
      name, 
      userDataLoginAs, 
      userLoginAs,
      isSupportMode,
      finalCompanyName,
      hasUser: !!user
    });
    
    if (isSupportMode && finalCompanyName) {
      console.log('✅ SUPPORT MODE DETECTED!');
      setIsLoginAs(true);
      setCompanyName(finalCompanyName);
      if (originalUserData) {
        try {
          const parsed = JSON.parse(originalUserData);
          setOriginalUser(parsed);
          console.log('✅ Original user:', parsed);
        } catch (e) {
          console.error('Error parsing original user:', e);
        }
      }
    } else {
      console.log('❌ No support mode detected');
      setIsLoginAs(false);
    }
  }, [user]);

  // ============================================
  // SEARCH FUNCTIONALITY
  // ============================================
  const handleSearch = (query) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    // Get current menu items
    const currentMenu = getMenuItems();
    
    // Search through menu items
    const results = currentMenu.filter(item => 
      item.label.toLowerCase().includes(query.toLowerCase()) ||
      item.path.toLowerCase().includes(query.toLowerCase())
    );
    
    setSearchResults(results);
    setShowSearchResults(results.length > 0);
  };

  const handleSearchResultClick = (path) => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    navigate(path);
  };

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut for search (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('global-search-input')?.focus();
      }
      if (e.key === 'Escape') {
        setShowSearchResults(false);
        document.getElementById('global-search-input')?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ============================================
  // RETURN TO ADMIN (Support Mode)
  // ============================================
  const handleReturnToAdmin = () => {
    console.log('🔄 Returning to MAIN HUB admin...');
    
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('user');
    localStorage.removeItem('companyName');
    localStorage.removeItem('companyId');
    localStorage.removeItem('loginAsCompany');
    localStorage.removeItem('originalToken');
    localStorage.removeItem('originalUser');
    localStorage.removeItem('companyData');
    localStorage.removeItem('loginAsInfo');
    
    window.location.href = 'http://localhost:3000/super-admin/dashboard';
  };

  const handleDismissSupportBanner = () => {
    setShowSupportBanner(false);
  };

  // ===== GET MENU BASED ON USER ROLE =====
  const getMenuItems = () => {
    if (!user) {
      return [
        { icon: 'Dashboard', label: 'Dashboard', path: '/' }
      ];
    }

    const role = user.companyRole || 'company_staff';
    const menu = getMenuForRole(role);
    
    const enhancedMenu = [];
    
    menu.forEach(item => {
      enhancedMenu.push(item);
      
      if (item.label === 'Products') {
        enhancedMenu.push(
          { icon: 'Electronics', label: 'Electronics', path: '/products/electronics' },
          { icon: 'Accessories', label: 'Accessories', path: '/products/accessories' }
        );
      }
    });
    
    return enhancedMenu;
  };

  const menuItems = getMenuItems();

  // ===== LOAD COMPANY LOGO FROM USER CONTEXT =====
  useEffect(() => {
    if (user?.company?.logo) {
      const logoUrl = user.company.logo.startsWith('http') 
        ? user.company.logo 
        : `${STATIC_URL}${user.company.logo}`;
      setCompanyLogo(logoUrl);
    } else {
      setCompanyLogo(null);
    }
  }, [user, STATIC_URL]);

  // ===== LOAD PLATFORM NAME FROM USER CONTEXT =====
  useEffect(() => {
    if (user?.company?.name) {
      setPlatformName(user.company.name);
    } else {
      setPlatformName('TRONIC_MASTER');
    }
  }, [user]);

  // Load settings from localStorage
  useEffect(() => {
    const savedSidebarColor = localStorage.getItem('tronicSidebarColor');
    if (savedSidebarColor) setSidebarColor(savedSidebarColor);
  }, []);

  // Listen for logo updates from Settings page
  useEffect(() => {
    const handleSettingsUpdated = (e) => {
      if (e.detail?.logo) {
        const logoUrl = e.detail.logo.startsWith('http') 
          ? e.detail.logo 
          : `${STATIC_URL}${e.detail.logo}`;
        setCompanyLogo(logoUrl);
      }
    };

    window.addEventListener('settingsUpdated', handleSettingsUpdated);
    return () => window.removeEventListener('settingsUpdated', handleSettingsUpdated);
  }, [STATIC_URL]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
    const isSupportMode = localStorage.getItem('loginAsCompany') === 'true';
    
    localStorage.removeItem('tronicCompanyLogo');
    localStorage.removeItem('tronicPlatformName');
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('user');
    localStorage.removeItem('companyName');
    localStorage.removeItem('companyId');
    localStorage.removeItem('loginAsCompany');
    localStorage.removeItem('originalToken');
    localStorage.removeItem('originalUser');
    localStorage.removeItem('companyData');
    localStorage.removeItem('loginAsInfo');
    
    logout();
    
    if (isSupportMode) {
      window.location.href = 'http://localhost:3000/super-admin/dashboard';
    } else {
      navigate('/login');
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const getUserDisplayName = () => {
    if (user?.name) return user.name;
    if (user?.email) return user.email.split('@')[0];
    return 'User';
  };

  const getCompanyName = () => {
    if (user?.company?.name) return user.company.name;
    return 'TRONIC_MASTER';
  };

  const getFullProfilePictureUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return `${STATIC_URL}${path}`;
  };

  const displayProfilePicture = user?.profilePicture ? getFullProfilePictureUrl(user.profilePicture) : null;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'GOOD MORNING';
    if (hour >= 12 && hour < 17) return 'GOOD AFTERNOON';
    if (hour >= 17 && hour < 21) return 'GOOD EVENING';
    return 'GOOD NIGHT';
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const sidebarStyle = {
    background: sidebarColor || '#ffffff',
    borderRight: '1px solid #e2e8f0'
  };

  const activeItemStyle = {
    background: `rgba(13, 110, 253, 0.1)`,
    color: '#0dc5fd',
    borderLeft: '3px solid #01070f'
  };

  // ===== SVG ICONS =====
  const Icons = {
    Dashboard: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
    POS: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2"/>
        <path d="M8 8h8"/>
        <path d="M8 12h6"/>
        <path d="M8 16h4"/>
        <path d="M17 16h.01"/>
      </svg>
    ),
    Branches: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
    Products: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
        <path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/>
      </svg>
    ),
    Phones: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
        <line x1="12" y1="18" x2="12.01" y2="18"/>
        <path d="M8 6h8"/>
      </svg>
    ),
    Electronics: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2" ry="2"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
        <line x1="8" y1="8" x2="10" y2="8"/>
        <line x1="14" y1="8" x2="16" y2="8"/>
        <line x1="8" y1="16" x2="16" y2="16"/>
        <path d="M4 4v16"/>
        <path d="M20 4v16"/>
      </svg>
    ),
    Accessories: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
        <path d="M12 22V7"/>
      </svg>
    ),
    Sales: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
      </svg>
    ),
    Reports: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
        <line x1="8" y1="8" x2="12" y2="8"/>
        <line x1="8" y1="16" x2="14" y2="16"/>
      </svg>
    ),
    Revenues: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/>
        <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>
        <path d="M7 12l2 2 2-2"/>
        <path d="M17 12l-2 2-2-2"/>
      </svg>
    ),
    Users: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87"/>
        <path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
    Roles: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
        <path d="M12 22V7"/>
        <path d="M7 10l5 2.5 5-2.5"/>
        <path d="M7 14l5 2.5 5-2.5"/>
      </svg>
    ),
    Profile: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
        <path d="M12 11v4"/>
        <path d="M10 13h4"/>
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
    ChevronRight: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6"/>
      </svg>
    ),
    ChevronDown: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    ),
    Logout: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
    ),
    Admin: () => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="M12 8v4"/>
        <path d="M12 16h.01"/>
      </svg>
    ),
    Manager: () => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 00-3-3.87"/>
        <path d="M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
    Cashier: () => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="2"/>
        <path d="M8 8h8"/>
        <path d="M8 12h6"/>
        <path d="M8 16h4"/>
      </svg>
    ),
    Agent: () => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    Staff: () => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    LogoutIcon: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
        <polyline points="16 17 21 12 16 7"/>
        <line x1="21" y1="12" x2="9" y2="12"/>
      </svg>
    ),
    ExternalLink: () => (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
        <polyline points="15 3 21 3 21 9"/>
        <line x1="10" y1="14" x2="21" y2="3"/>
      </svg>
    ),
    Support: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    UserIcon: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    HelpIcon: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
    ),
    ReturnIcon: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5"/>
        <path d="M12 19l-7-7 7-7"/>
      </svg>
    ),
    ExitIcon: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        <path d="M12 12v4"/>
        <path d="M15 15l-3-3-3 3"/>
      </svg>
    ),
    Search: () => (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    )
  };

  const companyNameDisplay = getCompanyName();

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

  const handleRSLinkClick = (e) => {
    e.preventDefault();
    navigate('/powered-by');
  };

  const handleSupportClick = () => {
    navigate('/support');
  };

  return (
    <div className="tm-layout">
      {/* ============================================ */}
      {/* COMPANY SUPPORT MODE BANNER */}
      {/* ============================================ */}
      {isLoginAs && showSupportBanner && (
        <div className="support-mode-banner" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '10px 20px',
          borderBottom: '3px solid #ffd700',
          boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)',
          position: 'sticky',
          top: 0,
          zIndex: 999,
          animation: 'slideDown 0.4s ease'
        }}>
          <div className="support-mode-content" style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            maxWidth: '1400px',
            margin: '0 auto'
          }}>
            <div className="support-mode-left" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              flex: 1
            }}>
              <div className="support-mode-icon" style={{
                fontSize: '24px',
                background: 'rgba(255,255,255,0.15)',
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                🆘
              </div>
              <div className="support-mode-info">
                <div className="support-mode-title" style={{
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  letterSpacing: '0.5px'
                }}>
                  Company Support Mode
                </div>
                <div className="support-mode-details" style={{
                  fontSize: '0.85rem',
                  opacity: 0.95
                }}>
                  Supporting <strong>{companyName}</strong>
                  {originalUser && (
                    <span className="support-original-user" style={{
                      opacity: 0.8,
                      fontSize: '0.9em',
                      marginLeft: '6px'
                    }}>
                      (acting on behalf of {originalUser.name})
                    </span>
                  )}
                </div>
                <div className="support-mode-badge" style={{
                  display: 'flex',
                  gap: '6px',
                  marginTop: '2px',
                  flexWrap: 'wrap'
                }}>
                  <span style={{
                    background: 'rgba(255, 215, 0, 0.25)',
                    border: '1px solid rgba(255, 215, 0, 0.4)',
                    padding: '1px 10px',
                    borderRadius: '10px',
                    fontSize: '0.6rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    🛡️ Super Admin
                  </span>
                  <span style={{
                    background: 'rgba(0, 255, 200, 0.2)',
                    border: '1px solid rgba(0, 255, 200, 0.3)',
                    padding: '1px 10px',
                    borderRadius: '10px',
                    fontSize: '0.6rem',
                    fontWeight: '600',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    🤝 Support Mode
                  </span>
                </div>
              </div>
            </div>
            <div className="support-mode-right" style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0,
              flexWrap: 'wrap'
            }}>
              <button 
                className="btn-exit-support" 
                onClick={handleReturnToAdmin}
                style={{
                  background: '#ff4757',
                  border: '2px solid #ff6b81',
                  color: 'white',
                  padding: '6px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '700',
                  transition: 'all 0.3s ease',
                  fontSize: '0.8rem',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 10px rgba(255, 71, 87, 0.3)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ff6b81';
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(255, 71, 87, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#ff4757';
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = '0 2px 10px rgba(255, 71, 87, 0.3)';
                }}
              >
                <Icons.ExitIcon />
                Exit Support Mode
              </button>
              <button 
                className="btn-return-admin" 
                onClick={handleReturnToAdmin}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: '2px solid rgba(255,255,255,0.3)',
                  color: 'white',
                  padding: '6px 14px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.3s ease',
                  fontSize: '0.8rem',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <Icons.ReturnIcon />
                Return to Admin
              </button>
              <button 
                className="btn-dismiss-banner" 
                onClick={handleDismissSupportBanner}
                title="Dismiss banner"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                  e.currentTarget.style.transform = 'rotate(90deg)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.transform = 'rotate(0deg)';
                }}
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP NAVBAR */}
      <nav className="tm-navbar" style={{ 
        background: 'linear-gradient(135deg, #0db1fd, #09b3e7)',
        borderBottom: '3px solid #01050c'
      }}>
        <div className="navbar-left">
          <button className="sidebar-toggle-btn" onClick={toggleSidebar}>
            <Icons.Menu />
          </button>
          <div className="navbar-brand">
            <div className="brand-logo" style={{ 
              border: '2px solid rgba(22, 2, 2, 0.93)',
              background: 'rgba(255,255,255,0.2)'
            }}>
              {companyLogo ? (
                <img 
                  src={companyLogo} 
                  alt={companyNameDisplay} 
                  className="company-logo-img"
                  style={{ 
                    width: '36px', 
                    height: '36px', 
                    borderRadius: '8px', 
                    objectFit: 'contain',
                    background: 'white',
                    padding: '2px'
                  }}
                />
              ) : (
                <span style={{ fontSize: '20px', fontWeight: 'bold', color: 'white' }}>
                  {companyNameDisplay.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <span className="brand-text" style={{ color: 'white', fontWeight: '700' }}>
              {isLoginAs ? '🔐 ' : ''}{companyNameDisplay}
            </span>
            {isLoginAs && (
              <span style={{
                background: 'rgba(255,215,0,0.3)',
                padding: '2px 10px',
                borderRadius: '12px',
                fontSize: '0.6rem',
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: '#ffd700',
                border: '1px solid rgba(255,215,0,0.3)',
                marginLeft: '8px'
              }}>
                Support
              </span>
            )}
          </div>
        </div>

        <div className="navbar-center">
          <span className="navbar-title">{title || 'Dashboard'}</span>
        </div>

        <div className="navbar-right">
          {/* ============================================ */}
          {/* SEARCH BAR */}
          {/* ============================================ */}
          <div className="navbar-search" ref={searchRef}>
            <div className="search-wrapper">
              <Icons.Search />
              <input
                id="global-search-input"
                type="text"
                placeholder="Search pages... (Ctrl+K)"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => {
                  if (searchQuery.trim()) {
                    setShowSearchResults(searchResults.length > 0);
                  }
                }}
                className="global-search-input"
              />
              <span className="search-shortcut">⌘K</span>
            </div>
            
            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div className="search-results-dropdown">
                {searchResults.length > 0 ? (
                  <ul className="search-results-list">
                    {searchResults.map((item, index) => (
                      <li 
                        key={index}
                        className="search-result-item"
                        onClick={() => handleSearchResultClick(item.path)}
                      >
                        <span className="search-result-icon">
                          {Icons[item.icon] ? Icons[item.icon]() : '📄'}
                        </span>
                        <span className="search-result-label">{item.label}</span>
                        <span className="search-result-path">{item.path}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="search-no-results">
                    <span>🔍</span>
                    <p>No results found for "{searchQuery}"</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="navbar-user-dropdown" ref={dropdownRef}>
            <button 
              className="user-dropdown-btn"
              onClick={toggleDropdown}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '50px',
                padding: '4px 12px 4px 4px',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                color: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
              }}
            >
              <span className="user-avatar" style={{ 
                background: 'rgb(247, 119, 0)',
                color: '#ffffff',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '14px',
                overflow: 'hidden',
                border: '2px solid rgba(14, 1, 1, 0.95)'
              }}>
                {displayProfilePicture ? (
                  <img 
                    src={displayProfilePicture} 
                    alt={user?.name || 'User'} 
                    style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      objectFit: 'cover' 
                    }}
                  />
                ) : (
                  user?.name?.charAt(0)?.toUpperCase() || 'U'
                )}
              </span>
              <span className="user-name-display" style={{ 
                fontSize: '13px', 
                fontWeight: '500',
                color: 'white'
              }}>
                {getUserDisplayName()}
              </span>
              <Icons.ChevronDown />
            </button>

            {dropdownOpen && (
              <div className="user-dropdown-menu" style={{
                position: 'absolute',
                top: 'calc(100% + 8px)',
                right: '0',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
                minWidth: '220px',
                padding: '8px',
                zIndex: 1000,
                border: '1px solid #e9ecef'
              }}>
                <div className="dropdown-user-info" style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid #e9ecef',
                  marginBottom: '4px'
                }}>
                  <div style={{ fontWeight: '600', color: '#1a1a2e' }}>
                    {user?.name || 'User'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>
                    {user?.email || ''}
                  </div>
                  <div style={{ fontSize: '11px', color: '#6c757d', marginTop: '4px' }}>
                    <span className="role-badge" style={{
                      display: 'inline-block',
                      padding: '2px 10px',
                      background: '#e9ecef',
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: '#495057'
                    }}>
                      {getCompanyRoleDisplay(user?.companyRole)}
                    </span>
                  </div>
                  {isLoginAs && (
                    <div style={{
                      fontSize: '10px',
                      color: '#667eea',
                      marginTop: '4px',
                      fontWeight: '600'
                    }}>
                      🆘 Support Mode
                    </div>
                  )}
                </div>

                <Link 
                  to="/profile" 
                  className="dropdown-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 16px',
                    color: '#1a1a2e',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    transition: 'background 0.2s',
                    fontSize: '14px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  onClick={() => setDropdownOpen(false)}
                >
                  <Icons.UserIcon />
                  <span>Profile</span>
                </Link>

                <Link 
                  to="/support" 
                  className="dropdown-item"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 16px',
                    color: '#000000',
                    textDecoration: 'none',
                    borderRadius: '8px',
                    transition: 'background 0.2s',
                    fontSize: '14px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#ffffff'}
                  onClick={() => setDropdownOpen(false)}
                >
                  <Icons.HelpIcon />
                  <span>Support</span>
                </Link>

                <div style={{ borderTop: '1px solid #e9ecef', margin: '4px 0' }} />

                <button 
                  className="dropdown-item logout-btn"
                  onClick={handleLogout}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 16px',
                    color: '#ffffff',
                    background: '#ff0000',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    fontSize: '14px',
                    width: '100%',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#03742e'}
                  onMouseLeave={(e) => e.currentTarget.style.background = '#ff0000'}
                >
                  <Icons.LogoutIcon />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* SIDEBAR */}
      <aside className={`tm-sidebar ${sidebarOpen ? 'open' : 'closed'}`} style={sidebarStyle}>
        <div className="sidebar-header" style={{ borderBottom: '1px solid #e2e8f0' }}>
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
                {isLoginAs && (
                  <div style={{
                    fontSize: '0.65rem',
                    background: '#e8f0fe',
                    padding: '2px 12px',
                    borderRadius: '12px',
                    color: '#667eea',
                    fontWeight: '600',
                    marginTop: '4px',
                    border: '1px solid rgba(102, 126, 234, 0.2)'
                  }}>
                    🆘 Support Mode
                  </div>
                )}
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
                className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
                style={isActive(item.path) ? activeItemStyle : {}}
              >
                <span className="sidebar-icon">
                  {IconComponent && <IconComponent />}
                </span>
                {sidebarOpen && <span className="sidebar-label">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer" style={{ borderTop: '1px solid #e2e8f0' }}>
          <button 
            className="sidebar-support-btn" 
            onClick={handleSupportClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              width: '100%',
              padding: '10px 16px',
              marginTop: '4px',
              background: '#e3f2fd',
              border: 'none',
              borderRadius: '8px',
              color: '#0d6efd',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#bbdefb';
              e.currentTarget.style.transform = 'scale(1.02)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#e3f2fd';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            <Icons.Support />
            <span>Help & Support</span>
          </button>
        </div>
      </aside>

      {isMobile && sidebarOpen && (
        <div className="sidebar-overlay" onClick={toggleSidebar}></div>
      )}

      <main className={`tm-main ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="tm-content-header" style={{ 
          borderBottom: '2px solid #000103',
          boxShadow: '0 1px 3px rgba(14, 2, 2, 0.94)'
        }}>
          <div className="header-left">
            <h1 className="header-title">
              {isLoginAs && <span style={{ marginRight: '8px' }}>🛠️</span>}
              {title || 'Dashboard'}
            </h1>
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
        </div>

        <div className="tm-content-body">
          {children}
        </div>

        <footer className="tm-footer" style={{ 
          borderTop: '2px solid #010813',
          background: '#ffffff'
        }}>
          <div className="footer-left">
            <span>© {new Date().getFullYear()} {platformName}</span>
            <span className="footer-separator">|</span>
            <span>All Rights Reserved</span>
          </div>
          <div className="footer-right">
            <span>Version 1.0</span>
            <span className="footer-separator">|</span>
            <button
              onClick={handleRSLinkClick}
              className="rs-link-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                color: '#4a6cf7',
                textDecoration: 'none',
                fontWeight: '600',
                fontSize: '13px',
                transition: 'all 0.3s ease',
                padding: '4px 8px',
                borderRadius: '4px',
                cursor: 'pointer',
                background: 'transparent',
                border: 'none',
                fontFamily: 'inherit'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#eef4ff';
                e.currentTarget.style.transform = 'scale(1.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <Icons.ExternalLink />
              <span>Powered By RS Africa</span>
            </button>
          </div>
        </footer>
      </main>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* ============================================ */
        /* SEARCH BAR STYLES */
        /* ============================================ */
        .navbar-search {
          position: relative;
          margin-right: 16px;
        }

        .search-wrapper {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(15, 0, 0, 0.98);
          border-radius: 8px;
          padding: 4px 12px;
          transition: all 0.3s ease;
          min-width: 200px;
        }

        .search-wrapper:focus-within {
          background: rgba(255, 255, 255, 0.25);
          border-color: rgba(7, 0, 0, 0.99);
          box-shadow: 0 0 0 3px rgba(12, 0, 0, 0.98);
        }

        .search-wrapper svg {
          width: 16px;
          height: 16px;
          stroke: rgba(255, 255, 255, 0.6);
          flex-shrink: 0;
        }

        .global-search-input {
          background: transparent;
          border: none;
          outline: none;
          color: white;
          padding: 6px 10px;
          font-size: 13px;
          width: 100%;
          min-width: 140px;
        }

        .global-search-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .search-shortcut {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.4);
          background: rgba(255, 255, 255, 0.1);
          padding: 2px 6px;
          border-radius: 4px;
          flex-shrink: 0;
          font-weight: 600;
        }

        .search-results-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          left: 0;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 30px rgba(7, 0, 0, 0.98);
          min-width: 320px;
          max-height: 400px;
          overflow-y: auto;
          z-index: 1000;
          border: 1px solid #e9ecef;
        }

        .search-results-list {
          list-style: none;
          margin: 0;
          padding: 6px;
        }

        .search-result-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          border-radius: 8px;
          cursor: pointer;
          transition: background 0.2s ease;
          color: #1a1a2e;
        }

        .search-result-item:hover {
          background: #f0f4ff;
        }

        .search-result-icon {
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #f0f4ff;
          border-radius: 6px;
          flex-shrink: 0;
        }

        .search-result-icon svg {
          width: 16px;
          height: 16px;
          stroke: #4a6cf7;
        }

        .search-result-label {
          font-weight: 500;
          font-size: 14px;
          flex: 1;
        }

        .search-result-path {
          font-size: 11px;
          color: #a0aec0;
          font-family: monospace;
        }

        .search-no-results {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 30px 20px;
          color: #718096;
        }

        .search-no-results span {
          font-size: 32px;
          margin-bottom: 8px;
        }

        .search-no-results p {
          margin: 0;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .navbar-search {
            display: none;
          }
          
          .support-mode-content {
            flex-direction: column;
            align-items: stretch !important;
          }
          .support-mode-left {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          .support-mode-badge {
            justify-content: center;
          }
          .support-mode-right {
            justify-content: center;
            flex-wrap: wrap;
          }
          .btn-exit-support,
          .btn-return-admin {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};

export default MainLayout;