import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { FiDollarSign, FiTrendingUp, FiTrendingDown, FiPackage, FiAlertTriangle, FiShoppingCart, FiFileText, FiBarChart2 } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { formatCurrency } from '../utils/currency';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month');

  useEffect(() => {
    fetchStats();
  }, [dateRange]);

  const fetchStats = async () => {
    try {
      const endDate = new Date();
      let startDate = new Date();
      
      if (dateRange === 'week') {
        startDate.setDate(startDate.getDate() - 7);
      } else if (dateRange === 'month') {
        startDate.setMonth(startDate.getMonth() - 1);
      } else if (dateRange === 'year') {
        startDate.setFullYear(startDate.getFullYear() - 1);
      }

      const [dashboardRes, salesRes] = await Promise.all([
        api.get('/reports/dashboard', {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          }
        }),
        api.get('/sales', {
          params: {
            limit: 5,
            sort: '-createdAt'
          }
        })
      ]);

      setStats(dashboardRes.data);
      setRecentSales(salesRes.data.sales || salesRes.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="date-filter">
          <option value="week">Last 7 Days</option>
          <option value="month">Last Month</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      <div className="stats-grid">
        <div className="stat-card sales">
          <div className="stat-content">
            <h3>Total Sales</h3>
            <p className="stat-value">{formatCurrency(stats?.sales?.total || 0)}</p>
          </div>
        </div>

        <div className="stat-card expenses">
          <div className="stat-content">
            <h3>Total Expenses</h3>
            <p className="stat-value">{formatCurrency(stats?.expenses?.total || 0)}</p>
          </div>
        </div>

        <div className="stat-card profit">
          <div className="stat-content">
            <h3>Net Profit</h3>
            <p className="stat-value">{formatCurrency(stats?.profit?.netProfit || 0)}</p>
          </div>
        </div>

        <div className="stat-card inventory">
          <div className="stat-content">
            <h3>Inventory</h3>
            <p className="stat-value">{stats?.inventory?.totalProducts || 0}</p>
          </div>
        </div>
      </div>

      {stats?.inventory?.lowStockCount > 0 && (
        <div className="alert-section">
          <div className="alert-card">
            <FiAlertTriangle />
            <div>
              <h4>Low Stock Alert</h4>
              <p>You have {stats.inventory.lowStockCount} product(s) running low on stock. Check your inventory.</p>
            </div>
          </div>
        </div>
      )}

      <div className="quick-actions">
        <Link to="/sales/new" className="action-card">
          <div className="action-icon sales">
            <FiShoppingCart />
          </div>
          <h3>New Sale</h3>
          <p>Create transaction</p>
        </Link>

        <Link to="/inventory" className="action-card">
          <div className="action-icon inventory">
            <FiPackage />
          </div>
          <h3>Add Product</h3>
          <p>Add to inventory</p>
        </Link>

        <Link to="/expenses" className="action-card">
          <div className="action-icon expenses">
            <FiFileText />
          </div>
          <h3>Add Expense</h3>
          <p>Record expense</p>
        </Link>

        <Link to="/reports" className="action-card">
          <div className="action-icon reports">
            <FiBarChart2 />
          </div>
          <h3>Reports</h3>
          <p>View analytics</p>
        </Link>
      </div>

      {recentSales.length > 0 && (
        <div className="recent-sales-section">
          <h2>Recent Sales</h2>
          <div className="recent-sales-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Invoice</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.slice(0, 5).map((sale) => (
                  <tr key={sale._id}>
                    <td>{format(new Date(sale.saleDate), 'MMM dd, yyyy')}</td>
                    <td>#{sale.invoiceNumber || 'N/A'}</td>
                    <td>{sale.customerName || 'Walk-in'}</td>
                    <td>{sale.products?.length || 0}</td>
                    <td style={{ fontWeight: 600, color: '#667eea' }}>{formatCurrency(sale.totalAmount)}</td>
                    <td>
                      <span className={`status ${sale.paymentStatus || 'paid'}`}>
                        {(sale.paymentStatus || 'paid').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
