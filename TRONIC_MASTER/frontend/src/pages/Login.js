// /home/kk/RS/TRONIC_MASTER/frontend/src/pages/Login.js

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [companyLogo, setCompanyLogo] = useState(null);
    const { login, isLoginAs, user } = useAuth();
    const navigate = useNavigate();

    // const STATIC_URL = process.env.REACT_APP_STATIC_URL || 'http://localhost:5002';

    // ============================================
    // ✅ CHECK FOR SUPPORT MODE - Redirect immediately
    // ============================================
    useEffect(() => {
        console.log('🔍 Login page - isLoginAs:', isLoginAs);
        console.log('🔍 Login page - user:', user?.name);
        
        // If in support mode, redirect to dashboard immediately
        if (isLoginAs) {
            console.log('🔐 Support mode detected, redirecting to dashboard');
            navigate('/dashboard', { replace: true });
            return;
        }
        
        // If user is already logged in, redirect to dashboard
        if (user) {
            console.log('👤 User already logged in, redirecting to dashboard');
            navigate('/', { replace: true });
        }
    }, [isLoginAs, user, navigate]);

    // Load company logo for login page
    useEffect(() => {
        const savedLogo = localStorage.getItem('tronicCompanyLogo');
        if (savedLogo) {
            setCompanyLogo(savedLogo);
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const result = await login(email, password);
            if (result.success) {
                navigate('/');
            } else {
                setError(result.message || 'Login failed');
            }
        } catch (err) {
            console.error('❌ Login error:', err);
            setError('An error occurred during login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    {companyLogo ? (
                        <img 
                            src={companyLogo} 
                            alt="Company Logo" 
                            className="login-logo-img"
                        />
                    ) : (
                        <div className="login-logo-default">
                            <svg width="64" height="64" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <rect width="100" height="100" rx="20" fill="#0d6efd"/>
                                <text x="50" y="68" textAnchor="middle" fontSize="50" fontWeight="bold" fontFamily="Arial, sans-serif" fill="white">TM</text>
                            </svg>
                        </div>
                    )}
                    <h1 className="login-title">TRONIC_MASTER</h1>
                    <p className="login-subtitle">Electronics & Gadgets Management</p>
                </div>
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="login-input-group">
                        <label className="login-label">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="login-input"
                            placeholder="Enter your email"
                            required
                            autoFocus
                            disabled={loading}
                        />
                    </div>
                    <div className="login-input-group">
                        <label className="login-label">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="login-input"
                            placeholder="Enter your password"
                            required
                            disabled={loading}
                        />
                    </div>
                    {error && <div className="login-error">{error}</div>}
                    <button type="submit" className="login-button" disabled={loading}>
                        {loading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <div className="login-footer">
                    <p>TRONIC_MASTER v1.0</p>
                </div>
            </div>
        </div>
    );
};

export default Login;