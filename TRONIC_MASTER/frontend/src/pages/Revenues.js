import React, { useState, useEffect, useCallback } from 'react';
import MainLayout from '../components/layout/MainLayout';
import { useAuth } from '../context/AuthContext';
import { FaFileDownload, FaSync, FaCalendarDay, FaCalendarWeek, FaCalendarAlt, FaShoppingCart, FaChartLine, FaBox, FaUsers, FaMoneyBillWave, FaEdit, FaSave, FaTimes } from 'react-icons/fa';
import './Revenues.css';

const Revenues = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const companyId = user?.company?._id || user?.company;
  const companyName = user?.company?.name || 'Company';
  
  // Check if user is admin based on companyRole or projectRole
  const isAdmin = user?.companyRole === 'company_admin' || 
                  user?.projectRole === 'admin' || 
                  user?.role === 'admin' || 
                  user?.role === 'super_admin';
  
  // State for inventory value
  const [inventoryValue, setInventoryValue] = useState({
    totalSellingValue: 0,
    totalCostValue: 0,
    totalItems: 0
  });
  
  // State for payroll
  const [payrollData, setPayrollData] = useState([]);
  const [totalPayroll, setTotalPayroll] = useState(0);
  const [editingSalary, setEditingSalary] = useState(null);
  const [salaryInput, setSalaryInput] = useState('');
  const [updatingSalary, setUpdatingSalary] = useState(false);
  
  // Revenue data for different periods
  const [revenueData, setRevenueData] = useState({
    today: { revenue: 0, expenses: 0, profit: 0, transactions: 0, sales: [] },
    yesterday: { revenue: 0, expenses: 0, profit: 0, transactions: 0, sales: [] },
    thisWeek: { revenue: 0, expenses: 0, profit: 0, transactions: 0, sales: [] },
    lastWeek: { revenue: 0, expenses: 0, profit: 0, transactions: 0, sales: [] },
    thisMonth: { revenue: 0, expenses: 0, profit: 0, transactions: 0, sales: [] },
    lastMonth: { revenue: 0, expenses: 0, profit: 0, transactions: 0, sales: [] },
    thisYear: { revenue: 0, expenses: 0, profit: 0, transactions: 0, sales: [] },
    lastYear: { revenue: 0, expenses: 0, profit: 0, transactions: 0, sales: [] }
  });

  // Tab state
  const [activeTab, setActiveTab] = useState('daily');

  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

  // Helper: Get date ranges
  const getDateRanges = useCallback(() => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const thisWeekStart = new Date(today);
    const dayOfWeek = thisWeekStart.getDay();
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    thisWeekStart.setDate(thisWeekStart.getDate() - diff);
    thisWeekStart.setHours(0, 0, 0, 0);
    
    const lastWeekStart = new Date(thisWeekStart);
    lastWeekStart.setDate(lastWeekStart.getDate() - 7);
    
    const thisMonthStart = new Date(today);
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);
    
    const lastMonthStart = new Date(thisMonthStart);
    lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);
    
    const thisYearStart = new Date(today);
    thisYearStart.setMonth(0, 1);
    thisYearStart.setHours(0, 0, 0, 0);
    
    const lastYearStart = new Date(thisYearStart);
    lastYearStart.setFullYear(lastYearStart.getFullYear() - 1);

    return {
      today: { start: today, end: now },
      yesterday: { start: yesterday, end: new Date(today.getTime() - 1) },
      thisWeek: { start: thisWeekStart, end: now },
      lastWeek: { start: lastWeekStart, end: new Date(thisWeekStart.getTime() - 1) },
      thisMonth: { start: thisMonthStart, end: now },
      lastMonth: { start: lastMonthStart, end: new Date(thisMonthStart.getTime() - 1) },
      thisYear: { start: thisYearStart, end: now },
      lastYear: { start: lastYearStart, end: new Date(thisYearStart.getTime() - 1) }
    };
  }, []);

  const calculateExpenses = (sale) => {
    if (!sale.items || sale.items.length === 0) return 0;
    
    return sale.items.reduce((total, item) => {
      const cost = item.purchasePrice || item.cost || (item.unitPrice * 0.6) || 0;
      return total + (cost * (item.quantity || 1));
    }, 0);
  };

  // Calculate inventory value
  const calculateInventoryValue = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/products?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        const products = data.data || [];
        
        const companyProducts = products.filter(p => {
          const productCompanyId = p.company?._id || p.company;
          return productCompanyId?.toString() === companyId?.toString() && p.status === 'active';
        });
        
        let totalSellingValue = 0;
        let totalCostValue = 0;
        let totalItems = 0;
        
        companyProducts.forEach(product => {
          if (product.category === 'Phones' || product.category === 'Electronics') {
            const availableUnits = product.units?.filter(u => u.status === 'available') || [];
            const unitCount = availableUnits.length;
            const sellingPrice = product.price?.sale || 0;
            const costPrice = product.price?.purchase || 0;
            
            totalSellingValue += unitCount * sellingPrice;
            totalCostValue += unitCount * costPrice;
            totalItems += unitCount;
          } else if (product.category === 'Accessories') {
            const quantity = product.stock?.quantity || 0;
            const sellingPrice = product.price?.sale || 0;
            const costPrice = product.price?.purchase || 0;
            
            totalSellingValue += quantity * sellingPrice;
            totalCostValue += quantity * costPrice;
            totalItems += quantity;
          }
        });
        
        setInventoryValue({
          totalSellingValue,
          totalCostValue,
          totalItems
        });
      }
    } catch (error) {
      console.error('Error calculating inventory value:', error);
    }
  }, [API_URL, companyId]);

  // Fetch payroll data - Using project roles
  const fetchPayrollData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/users?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (data.success) {
        const users = data.data || [];
        
        console.log('📊 All users from API:', users);
        console.log('🏢 Current company ID:', companyId);
        console.log('👤 Current user:', user);
        
        // Filter users for this company
        const companyUsers = users.filter(u => {
          const userCompanyId = u.company?._id || u.company;
          const matchesCompany = userCompanyId?.toString() === companyId?.toString();
          
          // Also include users without company if they're the current user
          const isCurrentUser = u._id === user?._id;
          
          return (matchesCompany || isCurrentUser) && u.isActive !== false;
        });
        
        console.log('👥 Company users after filtering:', companyUsers);
        
        // Map users to payroll format with project roles
        const payroll = companyUsers.map(u => ({
          id: u._id,
          name: u.name || 'Unknown',
          phone: u.phone || 'N/A',
          email: u.email || 'N/A',
          salary: u.salary || u.sallary || 0,
          // Use companyRole for TRONIC_MASTER project
          role: u.companyRole || u.role || 'company_staff',
          // Map role display names
          roleDisplay: getRoleDisplayName(u.companyRole || u.role),
          // Store original role for reference
          companyRole: u.companyRole,
          projectRole: u.projectRole,
          mainHubRole: u.role,
          isActive: u.isActive,
          branch: u.branch
        }));
        
        setPayrollData(payroll);
        const total = payroll.reduce((sum, p) => sum + (p.salary || 0), 0);
        setTotalPayroll(total);
        
        console.log('👥 Payroll Data:', payroll);
        console.log('💰 Total Payroll:', total);
      } else {
        console.error('Failed to fetch users:', data.message);
      }
    } catch (error) {
      console.error('Error fetching payroll data:', error);
    }
  }, [API_URL, companyId, user]);

  // Helper function to get display name for roles
  const getRoleDisplayName = (role) => {
    const roleMap = {
      'company_admin': 'Admin',
      'company_manager': 'Manager',
      'company_cashier': 'Cashier',
      'company_agent': 'Agent',
      'company_staff': 'Staff',
      'admin': 'Admin',
      'manager': 'Manager',
      'staff': 'Staff',
      'super_admin': 'Super Admin'
    };
    return roleMap[role] || role || 'Staff';
  };

  // Get role badge class
  const getRoleBadgeClass = (role) => {
    const badgeMap = {
      'company_admin': 'badge-company-admin',
      'company_manager': 'badge-company-manager',
      'company_cashier': 'badge-company-cashier',
      'company_agent': 'badge-company-agent',
      'company_staff': 'badge-company-staff',
      'admin': 'badge-admin',
      'manager': 'badge-manager',
      'staff': 'badge-staff',
      'super_admin': 'badge-super-admin'
    };
    return badgeMap[role] || 'badge-company-staff';
  };

  // Update user salary
  const updateUserSalary = async (userId, newSalary) => {
    try {
      setUpdatingSalary(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ salary: newSalary })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update local state
        setPayrollData(prev => 
          prev.map(u => 
            u.id === userId ? { ...u, salary: newSalary } : u
          )
        );
        // Recalculate total
        const newTotal = payrollData.reduce((sum, u) => 
          u.id === userId ? sum + newSalary : sum + u.salary, 0
        );
        setTotalPayroll(newTotal);
        setEditingSalary(null);
        setSalaryInput('');
        alert('Salary updated successfully!');
      } else {
        throw new Error(data.message || 'Failed to update salary');
      }
    } catch (error) {
      console.error('Error updating salary:', error);
      alert('Failed to update salary. Please try again.');
    } finally {
      setUpdatingSalary(false);
    }
  };

  // Fetch revenue data
  const fetchRevenueData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      const dateRanges = getDateRanges();
      
      const response = await fetch(`${API_URL}/sales?limit=1000`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch sales');
      }

      const allSales = data.data || [];

      const companySales = allSales.filter(sale => {
        const saleCompanyId = sale.company?._id || sale.company;
        return saleCompanyId?.toString() === companyId?.toString();
      });

      const calculatePeriodData = (startDate, endDate) => {
        const periodSales = companySales.filter(sale => {
          const saleDate = new Date(sale.createdAt);
          return saleDate >= startDate && saleDate <= endDate;
        });

        const totalRevenue = periodSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
        const totalExpenses = periodSales.reduce((sum, sale) => {
          return sum + calculateExpenses(sale);
        }, 0);

        return {
          revenue: totalRevenue,
          expenses: totalExpenses,
          profit: totalRevenue - totalExpenses,
          transactions: periodSales.length,
          sales: periodSales
        };
      };

      setRevenueData({
        today: calculatePeriodData(dateRanges.today.start, dateRanges.today.end),
        yesterday: calculatePeriodData(dateRanges.yesterday.start, dateRanges.yesterday.end),
        thisWeek: calculatePeriodData(dateRanges.thisWeek.start, dateRanges.thisWeek.end),
        lastWeek: calculatePeriodData(dateRanges.lastWeek.start, dateRanges.lastWeek.end),
        thisMonth: calculatePeriodData(dateRanges.thisMonth.start, dateRanges.thisMonth.end),
        lastMonth: calculatePeriodData(dateRanges.lastMonth.start, dateRanges.lastMonth.end),
        thisYear: calculatePeriodData(dateRanges.thisYear.start, dateRanges.thisYear.end),
        lastYear: calculatePeriodData(dateRanges.lastYear.start, dateRanges.lastYear.end)
      });

    } catch (error) {
      console.error('Error fetching revenue data:', error);
      setError('Failed to load revenue data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [getDateRanges, API_URL, companyId]);

  useEffect(() => {
    if (companyId) {
      fetchRevenueData();
      calculateInventoryValue();
      fetchPayrollData();
    } else {
      setError('No company associated with this user');
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const formatCurrency = (amount) => {
    return `KSh ${(amount || 0).toLocaleString()}`;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-KE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getPeriodLabel = (period) => {
    const labels = {
      today: "Today",
      yesterday: "Yesterday",
      thisWeek: "This Week",
      lastWeek: "Last Week",
      thisMonth: "This Month",
      lastMonth: "Last Month",
      thisYear: "This Year",
      lastYear: "Last Year"
    };
    return labels[period] || period;
  };

  // Get period pairs for tabs - FIXED
  const getPeriodPairs = (tab) => {
    switch(tab) {
      case 'daily':
        return ['today', 'yesterday'];
      case 'weekly':
        return ['thisWeek', 'lastWeek'];
      case 'monthly':
        return ['thisMonth', 'lastMonth'];
      case 'yearly':
        return ['thisYear', 'lastYear'];
      default:
        return ['today', 'yesterday'];
    }
  };

  const generateReport = (period) => {
    const data = revenueData[period];
    const periodLabel = getPeriodLabel(period);
    
    let csvContent = `${companyName} - ${periodLabel} Revenue Report\n`;
    csvContent += `=","========================================\n`;
    csvContent += `Revenue,${data.revenue}\n`;
    csvContent += `Expenses,${data.expenses}\n`;
    csvContent += `Profit,${data.profit}\n`;
    csvContent += `Transactions,${data.transactions}\n\n`;
    csvContent += `Sale ID,Date,Customer,Items,Total\n`;

    data.sales.forEach(sale => {
      const items = sale.items?.map(item => item.productName).join('; ') || 'N/A';
      csvContent += `${sale.saleNumber || sale._id},${formatDate(sale.createdAt)},${sale.customer?.name || 'Walk-in'},${items},${sale.total || 0}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${companyName}_${period}_Revenue_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const renderGeneralStats = () => (
    <div className="general-stats">
      <div className="stats-grid">
        <div className="stat-card total-revenue">
          <div className="stat-icon"><FaMoneyBillWave /></div>
          <div className="stat-content">
            <span className="stat-label">Total Revenue</span>
            <span className="stat-value">
              {formatCurrency(
                revenueData.today.revenue + 
                revenueData.yesterday.revenue + 
                revenueData.thisWeek.revenue + 
                revenueData.thisMonth.revenue
              )}
            </span>
          </div>
        </div>
        <div className="stat-card total-profit">
          <div className="stat-icon"><FaChartLine /></div>
          <div className="stat-content">
            <span className="stat-label">Total Profit</span>
            <span className="stat-value positive">
              {formatCurrency(
                revenueData.today.profit + 
                revenueData.yesterday.profit + 
                revenueData.thisWeek.profit + 
                revenueData.thisMonth.profit
              )}
            </span>
          </div>
        </div>
        <div className="stat-card total-transactions">
          <div className="stat-icon"><FaShoppingCart /></div>
          <div className="stat-content">
            <span className="stat-label">Total Transactions</span>
            <span className="stat-value">
              {revenueData.today.transactions + 
               revenueData.yesterday.transactions + 
               revenueData.thisWeek.transactions + 
               revenueData.thisMonth.transactions}
            </span>
          </div>
        </div>
        <div className="stat-card inventory-value">
          <div className="stat-icon"><FaBox /></div>
          <div className="stat-content">
            <span className="stat-label">Inventory Value</span>
            <span className="stat-value">{formatCurrency(inventoryValue.totalSellingValue)}</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPeriodCards = (periods) => {
    return (
      <div className="period-cards">
        {periods.map(period => {
          const data = revenueData[period];
          return (
            <div key={period} className="period-card">
              <div className="period-card-header">
                <h4>{getPeriodLabel(period)}</h4>
                <span className="transaction-badge">{data.transactions} transactions</span>
              </div>
              <div className="period-card-stats">
                <div className="period-stat">
                  <span className="period-stat-label">Revenue</span>
                  <span className="period-stat-value positive">{formatCurrency(data.revenue)}</span>
                </div>
                <div className="period-stat">
                  <span className="period-stat-label">Expenses</span>
                  <span className="period-stat-value negative">{formatCurrency(data.expenses)}</span>
                </div>
                <div className="period-stat">
                  <span className="period-stat-label">Profit</span>
                  <span className={`period-stat-value ${data.profit > 0 ? 'positive' : data.profit < 0 ? 'negative' : ''}`}>
                    {formatCurrency(data.profit)}
                  </span>
                </div>
              </div>
              <div className="period-card-actions">
                <button 
                  className="btn-view-sales"
                  onClick={() => {
                    alert(`Sales for ${getPeriodLabel(period)}:\n\n${data.sales.map(s => 
                      `${s.saleNumber || s._id}: ${formatCurrency(s.total)} - ${s.customer?.name || 'Walk-in'}`
                    ).join('\n')}`);
                  }}
                >
                  View Sales ({data.transactions})
                </button>
                <button 
                  className="btn-export-small"
                  onClick={() => generateReport(period)}
                >
                  <FaFileDownload /> Export
                </button>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderPayrollTab = () => (
    <div className="payroll-tab">
      <div className="payroll-summary-cards">
        <div className="payroll-summary-card">
          <span className="summary-label">Total Employees</span>
          <span className="summary-value">{payrollData.length}</span>
        </div>
        <div className="payroll-summary-card">
          <span className="summary-label">Total Monthly Payroll</span>
          <span className="summary-value">{formatCurrency(totalPayroll)}</span>
        </div>
        <div className="payroll-summary-card">
          <span className="summary-label">Average Salary</span>
          <span className="summary-value">
            {formatCurrency(payrollData.length > 0 ? totalPayroll / payrollData.length : 0)}
          </span>
        </div>
      </div>

      <div className="payroll-table-container">
        <div className="table-header">
          <h4>Staff Salary Details</h4>
          {isAdmin && (
            <div className="table-actions">
              <button 
                className="btn-export-payroll"
                onClick={() => {
                  let csvContent = `${companyName} - Staff Payroll\n`;
                  csvContent += `Total Employees,${payrollData.length}\n`;
                  csvContent += `Total Monthly Payroll,${totalPayroll}\n\n`;
                  csvContent += `Name,Phone,Email,Role,Salary\n`;
                  
                  payrollData.forEach(emp => {
                    csvContent += `${emp.name},${emp.phone},${emp.email},${emp.roleDisplay},${emp.salary}\n`;
                  });
                  
                  const blob = new Blob([csvContent], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `${companyName}_Payroll_${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  window.URL.revokeObjectURL(url);
                }}
              >
                <FaFileDownload /> Export CSV
              </button>
            </div>
          )}
        </div>

        <div className="table-responsive">
          <table className="payroll-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Full Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Role</th>
                <th>Salary Amount</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {payrollData.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="no-data">
                    <span>👤</span>
                    <p>No employees with salary data found</p>
                  </td>
                </tr>
              ) : (
                payrollData.map((employee, index) => (
                  <tr key={employee.id || index}>
                    <td>{index + 1}</td>
                    <td>{employee.name}</td>
                    <td>{employee.phone}</td>
                    <td>{employee.email}</td>
                    <td>
                      <span className={`role-badge ${getRoleBadgeClass(employee.companyRole || employee.role)}`}>
                        {employee.roleDisplay}
                      </span>
                    </td>
                    <td className="salary-amount">
                      {editingSalary === employee.id ? (
                        <div className="salary-edit">
                          <input
                            type="number"
                            value={salaryInput}
                            onChange={(e) => setSalaryInput(e.target.value)}
                            className="salary-input"
                            placeholder="Enter salary"
                            min="0"
                          />
                        </div>
                      ) : (
                        formatCurrency(employee.salary)
                      )}
                    </td>
                    {isAdmin && (
                      <td className="action-buttons">
                        {editingSalary === employee.id ? (
                          <>
                            <button
                              className="btn-save-salary"
                              onClick={() => {
                                const newSalary = parseFloat(salaryInput);
                                if (isNaN(newSalary) || newSalary < 0) {
                                  alert('Please enter a valid salary amount');
                                  return;
                                }
                                updateUserSalary(employee.id, newSalary);
                              }}
                              disabled={updatingSalary}
                            >
                              <FaSave /> Save
                            </button>
                            <button
                              className="btn-cancel-edit"
                              onClick={() => {
                                setEditingSalary(null);
                                setSalaryInput('');
                              }}
                            >
                              <FaTimes /> Cancel
                            </button>
                          </>
                        ) : (
                          <button
                            className="btn-edit-salary"
                            onClick={() => {
                              setEditingSalary(employee.id);
                              setSalaryInput(employee.salary.toString());
                            }}
                          >
                            <FaEdit /> Set Salary
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
            {payrollData.length > 0 && (
              <tfoot>
                <tr className="total-row">
                  <td colSpan={isAdmin ? 5 : 5}>
                    <strong>Total</strong>
                  </td>
                  <td className="salary-amount">
                    <strong>{formatCurrency(totalPayroll)}</strong>
                  </td>
                  {isAdmin && <td></td>}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <MainLayout title="Revenues" breadcrumbs={['Home', 'Revenues']}>
        <div className="revenues-page">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading revenue data...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Revenues" breadcrumbs={['Home', 'Revenues']}>
      <div className="revenues-page">
        <div className="revenues-header">
          <div className="header-left">
            <h2>💰 Revenue Dashboard</h2>
            <p>Track revenue, expenses, inventory value, and staff payroll</p>
          </div>
          <div className="header-actions">
            <button className="btn-refresh" onClick={() => {
              fetchRevenueData();
              calculateInventoryValue();
              fetchPayrollData();
            }}>
              <FaSync /> Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="error-state">
            <p>⚠️ {error}</p>
            <button onClick={() => {
              fetchRevenueData();
              calculateInventoryValue();
              fetchPayrollData();
            }}>Retry</button>
          </div>
        )}

        {renderGeneralStats()}

        <div className="tabs-container">
          <div className="tabs-header">
            <button 
              className={`tab-btn ${activeTab === 'daily' ? 'active' : ''}`}
              onClick={() => setActiveTab('daily')}
            >
              <FaCalendarDay /> Daily
            </button>
            <button 
              className={`tab-btn ${activeTab === 'weekly' ? 'active' : ''}`}
              onClick={() => setActiveTab('weekly')}
            >
              <FaCalendarWeek /> Weekly
            </button>
            <button 
              className={`tab-btn ${activeTab === 'monthly' ? 'active' : ''}`}
              onClick={() => setActiveTab('monthly')}
            >
              <FaCalendarAlt /> Monthly
            </button>
            <button 
              className={`tab-btn ${activeTab === 'yearly' ? 'active' : ''}`}
              onClick={() => setActiveTab('yearly')}
            >
              <FaCalendarAlt /> Yearly
            </button>
            <button 
              className={`tab-btn payroll-tab-btn ${activeTab === 'payroll' ? 'active' : ''}`}
              onClick={() => setActiveTab('payroll')}
            >
              <FaUsers /> Payroll
            </button>
          </div>

          <div className="tab-content">
            {activeTab === 'daily' && renderPeriodCards(getPeriodPairs('daily'))}
            {activeTab === 'weekly' && renderPeriodCards(getPeriodPairs('weekly'))}
            {activeTab === 'monthly' && renderPeriodCards(getPeriodPairs('monthly'))}
            {activeTab === 'yearly' && renderPeriodCards(getPeriodPairs('yearly'))}
            {activeTab === 'payroll' && renderPayrollTab()}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Revenues;