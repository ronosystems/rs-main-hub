// /home/kk/RS/TRONIC_MASTER/frontend/src/pages/Profile.js

import React, { useState, useEffect, useRef } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../context/AuthContext';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    companyRole: '',
    phone: '',
    profilePicture: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState(false);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';
  const STATIC_URL = process.env.REACT_APP_STATIC_URL || 'http://localhost:5002';

  useEffect(() => {
    if (user) {
      console.log('👤 User data:', user);
      console.log('📸 Profile picture path:', user.profilePicture);
      console.log('📋 Company Role:', user.companyRole);
      
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || '',
        companyRole: user.companyRole || '',
        phone: user.phone || '',
        profilePicture: user.profilePicture || ''
      });
      setImageError(false);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Please upload a valid image (JPEG, PNG, GIF, or WEBP)' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'Image size should be less than 5MB' });
      return;
    }

    setUploadingImage(true);
    setMessage({ type: '', text: '' });
    setImageError(false);

    try {
      const formData = new FormData();
      formData.append('profilePicture', file);

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/profile/picture`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (updateUser) {
          updateUser(data.data);
        }
        setFormData(prev => ({ 
          ...prev, 
          profilePicture: data.data.profilePicture 
        }));
        setMessage({ type: 'success', text: 'Profile picture updated successfully!' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to upload image' });
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setMessage({ type: 'error', text: 'Network error. Please check if the server is running.' });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    if (!window.confirm('Are you sure you want to remove your profile picture?')) {
      return;
    }

    setUploadingImage(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/profile/picture`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (updateUser) {
          updateUser(data.data);
        }
        setFormData(prev => ({ ...prev, profilePicture: '' }));
        setImageError(false);
        setMessage({ type: 'success', text: 'Profile picture removed successfully!' });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to remove image' });
      }
    } catch (error) {
      console.error('Error removing image:', error);
      setMessage({ type: 'error', text: 'Network error. Please check if the server is running.' });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        if (updateUser) {
          updateUser(data.data);
        }
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setIsEditing(false);
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update profile' });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Network error. Please check if the server is running.' });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || '',
        companyRole: user.companyRole || '',
        phone: user.phone || '',
        profilePicture: user.profilePicture || ''
      });
    }
    setMessage({ type: '', text: '' });
    setImageError(false);
  };

  // ✅ COMPANY ROLE HELPERS
  const getCompanyRoleBadgeClass = (role) => {
    const roleMap = {
      'company_admin': 'badge-company-admin',
      'company_manager': 'badge-company-manager',
      'company_cashier': 'badge-company-cashier',
      'company_agent': 'badge-company-agent',
      'company_staff': 'badge-company-staff'
    };
    return roleMap[role] || 'badge-company-staff';
  };

  const getCompanyRoleDisplayName = (role) => {
    const roleMap = {
      'company_admin': 'Company Admin',
      'company_manager': 'Company Manager',
      'company_cashier': 'Company Cashier',
      'company_agent': 'Company Agent',
      'company_staff': 'Company Staff'
    };
    return roleMap[role] || role || 'Staff';
  };

  const getCompanyRoleIcon = (role) => {
    const roleMap = {
      'company_admin': '👑',
      'company_manager': '👔',
      'company_cashier': '💳',
      'company_agent': '🤝',
      'company_staff': '👤'
    };
    return roleMap[role] || '👤';
  };

  // ✅ Get full profile picture URL
  const getProfilePictureUrl = (path) => {
    if (!path) {
      console.log('❌ No profile picture path');
      return null;
    }
    
    if (path.startsWith('http://') || path.startsWith('https://')) {
      console.log('✅ Full URL already:', path);
      return path;
    }
    
    const fullUrl = `${STATIC_URL}${path}`;
    console.log('📸 Generated profile picture URL:', fullUrl);
    return fullUrl;
  };

  const profilePictureUrl = getProfilePictureUrl(formData.profilePicture);
  
  console.log('📸 Profile picture path from formData:', formData.profilePicture);
  console.log('📸 Final profile picture URL:', profilePictureUrl);
  console.log('📋 Company Role from formData:', formData.companyRole);

  // Get the company role to display
  const displayRole = formData.companyRole || user?.companyRole || 'company_staff';
  const roleDisplayName = getCompanyRoleDisplayName(displayRole);
  const roleIcon = getCompanyRoleIcon(displayRole);
  const roleBadgeClass = getCompanyRoleBadgeClass(displayRole);

  return (
    <MainLayout title="My Profile" breadcrumbs={['Home', 'Profile']}>
      <div className="profile-container">
        <div className="profile-card">
          {/* Profile Header */}
          <div className="profile-header">
            <div className="profile-avatar-wrapper">
              <div className="profile-avatar">
                {profilePictureUrl && !imageError ? (
                  <img 
                    src={profilePictureUrl} 
                    alt={formData.name || 'User'}
                    onError={(e) => {
                      console.error('❌ Image failed to load:', profilePictureUrl);
                      setImageError(true);
                      e.target.style.display = 'none';
                      const parent = e.target.parentElement;
                      const initials = parent.querySelector('.avatar-initials');
                      if (initials) {
                        initials.style.display = 'flex';
                      }
                    }}
                    onLoad={() => {
                      console.log('✅ Image loaded successfully:', profilePictureUrl);
                      setImageError(false);
                    }}
                  />
                ) : (
                  <span className="avatar-initials" style={{ display: 'flex' }}>
                    {formData.name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                )}
              </div>
              <div className="avatar-actions">
                <button
                  className="avatar-btn avatar-upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                >
                  {uploadingImage ? (
                    <span className="spinner-small"></span>
                  ) : (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                      Upload
                    </>
                  )}
                </button>
                {formData.profilePicture && (
                  <button
                    className="avatar-btn avatar-remove-btn"
                    onClick={handleRemoveImage}
                    disabled={uploadingImage}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    Remove
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
            
            <div className="profile-info">
              <div className="profile-info-row">
                <div className="profile-info-item">
                  <label>Email Address</label>
                  <p className="profile-info-value">{formData.email || 'No email'}</p>
                </div>
                <div className="profile-info-item">
                  <label>Role</label>
                  <p className="profile-info-value">
                    <span className={`role-badge ${roleBadgeClass}`}>
                      {roleIcon} {roleDisplayName}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Message Display */}
          {message.text && (
            <div className={`profile-message ${message.type}`}>
              {message.text}
            </div>
          )}

          {/* Profile Form */}
          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={!isEditing ? 'disabled-input' : ''}
                  placeholder="Enter full name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!isEditing}
                  className={!isEditing ? 'disabled-input' : ''}
                  placeholder="Enter phone number"
                />
              </div>
            </div>

            <div className="form-actions">
              {!isEditing ? (
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => setIsEditing(true)}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                  Edit Profile
                </button>
              ) : (
                <div className="action-buttons">
                  <button
                    type="submit"
                    className="btn btn-success"
                    disabled={loading}
                  >
                    {loading ? (
                      <span className="spinner"></span>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Save Changes
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCancel}
                    disabled={loading}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </form>

          <div className="profile-footer">
            <div className="account-info">
              <div className="info-grid">
                <div className="info-item">
                  <span className="info-label">Account Created</span>
                  <span className="info-value">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="info-item">
                  <span className="info-label">Last Login</span>
                  <span className="info-value">
                    {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Profile;