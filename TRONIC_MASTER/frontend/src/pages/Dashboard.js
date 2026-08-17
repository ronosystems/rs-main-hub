// /home/kk/RS/TRONIC_MASTER/frontend/src/pages/Dashboard.js

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import { productService } from '../services/productService';
import { saleService } from '../services/saleService';
import './Dashboard.css';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        overview: {
            totalProducts: 0,
            totalBranches: 0,
            totalUsers: 0,
            lowStockProducts: 0,
            outOfStockProducts: 0
        },
        sales: {
            today: { count: 0, total: 0 },
            thisWeek: { count: 0, total: 0 },
            thisMonth: { count: 0, total: 0 },
            total: { count: 0, total: 0 }
        },
        recentSales: [],
        topProducts: [],
        lowStockItems: [],
        branchStats: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // ============================================
    // LOGIN AS COMPANY STATE
    // ============================================
    const [isLoginAs, setIsLoginAs] = useState(false);
    const [companyName, setCompanyName] = useState('');
    const [originalUser, setOriginalUser] = useState(null);
    const [showBanner, setShowBanner] = useState(true);

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

    // ============================================
    // FETCH DASHBOARD DATA
    // ============================================
    const fetchDashboardData = useCallback(async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            
            if (!token) {
                console.log('❌ No token found');
                navigate('/login');
                return;
            }

            console.log('📡 Fetching dashboard data...');
            
            const [productsRes, salesRes, branchesRes] = await Promise.all([
                productService.getProducts(),
                saleService.getSales({ limit: 1000 }),
                fetch(`${API_URL}/branches`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })
            ]);

            const branchesData = await branchesRes.json();
            const products = productsRes.data || [];
            const sales = salesRes.data || [];

            console.log('📊 Products:', products.length);
            console.log('📊 Sales:', sales.length);
            console.log('📊 Branches:', branchesData.data?.length || 0);

            let lowStockCount = 0;
            let outOfStockCount = 0;

            products.forEach(product => {
                if (product.category === 'Accessories') {
                    const quantity = product.stock?.quantity || 0;
                    if (quantity === 0) {
                        outOfStockCount++;
                    } else if (quantity <= (product.stock?.minLevel || 5)) {
                        lowStockCount++;
                    }
                } else {
                    const availableUnits = product.units?.filter(u => u.status === 'available').length || 0;
                    if (availableUnits === 0) {
                        outOfStockCount++;
                    } else if (availableUnits <= 2) {
                        lowStockCount++;
                    }
                }
            });

            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const weekStart = new Date(now);
            weekStart.setDate(now.getDate() - now.getDay());
            weekStart.setHours(0, 0, 0, 0);
            const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

            let todaySales = { count: 0, total: 0 };
            let weekSales = { count: 0, total: 0 };
            let monthSales = { count: 0, total: 0 };
            let totalSales = { count: 0, total: 0 };

            const completedSales = sales.filter(s => s.status === 'completed');

            completedSales.forEach(sale => {
                const saleDate = new Date(sale.createdAt);
                const amount = sale.total || 0;
                
                totalSales.count++;
                totalSales.total += amount;

                if (saleDate >= today) {
                    todaySales.count++;
                    todaySales.total += amount;
                }

                if (saleDate >= weekStart) {
                    weekSales.count++;
                    weekSales.total += amount;
                }

                if (saleDate >= monthStart) {
                    monthSales.count++;
                    monthSales.total += amount;
                }
            });

            const recentSales = sales
                .filter(s => s.status === 'completed')
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 5);

            const productSales = {};
            sales.forEach(sale => {
                if (sale.status === 'completed' && sale.items) {
                    sale.items.forEach(item => {
                        const key = item.productId || item.productName;
                        if (!productSales[key]) {
                            productSales[key] = {
                                name: item.productName || 'Unknown',
                                quantity: 0,
                                total: 0
                            };
                        }
                        productSales[key].quantity += item.quantity || 0;
                        productSales[key].total += item.totalPrice || 0;
                    });
                }
            });

            const topProducts = Object.values(productSales)
                .sort((a, b) => b.quantity - a.quantity)
                .slice(0, 5);

            const lowStockItems = products
                .filter(product => {
                    if (product.category === 'Accessories') {
                        const quantity = product.stock?.quantity || 0;
                        return quantity > 0 && quantity <= (product.stock?.minLevel || 5);
                    } else {
                        const availableUnits = product.units?.filter(u => u.status === 'available').length || 0;
                        return availableUnits > 0 && availableUnits <= 2;
                    }
                })
                .slice(0, 5);

            const branchStats = (branchesData.data || []).map(branch => {
                const branchSales = sales.filter(s => 
                    s.branch === branch._id || s.branch?._id === branch._id
                );
                const completedBranchSales = branchSales.filter(s => s.status === 'completed');
                const totalRevenue = completedBranchSales.reduce((sum, s) => sum + (s.total || 0), 0);
                const totalCount = completedBranchSales.length;

                const branchProducts = products.filter(p => 
                    p.branch === branch._id || p.branch?._id === branch._id
                );

                return {
                    ...branch,
                    productCount: branchProducts.length,
                    salesCount: totalCount,
                    revenue: totalRevenue
                };
            });

            setStats({
                overview: {
                    totalProducts: products.length,
                    totalBranches: branchesData.data?.length || 0,
                    totalUsers: 0,
                    lowStockProducts: lowStockCount,
                    outOfStockProducts: outOfStockCount
                },
                sales: {
                    today: todaySales,
                    thisWeek: weekSales,
                    thisMonth: monthSales,
                    total: totalSales
                },
                recentSales: recentSales,
                topProducts: topProducts,
                lowStockItems: lowStockItems,
                branchStats: branchStats
            });

            setError(null);
            console.log('✅ Dashboard data loaded successfully');

        } catch (error) {
            console.error('❌ Error fetching dashboard:', error);
            setError('Network error. Please check your connection.');
        } finally {
            setLoading(false);
        }
    }, [API_URL, navigate]);

    // ============================================
    // CHECK FOR LOGIN AS COMPANY
    // ============================================
    useEffect(() => {
        // Check if logged in as company from MAIN HUB
        const loginAsCompany = localStorage.getItem('loginAsCompany') === 'true';
        const companyNameFromStorage = localStorage.getItem('companyName');
        const originalUserData = localStorage.getItem('originalUser');
        const companyData = localStorage.getItem('companyData');
        
        setIsLoginAs(loginAsCompany);
        
        if (companyNameFromStorage) {
            setCompanyName(companyNameFromStorage);
        }
        
        if (originalUserData) {
            try {
                setOriginalUser(JSON.parse(originalUserData));
            } catch (e) {
                console.error('Error parsing original user:', e);
            }
        }
        
        // Store company info in state if available
        if (companyData) {
            try {
                const parsedCompany = JSON.parse(companyData);
                console.log('🏢 Company data loaded:', parsedCompany);
            } catch (e) {
                console.error('Error parsing company data:', e);
            }
        }
        
        // Log the login-as status
        if (loginAsCompany) {
            console.log(`🔐 Logged in as company: ${companyNameFromStorage}`);
            if (originalUserData) {
                try {
                    const original = JSON.parse(originalUserData);
                    console.log(`👤 Original user: ${original.name} (${original.email})`);
                } catch (e) {}
            }
        }
    }, []);

    // ============================================
    // ROLE-BASED REDIRECTION
    // ============================================
    useEffect(() => {
        console.log('📊 Dashboard mounted, user:', user);
        
        if (!user) {
            console.log('❌ No user found, redirecting to login...');
            navigate('/login');
            return;
        }

        // If this is a login-as session, don't redirect based on role
        if (isLoginAs) {
            console.log('🔐 Login-as session detected - showing full dashboard');
            fetchDashboardData();
            return;
        }

        const userRole = user.companyRole || 'company_staff';
        console.log('👤 User Role:', userRole);

        // Cashier: Redirect to POS directly
        if (userRole === 'company_cashier') {
            console.log('💳 Cashier role detected - redirecting to POS');
            navigate('/pos');
            return;
        }

        // Agent: Redirect to Phones directly
        if (userRole === 'company_agent') {
            console.log('🤝 Agent role detected - redirecting to Phones');
            navigate('/phones');
            return;
        }

        // Admin & Manager: Show full dashboard
        fetchDashboardData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, isLoginAs]);

    // ============================================
    // RETURN TO MAIN HUB ADMIN
    // ============================================
    const handleReturnToAdmin = () => {
        const originalToken = localStorage.getItem('originalToken');
        if (originalToken) {
            // Clear TRONIC_MASTER session
            localStorage.removeItem('token');
            localStorage.removeItem('companyId');
            localStorage.removeItem('companyName');
            localStorage.removeItem('loginAsCompany');
            localStorage.removeItem('originalToken');
            localStorage.removeItem('originalUser');
            localStorage.removeItem('companyData');
            localStorage.removeItem('userData');
            
            // Redirect to MAIN HUB
            window.location.href = 'http://localhost:3000/super-admin/dashboard';
        } else {
            // Fallback: just logout
            logout();
            navigate('/login');
        }
    };

    const handleDismissBanner = () => {
        setShowBanner(false);
    };

    const formatCurrency = (amount) => {
        if (amount === undefined || amount === null) return 'KSh 0';
        return `KSh ${amount.toLocaleString()}`;
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // ============================================
    // GET ROLE-SPECIFIC DASHBOARD CONTENT
    // ============================================
    const getRoleSpecificContent = () => {
        const userRole = user?.companyRole || 'company_staff';

        // If this is a login-as session, show full admin view
        if (isLoginAs) {
            return (
                <>
                    {/* Login As Company Banner */}
                    {showBanner && (
                        <div className="login-as-banner">
                            <div className="banner-content">
                                <div className="banner-left">
                                    <span className="banner-icon">🔐</span>
                                    <span>
                                        You are logged in as <strong>{companyName || 'Company'}</strong>
                                        {originalUser && (
                                            <span className="original-user">
                                                (acting on behalf of {originalUser.name})
                                            </span>
                                        )}
                                    </span>
                                    {user && (
                                        <span className="user-badge">
                                            👤 {user.name} ({user.email})
                                        </span>
                                    )}
                                </div>
                                <div className="banner-right">
                                    <button className="btn-return" onClick={handleReturnToAdmin}>
                                        ← Return to Admin
                                    </button>
                                    <button className="btn-dismiss" onClick={handleDismissBanner}>
                                        ✕
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Help Mode Notice */}
                    <div className="help-mode">
                        <span className="help-icon">🆘</span>
                        <span>
                            You are in <strong>Help Mode</strong>. You can assist the user with their issues.
                            All actions will be performed on behalf of <strong>{companyName || 'this company'}</strong>.
                        </span>
                    </div>

                    {/* Full Admin Dashboard Content */}
                    {renderFullDashboard()}
                </>
            );
        }

        // Admin View - Full Dashboard
        if (userRole === 'company_admin' || user.role === 'super_admin') {
            return renderFullDashboard();
        }

        // Manager View - Simplified Dashboard
        if (userRole === 'company_manager') {
            return renderManagerDashboard();
        }

        // Staff View
        if (userRole === 'company_staff') {
            return renderStaffDashboard();
        }

        // Default fallback for any other roles
        return (
            <div className="dashboard-simple">
                <div className="dashboard-welcome">
                    <h2>Welcome to TRONIC_MASTER!</h2>
                    <p>Your role does not have access to the full dashboard.</p>
                </div>
            </div>
        );
    };

    // ============================================
    // RENDER FULL DASHBOARD
    // ============================================
    const renderFullDashboard = () => (
        <>
            {/* Stats Grid */}
            <div className="dashboard-stats-grid">
                <div className="stat-card">
                    <div className="stat-icon">📦</div>
                    <div className="stat-info">
                        <h3 className="stat-number">{stats.overview.totalProducts}</h3>
                        <p className="stat-label">Total Products</p>
                    </div>
                </div>
                
                <div className="stat-card warning">
                    <div className="stat-icon">⚠️</div>
                    <div className="stat-info">
                        <h3 className="stat-number">{stats.overview.lowStockProducts}</h3>
                        <p className="stat-label">Low Stock</p>
                    </div>
                </div>
                
                <div className="stat-card danger">
                    <div className="stat-icon">🚫</div>
                    <div className="stat-info">
                        <h3 className="stat-number">{stats.overview.outOfStockProducts}</h3>
                        <p className="stat-label">Out of Stock</p>
                    </div>
                </div>
                
                <div className="stat-card success">
                    <div className="stat-icon">💰</div>
                    <div className="stat-info">
                        <h3 className="stat-number">{formatCurrency(stats.sales.today.total)}</h3>
                        <p className="stat-label">Today's Sales ({stats.sales.today.count} orders)</p>
                    </div>
                </div>

                <div className="stat-card info">
                    <div className="stat-icon">📈</div>
                    <div className="stat-info">
                        <h3 className="stat-number">{formatCurrency(stats.sales.thisMonth.total)}</h3>
                        <p className="stat-label">This Month ({stats.sales.thisMonth.count} orders)</p>
                    </div>
                </div>

                <div className="stat-card primary">
                    <div className="stat-icon">🏢</div>
                    <div className="stat-info">
                        <h3 className="stat-number">{stats.overview.totalBranches}</h3>
                        <p className="stat-label">Branches</p>
                    </div>
                </div>
            </div>

            {/* Recent Sales & Top Products */}
            <div className="dashboard-two-column">
                <div className="dashboard-card">
                    <h3>🕐 Recent Sales</h3>
                    {stats.recentSales.length === 0 ? (
                        <p className="empty-message">No recent sales</p>
                    ) : (
                        <div className="recent-sales-list">
                            {stats.recentSales.map((sale, index) => (
                                <div key={index} className="recent-sale-item">
                                    <div className="sale-info">
                                        <span className="sale-number">#{sale.saleNumber}</span>
                                        <span className="sale-customer">{sale.customer?.name || 'Walk-in'}</span>
                                    </div>
                                    <div className="sale-details">
                                        <span className="sale-date">{formatDate(sale.createdAt)}</span>
                                        <span className="sale-amount">{formatCurrency(sale.total)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="dashboard-card">
                    <h3>🏆 Top Selling Products</h3>
                    {stats.topProducts.length === 0 ? (
                        <p className="empty-message">No sales data yet</p>
                    ) : (
                        <div className="top-products-list">
                            {stats.topProducts.map((product, index) => (
                                <div key={index} className="top-product-item">
                                    <span className="product-rank">#{index + 1}</span>
                                    <span className="product-name">{product.name}</span>
                                    <div className="product-stats">
                                        <span className="product-qty">{product.quantity} sold</span>
                                        <span className="product-revenue">{formatCurrency(product.total)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Low Stock Items */}
            {stats.lowStockItems.length > 0 && (
                <div className="dashboard-card warning-card">
                    <h3>⚠️ Low Stock Items</h3>
                    <div className="low-stock-list">
                        {stats.lowStockItems.map((product, index) => (
                            <div key={index} className="low-stock-item">
                                <span className="product-name">{product.name}</span>
                                <span className="product-brand">{product.brand}</span>
                                <span className="stock-status">
                                    {product.category === 'Accessories' 
                                        ? `${product.stock?.quantity || 0} units left`
                                        : `${product.units?.filter(u => u.status === 'available').length || 0} units left`
                                    }
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Branch Statistics */}
            {stats.branchStats.length > 0 && (
                <div className="dashboard-card">
                    <h3>🏢 Branch Performance</h3>
                    <div className="branch-stats-grid">
                        {stats.branchStats.map((branch, index) => (
                            <div key={index} className="branch-stat-item">
                                <h4>{branch.name}</h4>
                                <div className="branch-stats">
                                    <span>📍 {branch.city || 'N/A'}, {branch.country || 'N/A'}</span>
                                    <span>📦 {branch.productCount} products</span>
                                    <span>💰 {formatCurrency(branch.revenue)}</span>
                                    <span>📋 {branch.salesCount} orders</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Company Info */}
            <div className="dashboard-company">
                <h3>Company Details</h3>
                <div className="company-details-grid">
                    <div className="detail-item">
                        <span className="detail-label">Name:</span>
                        <span className="detail-value">{user?.company?.name}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Code:</span>
                        <span className="detail-value">{user?.company?.code}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Project Type:</span>
                        <span className="detail-value">{user?.company?.projectType}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Currency:</span>
                        <span className="detail-value">{user?.company?.settings?.currency || 'KES'}</span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Total Revenue:</span>
                        <span className="detail-value" style={{ color: '#198754', fontWeight: 'bold' }}>
                            {formatCurrency(stats.sales.total.total)}
                        </span>
                    </div>
                    <div className="detail-item">
                        <span className="detail-label">Total Orders:</span>
                        <span className="detail-value">{stats.sales.total.count}</span>
                    </div>
                </div>
            </div>
        </>
    );

    // ============================================
    // RENDER MANAGER DASHBOARD
    // ============================================
    const renderManagerDashboard = () => (
        <>
            <div className="dashboard-stats-grid manager-stats">
                <div className="stat-card success">
                    <div className="stat-icon">💰</div>
                    <div className="stat-info">
                        <h3 className="stat-number">{formatCurrency(stats.sales.today.total)}</h3>
                        <p className="stat-label">Today's Sales</p>
                    </div>
                </div>

                <div className="stat-card info">
                    <div className="stat-icon">📈</div>
                    <div className="stat-info">
                        <h3 className="stat-number">{formatCurrency(stats.sales.thisMonth.total)}</h3>
                        <p className="stat-label">This Month</p>
                    </div>
                </div>

                <div className="stat-card warning">
                    <div className="stat-icon">📦</div>
                    <div className="stat-info">
                        <h3 className="stat-number">{stats.overview.totalProducts}</h3>
                        <p className="stat-label">Total Products</p>
                    </div>
                </div>

                <div className="stat-card danger">
                    <div className="stat-icon">⚠️</div>
                    <div className="stat-info">
                        <h3 className="stat-number">{stats.overview.lowStockProducts + stats.overview.outOfStockProducts}</h3>
                        <p className="stat-label">Stock Issues</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-welcome manager-welcome">
                <h2>Welcome, {user?.name || 'Manager'}! 👔</h2>
                <p>
                    Manage your products, sales, and inventory from one place.
                    {stats.overview.totalProducts > 0 && 
                        ` You have ${stats.overview.totalProducts} products in your inventory.`
                    }
                </p>
            </div>

            <div className="dashboard-quick-actions">
                <div className="quick-action-card" onClick={() => navigate('/products')}>
                    <span className="action-icon">📦</span>
                    <span className="action-label">Manage Products</span>
                </div>
                <div className="quick-action-card" onClick={() => navigate('/sales')}>
                    <span className="action-icon">💰</span>
                    <span className="action-label">View Sales</span>
                </div>
                <div className="quick-action-card" onClick={() => navigate('/pos')}>
                    <span className="action-icon">🛒</span>
                    <span className="action-label">POS</span>
                </div>
            </div>

            <div className="dashboard-card">
                <h3>🕐 Recent Sales</h3>
                {stats.recentSales.length === 0 ? (
                    <p className="empty-message">No recent sales</p>
                ) : (
                    <div className="recent-sales-list">
                        {stats.recentSales.map((sale, index) => (
                            <div key={index} className="recent-sale-item">
                                <div className="sale-info">
                                    <span className="sale-number">#{sale.saleNumber}</span>
                                    <span className="sale-customer">{sale.customer?.name || 'Walk-in'}</span>
                                </div>
                                <div className="sale-details">
                                    <span className="sale-date">{formatDate(sale.createdAt)}</span>
                                    <span className="sale-amount">{formatCurrency(sale.total)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );

    // ============================================
    // RENDER STAFF DASHBOARD
    // ============================================
    const renderStaffDashboard = () => (
        <>
            <div className="dashboard-welcome">
                <h2>Welcome, {user?.name || 'Staff'}! 👋</h2>
                <p>You can view products and sales data from here.</p>
            </div>

            <div className="dashboard-stats-grid staff-stats">
                <div className="stat-card">
                    <div className="stat-icon">📦</div>
                    <div className="stat-info">
                        <h3 className="stat-number">{stats.overview.totalProducts}</h3>
                        <p className="stat-label">Products</p>
                    </div>
                </div>
                <div className="stat-card success">
                    <div className="stat-icon">💰</div>
                    <div className="stat-info">
                        <h3 className="stat-number">{formatCurrency(stats.sales.today.total)}</h3>
                        <p className="stat-label">Today's Sales</p>
                    </div>
                </div>
            </div>

            <div className="dashboard-card">
                <h3>🕐 Recent Sales</h3>
                {stats.recentSales.length === 0 ? (
                    <p className="empty-message">No recent sales</p>
                ) : (
                    <div className="recent-sales-list">
                        {stats.recentSales.map((sale, index) => (
                            <div key={index} className="recent-sale-item">
                                <div className="sale-info">
                                    <span className="sale-number">#{sale.saleNumber}</span>
                                    <span className="sale-customer">{sale.customer?.name || 'Walk-in'}</span>
                                </div>
                                <div className="sale-details">
                                    <span className="sale-date">{formatDate(sale.createdAt)}</span>
                                    <span className="sale-amount">{formatCurrency(sale.total)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );

    // ============================================
    // RENDER
    // ============================================
    if (loading) {
        return (
            <MainLayout title="Dashboard" breadcrumbs={['Home', 'Dashboard']}>
                <div className="dashboard-loading">
                    <div className="spinner"></div>
                    <p>Loading TRONIC_MASTER...</p>
                </div>
            </MainLayout>
        );
    }

    if (error) {
        return (
            <MainLayout title="Dashboard" breadcrumbs={['Home', 'Dashboard']}>
                <div className="dashboard-error">
                    <div className="error-icon">⚠️</div>
                    <h2>Error Loading Dashboard</h2>
                    <p>{error}</p>
                    <button className="btn-primary" onClick={fetchDashboardData}>
                        Retry
                    </button>
                </div>
            </MainLayout>
        );
    }

    return (
        <MainLayout title="Dashboard" breadcrumbs={['Home', 'Dashboard']}>
            {getRoleSpecificContent()}
        </MainLayout>
    );
};

export default Dashboard;