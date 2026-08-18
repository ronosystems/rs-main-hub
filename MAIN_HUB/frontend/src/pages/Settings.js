// /home/kk/RS/MAIN HUB/frontend/src/pages/Settings.js

import React, { useState, useEffect, useRef, useCallback } from 'react';
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

  const API_URL = 'https://main-hub-api-ea52e89c5128.herokuapp.com/api';
  const STATIC_URL = 'https://main-hub-api-ea52e89c5128.herokuapp.com';

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
    platformName: 'RONOSYSTEMS HUB',
    platformEmail: 'support@ronosystems.com',
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

  // Icon components (keep as is)
  const Icons = { /* ... your existing Icons ... */ };

  // ✅ FIXED: Fetch system settings with proper error handling
  const fetchSystemSettings = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      
      // If no token, use localStorage settings
      if (!token) {
        console.warn('⚠️ Settings: No token found, using localStorage defaults');
        loadSettingsFromLocalStorage();
        return;
      }

      console.log('🔐 Settings: Fetching from API with token');
      
      const response = await fetch(`${API_URL}/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📡 Settings API response status:', response.status);

      // Handle 401/403 gracefully
      if (response.status === 401 || response.status === 403) {
        console.warn('⚠️ Settings API unauthorized - using localStorage');
        loadSettingsFromLocalStorage();
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          const settings = data.data;
          console.log('✅ Settings loaded from server:', settings);
          
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
      } else {
        console.warn('⚠️ Settings fetch failed with status:', response.status);
        loadSettingsFromLocalStorage();
      }
    } catch (error) {
      console.error('❌ Error fetching system settings:', error);
      loadSettingsFromLocalStorage();
    }
  }, [API_URL, STATIC_URL]);

  // Helper function to load settings from localStorage
  const loadSettingsFromLocalStorage = () => {
    console.log('📂 Loading settings from localStorage');
    
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
  };

  // Load saved settings from localStorage (fallback) and server
  useEffect(() => {
    // First, load from localStorage for immediate display
    loadSettingsFromLocalStorage();

    // Then fetch from server
    fetchSystemSettings();
  }, [fetchSystemSettings]);

  // Logo upload handlers (keep as is)
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

  // Submit handlers (keep as is but add better error handling)
  const handleGeneralSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Please login to save settings');
        setLoading(false);
        return;
      }

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
      if (!token) {
        alert('Please login to save settings');
        setLoading(false);
        return;
      }

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
          {/* General Settings - keep as is */}
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

          {/* Appearance Settings - keep as is */}
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

          {/* Security Settings - keep as is */}
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

          {/* Notification Settings - keep as is */}
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