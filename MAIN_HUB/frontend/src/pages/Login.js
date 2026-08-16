// /home/kk/RS/MAIN HUB/frontend/src/pages/Login.js

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Login.css';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, getDashboardPath, user } = useAuth();
  const navigate = useNavigate();

  // System Settings from localStorage
  const [systemLogo, setSystemLogo] = useState(null);
  const [primaryColor, setPrimaryColor] = useState('#0d98cf');
  const [platformName, setPlatformName] = useState('RS Hub');

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const path = getDashboardPath();
      console.log('🔄 User already logged in, redirecting to:', path);
      navigate(path);
    }
  }, [user, getDashboardPath, navigate]);

  // Load system settings from localStorage
  useEffect(() => {
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
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (isLogin) {
      // LOGIN
      const result = await login(email, password);
      
      if (result.success) {
        console.log('✅ Login successful, user:', result.user);
        console.log('✅ User role:', result.user?.role);
        
        const path = getDashboardPath();
        console.log('✅ Redirecting to:', path);
        
        // Use navigate instead of window.location
        navigate(path);
      } else {
        setError(result.message || 'Login failed');
      }
    } else {
      // SIGN UP
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('http://localhost:5000/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name,
            email,
            password,
            role: 'admin'
          })
        });

        const data = await response.json();
        
        if (data.success) {
          setSuccess('✅ Account created successfully! Please sign in.');
          setTimeout(() => {
            setIsLogin(true);
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setName('');
            setSuccess('');
          }, 3000);
        } else {
          setError(data.message || 'Sign up failed');
        }
      } catch (err) {
        setError('Failed to create account. Please try again.');
      }
    }
    
    setLoading(false);
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setName('');
  };

  return (
    <div className="login-container">
      <div className="particle"></div>
      <div className="particle"></div>
      <div className="particle"></div>
      
      <div className="login-card">
        <div className="login-header">
          {/* Logo - Same as MainLayout */}
          <div className="login-logo">
            {systemLogo ? (
              <img 
                src={systemLogo} 
                alt="System Logo" 
                className="logo-img" 
                style={{ 
                  width: '64px', 
                  height: '64px', 
                  borderRadius: '12px', 
                  objectFit: 'contain',
                  boxShadow: '0 4px 20px rgba(13, 152, 207, 0.3)'
                }}
              />
            ) : (
              <svg width="64" height="64" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="32" height="32" rx="8" fill={primaryColor} />
                <text x="16" y="22" textAnchor="middle" fontSize="16" fontWeight="bold" fill="white" fontFamily="Arial, sans-serif">
                  RS
                </text>
              </svg>
            )}
          </div>
          <h1>WELCOME TO <span className="highlight">{platformName}</span></h1>
          <p className="subtitle">
            {isLogin ? 'Sign in to your account' : 'Register Account With Us'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {/* Name field - Only for Sign Up */}
          {!isLogin && (
            <div className="form-group">
              <label>Full Name <span className="required">*</span></label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
              />
            </div>
          )}

          <div className="form-group">
            <label>Email Address <span className="required">*</span></label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className="form-group">
            <label>Password <span className="required">*</span></label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={isLogin ? "Enter your password" : "Create a password (min 6 chars)"}
              required
            />
          </div>

          {/* Confirm Password - Only for Sign Up */}
          {!isLogin && (
            <div className="form-group">
              <label>Confirm Password <span className="required">*</span></label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
              />
            </div>
          )}

          {error && (
            <div className="error-message">
              <span className="error-icon">❌</span>
              {error}
            </div>
          )}

          {success && (
            <div className="success-message">
              <span className="success-icon">✅</span>
              {success}
            </div>
          )}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner"></span>
                {isLogin ? 'Signing in...' : 'Creating account...'}
              </>
            ) : (
              isLogin ? 'Sign In' : 'Sign Up'
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              className="toggle-btn" 
              onClick={toggleMode}
              type="button"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
          <span className="version">Version 2.0</span>
        </div>
      </div>
    </div>
  );
};

export default Login;