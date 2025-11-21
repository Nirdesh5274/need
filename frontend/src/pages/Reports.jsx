import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { FiDownload, FiFilter } from 'react-icons/fi';
import { format } from 'date-fns';
import { formatCurrency } from '../utils/currency';
import '../styles/common.css';
import './Reports.css';

const Reports = () => {
  const [sales, setSales] = useState([]);
  const [summary, setSummary] = useState({
    totalSales: 0,
    amountPaid: 0,
    totalDue: 0,
    totalExpense: 0,
    netProfit: 0
  });
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      const params = {};
      if (startDate) params.startDate = new Date(startDate).toISOString();
      if (endDate) params.endDate = new Date(endDate).toISOString();
      if (paymentStatus) params.paymentStatus = paymentStatus;

      const [salesRes, expensesRes] = await Promise.all([
        api.get('/sales', { params }),
        api.get('/expenses', { params })
      ]);

      const salesData = salesRes.data.sales || salesRes.data || [];
      const expensesData = expensesRes.data.expenses || expensesRes.data || [];

      setSales(salesData);

      // Calculate summary
      const totalSales = salesData.reduce((sum, sale) => sum + (sale.totalAmount || 0), 0);
      const amountPaid = salesData.reduce((sum, sale) => sum + (sale.paymentDetails?.paidAmount || sale.totalAmount || 0), 0);
      const totalDue = salesData.reduce((sum, sale) => sum + (sale.paymentDetails?.pendingAmount || 0), 0);
      const totalExpense = expensesData.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      const netProfit = totalSales - totalExpense;

      setSummary({
        totalSales,
        amountPaid,
        totalDue,
        totalExpense,
        netProfit
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching reports:', error);
      setLoading(false);
    }
  };

  const handleFilter = () => {
    fetchReports();
  };

  const handleClear = () => {
    setStartDate('');
    setEndDate('');
    setPaymentStatus('');
    setTimeout(() => fetchReports(), 100);
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Invoice', 'Customer', 'Items', 'Total', 'Paid', 'Due', 'Status'];
    const rows = sales.map(sale => [
      format(new Date(sale.saleDate), 'dd-MM-yyyy'),
      sale.invoiceNumber || 'N/A',
      sale.customerName || 'Walk-in',
      sale.products?.length || 0,
      sale.totalAmount,
      sale.paymentDetails?.paidAmount || sale.totalAmount,
      sale.paymentDetails?.pendingAmount || 0,
      sale.paymentStatus || 'paid'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${format(new Date(), 'dd-MM-yyyy')}.csv`;
    a.click();
  };

  if (loading) {
    return <div className="loading">Loading reports...</div>;
  }

  return (
    <div className="reports">
      <div className="page-header">
        <h1>Reports & Analytics</h1>
        <button className="btn-add" onClick={exportToCSV} style={{ marginLeft: 'auto' }}>
          <FiDownload /> Export to CSV
        </button>
      </div>

      {/* Filter Section */}
      <div className="filter-section">
        <div className="filter-group">
          <label>START DATE</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>END DATE</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label>PAYMENT STATUS</label>
          <select value={paymentStatus} onChange={(e) => setPaymentStatus(e.target.value)}>
            <option value="">All Payments</option>
            <option value="paid">Paid</option>
            <option value="partial">Partial</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <div className="filter-actions">
          <button className="btn-filter" onClick={handleFilter}>
            <FiFilter /> FILTER
          </button>
          <button className="btn-clear-filter" onClick={handleClear}>
            CLEAR
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card green">
          <div className="card-label">TOTAL SALES</div>
          <div className="card-value">{formatCurrency(summary.totalSales)}</div>
        </div>
        <div className="summary-card blue">
          <div className="card-label">AMOUNT PAID</div>
          <div className="card-value">{formatCurrency(summary.amountPaid)}</div>
        </div>
        <div className="summary-card orange">
          <div className="card-label">TOTAL DUE</div>
          <div className="card-value">{formatCurrency(summary.totalDue)}</div>
        </div>
        <div className="summary-card red">
          <div className="card-label">TOTAL EXPENSES</div>
          <div className="card-value">{formatCurrency(summary.totalExpense)}</div>
        </div>
        <div className="summary-card gray">
          <div className="card-label">NET PROFIT</div>
          <div className="card-value">{formatCurrency(summary.netProfit)}</div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Date & Invoice</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Paid</th>
              <th>Due</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {sales && sales.length > 0 ? (
              sales.map((sale) => {
                const paidAmount = sale.paymentDetails?.paidAmount || sale.totalAmount;
                const dueAmount = sale.paymentDetails?.pendingAmount || 0;
                return (
                  <tr key={sale._id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{format(new Date(sale.saleDate), 'MMM dd, yyyy')}</div>
                      <small style={{ color: '#666', fontSize: '12px' }}>#{sale.invoiceNumber || 'N/A'}</small>
                    </td>
                    <td>
                      <div>{sale.customerName || 'Walk-in Customer'}</div>
                      {sale.customerContact && (
                        <small style={{ color: '#666', fontSize: '12px' }}>{sale.customerContact}</small>
                      )}
                    </td>
                    <td>{sale.products?.length || 0} item(s)</td>
                    <td style={{ fontWeight: '600' }}>{formatCurrency(sale.totalAmount)}</td>
                    <td style={{ color: '#059669', fontWeight: '600' }}>{formatCurrency(paidAmount)}</td>
                    <td style={{ color: dueAmount > 0 ? '#dc2626' : '#6b7280', fontWeight: '600' }}>
                      {formatCurrency(dueAmount)}
                    </td>
                    <td>
                      <span className={`payment-status-badge ${sale.paymentStatus || 'paid'}`}>
                        {(sale.paymentStatus || 'paid').toUpperCase()}
                      </span>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                  No sales data found for the selected filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports;
