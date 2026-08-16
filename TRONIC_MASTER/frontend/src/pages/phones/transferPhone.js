import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import './transferPhone.css';

const TransferPhone = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { phone, unit, branch } = location.state || {};

  const [formData, setFormData] = useState({
    transferToBranch: '',
    transferToUser: '',
    transferType: 'user',
    reason: ''
  });

  const [branches, setBranches] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentOwner, setCurrentOwner] = useState(null);

  const searchRef = useRef(null);
  const dropdownRef = useRef(null);

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

  useEffect(() => {
    fetchBranches();
    fetchUsers();
    fetchCurrentOwner();
    
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/branches`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (data.success) {
        const filteredBranches = data.data.filter(b => b._id !== branch?._id);
        setBranches(filteredBranches);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoadingData(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        const filtered = data.data.filter(user => {
          if (user._id === localStorage.getItem('userId')) return false;
          return user.isActive !== false;
        });
        
        setUsers(filtered);
        setFilteredUsers(filtered);
      } else {
        setError('Failed to load users');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setLoadingData(false);
    }
  };

  // ============================================
  // Fetch current owner of the IMEI
  // ============================================
  const fetchCurrentOwner = async () => {
    try {
      if (unit.assignedTo && unit.assignedToType === 'user') {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/users/${unit.assignedTo}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setCurrentOwner({
            type: 'user',
            name: data.data.name,
            email: data.data.email,
            phone: data.data.phone
          });
          return;
        }
      }
      
      if (unit.branch) {
        setCurrentOwner({
          type: 'branch',
          name: branch?.name || 'Branch',
          city: branch?.city || ''
        });
        return;
      }
      
      if (phone.branch) {
        setCurrentOwner({
          type: 'branch',
          name: phone.branch.name || 'Not Assigned',
          city: phone.branch.city || ''
        });
        return;
      }
      
      setCurrentOwner({
        type: 'none',
        name: 'Not Assigned'
      });
    } catch (error) {
      console.error('Error fetching current owner:', error);
      setCurrentOwner({
        type: 'none',
        name: 'Not Assigned'
      });
    }
  };

  // ============================================
  // ✅ NEW: Auto-assign product to agent
  // ============================================
  const autoAssignProductToAgent = async (agentId) => {
    try {
      const token = localStorage.getItem('token');
      
      console.log(`📱 Auto-assigning product ${phone._id} to agent ${agentId}`);
      
      const response = await fetch(`${API_URL}/users/${agentId}/assign-product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          productId: phone._id,
          unitId: unit.identifier // Pass the specific IMEI
        })
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Product auto-assigned to agent successfully');
        return true;
      } else {
        console.log('⚠️ Failed to auto-assign product:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Error auto-assigning product:', error);
      return false;
    }
  };

  if (!phone || !unit) {
    return (
      <MainLayout title="Transfer Phone" breadcrumbs={['Home', 'Phones', 'Transfer']}>
        <div className="error-state">
          <p>❌ Phone or IMEI not found</p>
          <button onClick={() => navigate('/phones')}>Go Back</button>
        </div>
      </MainLayout>
    );
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTransferTypeChange = (type) => {
    setFormData(prev => ({ 
      ...prev, 
      transferType: type,
      transferToBranch: '',
      transferToUser: ''
    }));
    setSelectedUser(null);
    setSelectedBranch(null);
    setSearchTerm('');
    setShowUserDropdown(false);
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setFormData(prev => ({ ...prev, transferToUser: '' }));
    setSelectedUser(null);
    
    if (value.trim().length > 0) {
      setSearchLoading(true);
      const searchLower = value.toLowerCase();
      const filtered = users.filter(user => 
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.phone?.includes(value) ||
        user.companyRole?.toLowerCase().includes(searchLower)
      );
      setFilteredUsers(filtered);
      setShowUserDropdown(true);
      setSearchLoading(false);
    } else {
      setFilteredUsers(users);
      setShowUserDropdown(false);
    }
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setFormData(prev => ({ ...prev, transferToUser: user._id }));
    setSearchTerm(user.name);
    setShowUserDropdown(false);
  };

  const handleBranchSelect = (e) => {
    const branchId = e.target.value;
    setFormData(prev => ({ ...prev, transferToBranch: branchId }));
    const found = branches.find(b => b._id === branchId);
    setSelectedBranch(found || null);
  };

  const getRoleDisplay = (role) => {
    const roleMap = {
      'company_admin': 'Admin',
      'company_manager': 'Manager',
      'company_cashier': 'Cashier',
      'company_agent': 'Agent',
      'company_staff': 'Staff',
      'admin': 'Admin',
      'manager': 'Manager',
      'staff': 'Staff',
      'guest': 'Guest'
    };
    return roleMap[role] || role || 'Staff';
  };

  const getRoleBadgeClass = (role) => {
    const badgeMap = {
      'company_admin': 'role-admin',
      'company_manager': 'role-manager',
      'company_cashier': 'role-cashier',
      'company_agent': 'role-agent',
      'company_staff': 'role-staff',
      'admin': 'role-admin',
      'manager': 'role-manager',
      'staff': 'role-staff',
      'guest': 'role-guest'
    };
    return badgeMap[role] || 'role-staff';
  };

  const getRoleIcon = (role) => {
    const iconMap = {
      'company_admin': '👑',
      'company_manager': '👔',
      'company_cashier': '💳',
      'company_agent': '🤝',
      'company_staff': '👤',
      'admin': '👑',
      'manager': '👔',
      'staff': '👤',
      'guest': '👤'
    };
    return iconMap[role] || '👤';
  };

  const getTransferDestinationDisplay = () => {
    if (formData.transferType === 'user') {
      if (selectedUser) {
        return `👤 ${selectedUser.name}`;
      }
      return '👤 Not selected';
    } else if (formData.transferType === 'branch') {
      if (selectedBranch) {
        return `🏢 ${selectedBranch.name}`;
      }
      if (formData.transferToBranch) {
        const found = branches.find(b => b._id === formData.transferToBranch);
        if (found) {
          return `🏢 ${found.name}`;
        }
      }
      return '🏢 Not selected';
    }
    return 'Not selected';
  };

  const getCurrentOwnerDisplay = () => {
    if (!currentOwner) return 'Loading...';
    
    if (currentOwner.type === 'user') {
      return `👤 ${currentOwner.name}`;
    } else if (currentOwner.type === 'branch') {
      return `🏢 ${currentOwner.name}`;
    }
    return '—';
  };

  const getCurrentBranchDisplay = () => {
    return branch?.name || phone?.branch?.name || 'Not Assigned';
  };

  // ============================================
  // ✅ UPDATED: Handle Submit with Auto-Assign
  // ============================================
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.transferType === 'branch' && !formData.transferToBranch) {
      alert('Please select a branch to transfer to');
      return;
    }

    if (formData.transferType === 'user' && !formData.transferToUser) {
      alert('Please select a user to transfer to');
      return;
    }

    if (!formData.reason.trim()) {
      alert('Please provide a reason for the transfer');
      return;
    }

    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const transferData = {
        imei: unit.identifier,
        phoneId: phone._id,
        transferType: formData.transferType,
        transferTo: formData.transferType === 'branch' ? formData.transferToBranch : formData.transferToUser,
        reason: formData.reason,
        fromBranch: branch?._id || null
      };

      console.log('📤 Transferring IMEI:', transferData);

      const response = await fetch(`${API_URL}/phones/${phone._id}/transfer-unit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(transferData)
      });

      const data = await response.json();
      
      if (data.success) {
        // ✅ NEW: Auto-assign product to agent if transferring to user
        if (formData.transferType === 'user' && selectedUser) {
          const assigned = await autoAssignProductToAgent(selectedUser._id);
          if (assigned) {
            console.log('✅ Product auto-assigned to agent');
          }
        }
        
        alert(`✅ IMEI ${unit.identifier} transferred successfully!`);
        
        // Fetch updated phone data
        const updatedPhoneResponse = await fetch(`${API_URL}/phones/${phone._id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const updatedPhoneData = await updatedPhoneResponse.json();
        
        if (updatedPhoneData.success) {
          navigate(`/phones/imeis/${phone._id}`, { 
            state: { 
              phone: updatedPhoneData.data,
              branch: branch 
            } 
          });
        } else {
          navigate(`/phones/imeis/${phone._id}`, { 
            state: { 
              phone: phone,
              branch: branch 
            } 
          });
        }
      } else {
        alert('❌ ' + data.message);
      }
    } catch (error) {
      console.error('Error transferring phone:', error);
      alert('❌ Failed to transfer phone');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout title="Transfer Phone" breadcrumbs={['Home', 'Phones', 'Transfer']}>
      <div className="transfer-page">
        <div className="transfer-header">
          <button className="btn-back" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <h2>🔄 Transfer IMEI</h2>
          <p>Transfer this IMEI to another user or branch</p>
        </div>

        {/* Product Info */}
        <div className="product-info-card">
          <div className="product-icon">📱</div>
          <div className="product-details">
            <h3>{phone.brand} {phone.model}</h3>
            <div className="product-specs">
              <span>IMEI: {unit.identifier}</span>
              <span>RAM: {phone.ram || 'N/A'}</span>
              <span>ROM: {phone.rom || 'N/A'}</span>
              <span>Current Branch: {getCurrentBranchDisplay()}</span>
              <span className={`status-badge current-status ${unit.status}`}>
                Status: {unit.status?.charAt(0).toUpperCase() + unit.status?.slice(1) || 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="transfer-form">
          {/* Transfer Type Selection */}
          <div className="transfer-type-selector">
            <button
              type="button"
              className={`type-btn ${formData.transferType === 'user' ? 'active' : ''}`}
              onClick={() => handleTransferTypeChange('user')}
            >
              👤 To User
            </button>
            <button
              type="button"
              className={`type-btn ${formData.transferType === 'branch' ? 'active' : ''}`}
              onClick={() => handleTransferTypeChange('branch')}
            >
              🏢 To Branch
            </button>
          </div>

          {/* User Selection with Search */}
          {formData.transferType === 'user' && (
            <div className="form-group" ref={dropdownRef}>
              <label>Search & Select User *</label>
              {loadingData ? (
                <div className="loading-users">
                  <div className="spinner-small"></div>
                  <span>Loading users...</span>
                </div>
              ) : (
                <>
                  <div className="search-container">
                    <input
                      type="text"
                      placeholder="Search by name, email, or phone..."
                      value={searchTerm}
                      onChange={handleSearchChange}
                      onFocus={() => {
                        if (searchTerm.trim().length > 0 && filteredUsers.length > 0) {
                          setShowUserDropdown(true);
                        }
                      }}
                      className="search-user-input"
                      autoComplete="off"
                    />
                    {searchLoading && (
                      <div className="search-spinner">
                        <div className="spinner-small"></div>
                      </div>
                    )}
                    {searchTerm && (
                      <button
                        type="button"
                        className="clear-search-btn"
                        onClick={() => {
                          setSearchTerm('');
                          setSelectedUser(null);
                          setFormData(prev => ({ ...prev, transferToUser: '' }));
                          setFilteredUsers(users);
                          setShowUserDropdown(false);
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  
                  {/* User Dropdown */}
                  {showUserDropdown && (
                    <div className="user-dropdown">
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map(user => (
                          <div
                            key={user._id}
                            className={`user-item ${selectedUser?._id === user._id ? 'selected' : ''}`}
                            onClick={() => handleSelectUser(user)}
                          >
                            <div className="user-item-avatar">
                              {user.profilePicture ? (
                                <img src={user.profilePicture} alt={user.name} />
                              ) : (
                                <span className="avatar-placeholder">
                                  {user.name?.charAt(0).toUpperCase() || 'U'}
                                </span>
                              )}
                            </div>
                            <div className="user-item-info">
                              <span className="user-item-name">{user.name}</span>
                              <span className="user-item-email">{user.email}</span>
                              {user.phone && (
                                <span className="user-item-phone">📞 {user.phone}</span>
                              )}
                              <span className={`user-item-role ${getRoleBadgeClass(user.companyRole || user.role)}`}>
                                {getRoleIcon(user.companyRole || user.role)} {getRoleDisplay(user.companyRole || user.role)}
                              </span>
                            </div>
                            {selectedUser?._id === user._id && (
                              <span className="user-item-check">✓</span>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="user-dropdown-empty">
                          <p>No users found matching "{searchTerm}"</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Selected User Display */}
                  {selectedUser && (
                    <div className="selected-user-display">
                      <div className="selected-user-avatar">
                        {selectedUser.profilePicture ? (
                          <img src={selectedUser.profilePicture} alt={selectedUser.name} />
                        ) : (
                          <span className="avatar-placeholder-small">
                            {selectedUser.name?.charAt(0).toUpperCase() || 'U'}
                          </span>
                        )}
                      </div>
                      <div className="selected-user-info">
                        <span className="selected-user-name">{selectedUser.name}</span>
                        <span className="selected-user-email">{selectedUser.email}</span>
                        <span className={`selected-user-role ${getRoleBadgeClass(selectedUser.companyRole || selectedUser.role)}`}>
                          {getRoleIcon(selectedUser.companyRole || selectedUser.role)} {getRoleDisplay(selectedUser.companyRole || selectedUser.role)}
                        </span>
                      </div>
                      <button 
                        type="button" 
                        className="clear-user-btn"
                        onClick={() => {
                          setSelectedUser(null);
                          setSearchTerm('');
                          setFormData(prev => ({ ...prev, transferToUser: '' }));
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Branch Selection */}
          {formData.transferType === 'branch' && (
            <div className="form-group">
              <label>Select Branch *</label>
              <select
                name="transferToBranch"
                value={formData.transferToBranch}
                onChange={handleBranchSelect}
                required
              >
                <option value="">Select a branch...</option>
                {branches.map(b => (
                  <option key={b._id} value={b._id}>
                    {b.name} {b.city ? `- ${b.city}` : ''}
                  </option>
                ))}
              </select>
              {branches.length === 0 && (
                <p className="no-data">No other branches available</p>
              )}
            </div>
          )}

          {/* Reason */}
          <div className="form-group">
            <label>Reason for Transfer *</label>
            <textarea
              name="reason"
              value={formData.reason}
              onChange={handleChange}
              placeholder="Please explain why this IMEI is being transferred..."
              rows="3"
              required
            />
          </div>

          {/* Transfer Summary */}
          <div className="transfer-summary">
            <h4>📋 Transfer Summary</h4>
            
            <div className="summary-row">
              <span>IMEI Number</span>
              <span className="imei-value">{unit.identifier}</span>
            </div>
            
            <div className="summary-row">
              <span>Current Owner</span>
              <span className="owner-value">{getCurrentOwnerDisplay()}</span>
            </div>
            
            <div className="summary-row">
              <span>Current Branch</span>
              <span className="branch-value">{getCurrentBranchDisplay()}</span>
            </div>
            
            <div className="summary-row highlight">
              <span>Transfer To</span>
              <span className="transfer-target highlight-text">
                {getTransferDestinationDisplay()}
              </span>
            </div>

            {/* ✅ NEW: Auto-assign info for agents */}
            {formData.transferType === 'user' && selectedUser && (
              <div className="summary-row auto-assign-info">
                <span>📱 Auto-Assign</span>
                <span className="auto-assign-text">
                  Product will be auto-assigned to agent
                </span>
              </div>
            )}
          </div>

          <div className="warning-box">
            ⚠️ This action will transfer ownership of this IMEI to the selected recipient
          </div>

          <div className="form-actions">
            <button type="button" className="btn-cancel" onClick={() => navigate(-1)}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn-transfer" 
              disabled={loading || (formData.transferType === 'user' && !selectedUser) || (formData.transferType === 'branch' && !formData.transferToBranch)}
            >
              {loading ? 'Processing...' : '🔄 Confirm Transfer'}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default TransferPhone;