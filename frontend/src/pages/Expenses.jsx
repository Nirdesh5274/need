import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { FiPlus, FiTrash2, FiSearch, FiFilter, FiEdit2 } from 'react-icons/fi';
import { format } from 'date-fns';
import { formatCurrency, parseNumber } from '../utils/currency';
import '../styles/common.css';
import './Expenses.css';

const Expenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: 0,
    category: 'other',
    paymentMethod: 'cash',
    vendor: '',
    notes: '',
    expenseDate: new Date().toISOString().split('T')[0]
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const response = await api.get('/expenses');
      setExpenses(response.data.expenses || response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/expenses/${editingId}`, formData);
      } else {
        await api.post('/expenses', formData);
      }
      fetchExpenses();
      resetForm();
    } catch (error) {
      console.error('Error saving expense:', error);
      alert('Error saving expense');
    }
  };

  const handleEdit = (expense) => {
    setFormData({
      ...expense,
      expenseDate: new Date(expense.expenseDate).toISOString().split('T')[0]
    });
    setEditingId(expense._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await api.delete(`/expenses/${id}`);
        fetchExpenses();
      } catch (error) {
        console.error('Error deleting expense:', error);
        alert('Error deleting expense');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      amount: 0,
      category: 'other',
      paymentMethod: 'cash',
      vendor: '',
      notes: '',
      expenseDate: new Date().toISOString().split('T')[0]
    });
    setEditingId(null);
    setShowModal(false);
  };

  const getCategoryLabel = (category) => {
    const labels = {
      rent: 'Rent',
      utilities: 'Utilities',
      salaries: 'Salaries',
      raw_materials: 'Raw Materials',
      maintenance: 'Maintenance',
      transportation: 'Transportation',
      marketing: 'Marketing',
      other: 'Other'
    };
    return labels[category] || category;
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="expenses">
      <div className="page-header">
        <h1>Expenses Management</h1>
        <button className="btn-add" onClick={() => setShowModal(true)} style={{ marginLeft: 'auto' }}>
          <FiPlus /> Add Expense
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Title</th>
              <th>Category</th>
              <th>Vendor</th>
              <th>Amount</th>
              <th>Payment Method</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense._id}>
                <td>{format(new Date(expense.expenseDate), 'MMM dd, yyyy')}</td>
                <td>{expense.title}</td>
                <td>
                  <span className="badge category">{getCategoryLabel(expense.category)}</span>
                </td>
                <td>{expense.vendor || '-'}</td>
                <td className="amount expense">{formatCurrency(expense.amount)}</td>
                <td>
                  <span className="badge">{expense.paymentMethod}</span>
                </td>
                <td>
                  <button className="btn-icon" onClick={() => handleEdit(expense)}>
                    <FiEdit2 />
                  </button>
                  <button className="btn-icon delete" onClick={() => handleDelete(expense._id)}>
                    <FiTrash2 />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? 'Edit Expense' : 'Add New Expense'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Expense title"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    <option value="rent">Rent</option>
                    <option value="utilities">Utilities</option>
                    <option value="salaries">Salaries</option>
                    <option value="raw_materials">Raw Materials</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="transportation">Transportation</option>
                    <option value="marketing">Marketing</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Payment Method *</label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    required
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Expense Date *</label>
                  <input
                    type="date"
                    value={formData.expenseDate}
                    onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Vendor</label>
                <input
                  type="text"
                  value={formData.vendor}
                  onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                  placeholder="Vendor name"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Expense description"
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  {editingId ? 'Update' : 'Add'} Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
