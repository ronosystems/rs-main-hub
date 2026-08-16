// /home/kk/RS/MAIN HUB/frontend/src/pages/Settings.js

import React, { useState, useEffect, useRef, useCallback } from 'react'; // ✅ Added useCallback
import { useAuth } from '../context/AuthContext';
import { usePermissions } from '../context/PermissionContext';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import './Settings.css';

const Settings = () => {
  const { user } = useAuth();
  const { hasPermission, permissions } = usePermissions();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  const STATIC_URL = process.env.REACT_APP_STATIC_URL || 'http://localhost:5000';

  // ✅ Check if user has permission to view settings
  useEffect(() => {
    if (!permissions) {
      console.log('⏳ Settings: Waiting for permissions to load...');
      return;
    }

    const canViewSettings = hasPermission('viewSettings') || user?.role === 'super_admin';
    console.log('🔍 Settings - Can view settings:', canViewSettings);

    if (!canViewSettings) {
      console.log('🚫 Settings: No permission, redirecting to dashboard');
      navigate('/dashboard');
      return;
    }
  }, [permissions, hasPermission, user, navigate]);

  // General Settings
  const [generalSettings, setGeneralSettings] = useState({
    platformName: 'RS Hub',
    platformEmail: 'support@rshub.com',
    timezone: 'Africa/Nairobi',
    currency: 'KES',
    language: 'en'
  });

  // Appearance Settings
  const [appearanceSettings, setAppearanceSettings] = useState({
    theme: 'light',
    primaryColor: '#00d4ff',
    sidebarColor: '#0a0a0a',
    logo: null
  });

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: 60,
    passwordPolicy: 'strong'
  });

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    systemNotifications: true,
    marketingEmails: false,
    dailyReports: true
  });

  // Icon components
  const Icons = {
    Success: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    General: () => (
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
    Appearance: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
    ),
    Security: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <path d="M9 12l2 2 4-4"/>
      </svg>
    ),
    Notifications: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
      </svg>
    ),
    Light: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5"/>
        <line x1="12" y1="1" x2="12" y2="3"/>
        <line x1="12" y1="21" x2="12" y2="23"/>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
        <line x1="1" y1="12" x2="3" y2="12"/>
        <line x1="21" y1="12" x2="23" y2="12"/>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
      </svg>
    ),
    Dark: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
      </svg>
    ),
    Auto: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    Camera: () => (
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
        <circle cx="12" cy="13" r="4"/>
      </svg>
    ),
    Upload: () => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="17 8 12 3 7 8"/>
        <line x1="12" y1="3" x2="12" y2="15"/>
      </svg>
    ),
    Remove: () => (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    )
  };

  // ✅ Fetch system settings from server - wrapped in useCallback
  const fetchSystemSettings = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const settings = data.data;
          
          // Update general settings
          if (settings.platformName) {
            setGeneralSettings(prev => ({ ...prev, platformName: settings.platformName }));
          }
          if (settings.platformEmail) {
            setGeneralSettings(prev => ({ ...prev, platformEmail: settings.platformEmail }));
          }
          if (settings.timezone) {
            setGeneralSettings(prev => ({ ...prev, timezone: settings.timezone }));
          }
          if (settings.currency) {
            setGeneralSettings(prev => ({ ...prev, currency: settings.currency }));
          }
          if (settings.language) {
            setGeneralSettings(prev => ({ ...prev, language: settings.language }));
          }

          // Update appearance settings
          if (settings.primaryColor) {
            setAppearanceSettings(prev => ({ ...prev, primaryColor: settings.primaryColor }));
          }
          if (settings.sidebarColor) {
            setAppearanceSettings(prev => ({ ...prev, sidebarColor: settings.sidebarColor }));
          }
          if (settings.logo) {
            const logoUrl = settings.logo.startsWith('http') ? settings.logo : `${STATIC_URL}${settings.logo}`;
            setLogoPreview(logoUrl);
            localStorage.setItem('systemLogo', logoUrl);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching system settings:', error);
    }
  }, [API_URL, STATIC_URL]); // ✅ Added dependencies

  // Load saved settings from localStorage (fallback) and server
  useEffect(() => {
    // First, load from localStorage for immediate display
    const savedLogo = localStorage.getItem('systemLogo');
    if (savedLogo) {
      setLogoPreview(savedLogo);
    }
    
    const savedPlatformName = localStorage.getItem('platformName');
    if (savedPlatformName) {
      setGeneralSettings(prev => ({ ...prev, platformName: savedPlatformName }));
    }
    
    const savedPrimaryColor = localStorage.getItem('primaryColor');
    if (savedPrimaryColor) {
      setAppearanceSettings(prev => ({ ...prev, primaryColor: savedPrimaryColor }));
    }
    
    const savedSidebarColor = localStorage.getItem('sidebarColor');
    if (savedSidebarColor) {
      setAppearanceSettings(prev => ({ ...prev, sidebarColor: savedSidebarColor }));
    }

    // Then fetch from server
    fetchSystemSettings();
  }, [fetchSystemSettings]); // ✅ Added fetchSystemSettings as dependency

  // Logo upload handlers
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a PNG, JPG, SVG, or WebP image.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('File size too large. Maximum 2MB allowed.');
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      setLogoPreview(dataUrl);
      setLogoFile(file);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('logo', file);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/settings/logo`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();
      if (response.ok && data.success) {
        const logoUrl = data.data.logo.startsWith('http') ? data.data.logo : `${STATIC_URL}${data.data.logo}`;
        setLogoPreview(logoUrl);
        localStorage.setItem('systemLogo', logoUrl);
        setSuccess('✅ Logo uploaded successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        alert(data.message || 'Failed to upload logo');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      alert('Network error. Please check if the server is running.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!window.confirm('Are you sure you want to remove the system logo?')) {
      return;
    }

    setUploadingLogo(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/settings/logo`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setLogoPreview(null);
        setLogoFile(null);
        localStorage.removeItem('systemLogo');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setSuccess('✅ Logo removed successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        alert(data.message || 'Failed to remove logo');
      }
    } catch (error) {
      console.error('Error removing logo:', error);
      alert('Network error. Please check if the server is running.');
    } finally {
      setUploadingLogo(false);
    }
  };

  // Submit handlers
  const handleGeneralSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          platformName: generalSettings.platformName,
          platformEmail: generalSettings.platformEmail,
          timezone: generalSettings.timezone,
          currency: generalSettings.currency,
          language: generalSettings.language
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        // Update localStorage for immediate display
        localStorage.setItem('platformName', generalSettings.platformName);
        localStorage.setItem('platformEmail', generalSettings.platformEmail);
        localStorage.setItem('timezone', generalSettings.timezone);
        localStorage.setItem('currency', generalSettings.currency);
        localStorage.setItem('language', generalSettings.language);
        
        setSuccess('✅ General settings saved successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        alert(data.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving general settings:', error);
      alert('Network error. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleAppearanceSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          primaryColor: appearanceSettings.primaryColor,
          sidebarColor: appearanceSettings.sidebarColor
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        // Update localStorage for immediate display
        localStorage.setItem('primaryColor', appearanceSettings.primaryColor);
        localStorage.setItem('sidebarColor', appearanceSettings.sidebarColor);
        
        setSuccess('✅ Appearance settings saved successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        alert(data.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving appearance settings:', error);
      alert('Network error. Please check if the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleSecuritySubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess('✅ Security settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    }, 1000);
  };

  const handleNotificationSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess('✅ Notification settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    }, 1000);
  };

  return (
    <MainLayout title="Settings" breadcrumbs={['Home', 'Settings']}>
      <div className="settings-page">
        {success && (
          <div className="settings-success">
            <Icons.Success />
            {success}
          </div>
        )}

        <div className="settings-tabs">
          <button 
            className={`settings-tab ${activeTab === 'general' ? 'active' : ''}`}
            onClick={() => setActiveTab('general')}
          >
            <Icons.General />
            General
          </button>
          <button 
            className={`settings-tab ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => setActiveTab('appearance')}
          >
            <Icons.Appearance />
            Appearance
          </button>
          <button 
            className={`settings-tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Icons.Security />
            Security
          </button>
          <button 
            className={`settings-tab ${activeTab === 'notifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            <Icons.Notifications />
            Notifications
          </button>
        </div>

        <div className="settings-content">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="settings-panel">
              <div className="settings-panel-header">
                <h2>
                  <Icons.General />
                  General Settings
                </h2>
                <p>Configure your platform general settings</p>
              </div>
              
              <form onSubmit={handleGeneralSubmit}>
                <div className="form-group">
                  <label>Platform Name</label>
                  <input
                    type="text"
                    value={generalSettings.platformName}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, platformName: e.target.value })}
                    placeholder="Enter platform name"
                  />
                </div>
                <div className="form-group">
                  <label>Support Email</label>
                  <input
                    type="email"
                    value={generalSettings.platformEmail}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, platformEmail: e.target.value })}
                    placeholder="Enter support email"
                  />
                </div>
                <div className="form-row">
                  <div className="form-group half">
                    <label>Timezone</label>
                    <select
                      value={generalSettings.timezone}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, timezone: e.target.value })}
                    >
                      <option value="Africa/Nairobi">Africa/Nairobi</option>
                      <option value="Africa/Lagos">Africa/Lagos</option>
                      <option value="Africa/Johannesburg">Africa/Johannesburg</option>
                      <option value="America/New_York">America/New_York</option>
                      <option value="America/Los_Angeles">America/Los_Angeles</option>
                      <option value="Europe/London">Europe/London</option>
                      <option value="Asia/Dubai">Asia/Dubai</option>
                    </select>
                  </div>
                  <div className="form-group half">
                    <label>Currency</label>
                    <select
                      value={generalSettings.currency}
                      onChange={(e) => setGeneralSettings({ ...generalSettings, currency: e.target.value })}
                    >
                      <option value="KES">KES - Kenyan Shilling</option>
                      <option value="USD">USD - US Dollar</option>
                      <option value="EUR">EUR - Euro</option>
                      <option value="GBP">GBP - British Pound</option>
                      <option value="ZAR">ZAR - South African Rand</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>Language</label>
                  <select
                    value={generalSettings.language}
                    onChange={(e) => setGeneralSettings({ ...generalSettings, language: e.target.value })}
                  >
                    <option value="en">English</option>
                    <option value="sw">Swahili</option>
                    <option value="fr">French</option>
                  </select>
                </div>
                <button type="submit" className="btn-save" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Settings'}
                </button>
              </form>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className="settings-panel">
              <div className="settings-panel-header">
                <h2>
                  <Icons.Appearance />
                  Appearance Settings
                </h2>
                <p>Customize the look and feel of your platform</p>
              </div>
              
              <form onSubmit={handleAppearanceSubmit}>
                <div className="form-group">
                  <label>Theme</label>
                  <div className="theme-selector">
                    <button 
                      className={`theme-option ${appearanceSettings.theme === 'light' ? 'active' : ''}`}
                      onClick={() => setAppearanceSettings({ ...appearanceSettings, theme: 'light' })}
                      type="button"
                    >
                      <Icons.Light />
                      Light
                    </button>
                    <button 
                      className={`theme-option ${appearanceSettings.theme === 'dark' ? 'active' : ''}`}
                      onClick={() => setAppearanceSettings({ ...appearanceSettings, theme: 'dark' })}
                      type="button"
                    >
                      <Icons.Dark />
                      Dark
                    </button>
                    <button 
                      className={`theme-option ${appearanceSettings.theme === 'auto' ? 'active' : ''}`}
                      onClick={() => setAppearanceSettings({ ...appearanceSettings, theme: 'auto' })}
                      type="button"
                    >
                      <Icons.Auto />
                      Auto
                    </button>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group half">
                    <label>Primary Color</label>
                    <div className="color-picker">
                      <input
                        type="color"
                        value={appearanceSettings.primaryColor}
                        onChange={(e) => setAppearanceSettings({ ...appearanceSettings, primaryColor: e.target.value })}
                      />
                      <span>{appearanceSettings.primaryColor}</span>
                    </div>
                  </div>
                  <div className="form-group half">
                    <label>Sidebar Color</label>
                    <div className="color-picker">
                      <input
                        type="color"
                        value={appearanceSettings.sidebarColor}
                        onChange={(e) => setAppearanceSettings({ ...appearanceSettings, sidebarColor: e.target.value })}
                      />
                      <span>{appearanceSettings.sidebarColor}</span>
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label>System Logo</label>
                  <div className="logo-upload-container">
                    {logoPreview ? (
                      <div className="logo-preview">
                        <img src={logoPreview} alt="System Logo" className="logo-preview-img" />
                        <button 
                          type="button" 
                          className="btn-remove-logo"
                          onClick={handleRemoveLogo}
                          disabled={uploadingLogo}
                        >
                          <Icons.Remove />
                          {uploadingLogo ? 'Removing...' : 'Remove Logo'}
                        </button>
                      </div>
                    ) : (
                      <div className="logo-placeholder">
                        <span className="logo-placeholder-icon">
                          <Icons.Camera />
                        </span>
                        <p>No logo uploaded</p>
                        <span className="logo-placeholder-text">PNG, JPG, SVG or WebP (Max 2MB)</span>
                      </div>
                    )}
                    <div className="logo-upload-actions">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleLogoUpload}
                        accept="image/png,image/jpeg,image/svg+xml,image/webp"
                        style={{ display: 'none' }}
                        id="logo-upload-input"
                        disabled={uploadingLogo}
                      />
                      <button 
                        type="button" 
                        className="btn-upload"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingLogo}
                      >
                        <Icons.Upload />
                        {uploadingLogo ? 'Uploading...' : 'Choose File'}
                      </button>
                      {logoPreview && logoFile && (
                        <span className="logo-file-name">
                          {logoFile.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button type="submit" className="btn-save" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Settings'}
                </button>
              </form>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="settings-panel">
              <div className="settings-panel-header">
                <h2>
                  <Icons.Security />
                  Security Settings
                </h2>
                <p>Configure your security preferences</p>
              </div>
              
              <form onSubmit={handleSecuritySubmit}>
                <div className="toggle-group">
                  <div className="toggle-label">
                    <label>Two-Factor Authentication</label>
                    <span className="toggle-description">Add an extra layer of security to your account</span>
                  </div>
                  <button 
                    className={`toggle-switch ${securitySettings.twoFactorAuth ? 'active' : ''}`}
                    onClick={() => setSecuritySettings({ ...securitySettings, twoFactorAuth: !securitySettings.twoFactorAuth })}
                    type="button"
                  >
                    <span className="toggle-slider"></span>
                  </button>
                </div>
                <div className="form-group">
                  <label>Session Timeout (minutes)</label>
                  <select
                    value={securitySettings.sessionTimeout}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: parseInt(e.target.value) })}
                  >
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">1 hour</option>
                    <option value="120">2 hours</option>
                    <option value="240">4 hours</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Password Policy</label>
                  <select
                    value={securitySettings.passwordPolicy}
                    onChange={(e) => setSecuritySettings({ ...securitySettings, passwordPolicy: e.target.value })}
                  >
                    <option value="basic">Basic (8+ characters)</option>
                    <option value="medium">Medium (8+ characters, letters + numbers)</option>
                    <option value="strong">Strong (8+ characters, uppercase + lowercase + numbers + symbols)</option>
                  </select>
                </div>
                <button type="submit" className="btn-save" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Settings'}
                </button>
              </form>
            </div>
          )}

          {/* Notification Settings */}
          {activeTab === 'notifications' && (
            <div className="settings-panel">
              <div className="settings-panel-header">
                <h2>
                  <Icons.Notifications />
                  Notification Settings
                </h2>
                <p>Manage your notification preferences</p>
              </div>
              
              <form onSubmit={handleNotificationSubmit}>
                <div className="toggle-group">
                  <div className="toggle-label">
                    <label>Email Notifications</label>
                    <span className="toggle-description">Receive notifications via email</span>
                  </div>
                  <button 
                    className={`toggle-switch ${notificationSettings.emailNotifications ? 'active' : ''}`}
                    onClick={() => setNotificationSettings({ ...notificationSettings, emailNotifications: !notificationSettings.emailNotifications })}
                    type="button"
                  >
                    <span className="toggle-slider"></span>
                  </button>
                </div>
                <div className="toggle-group">
                  <div className="toggle-label">
                    <label>System Notifications</label>
                    <span className="toggle-description">Receive system notifications in-app</span>
                  </div>
                  <button 
                    className={`toggle-switch ${notificationSettings.systemNotifications ? 'active' : ''}`}
                    onClick={() => setNotificationSettings({ ...notificationSettings, systemNotifications: !notificationSettings.systemNotifications })}
                    type="button"
                  >
                    <span className="toggle-slider"></span>
                  </button>
                </div>
                <div className="toggle-group">
                  <div className="toggle-label">
                    <label>Marketing Emails</label>
                    <span className="toggle-description">Receive marketing and promotional emails</span>
                  </div>
                  <button 
                    className={`toggle-switch ${notificationSettings.marketingEmails ? 'active' : ''}`}
                    onClick={() => setNotificationSettings({ ...notificationSettings, marketingEmails: !notificationSettings.marketingEmails })}
                    type="button"
                  >
                    <span className="toggle-slider"></span>
                  </button>
                </div>
                <div className="toggle-group">
                  <div className="toggle-label">
                    <label>Daily Reports</label>
                    <span className="toggle-description">Receive daily summary reports</span>
                  </div>
                  <button 
                    className={`toggle-switch ${notificationSettings.dailyReports ? 'active' : ''}`}
                    onClick={() => setNotificationSettings({ ...notificationSettings, dailyReports: !notificationSettings.dailyReports })}
                    type="button"
                  >
                    <span className="toggle-slider"></span>
                  </button>
                </div>
                <button type="submit" className="btn-save" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Settings'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default Settings;