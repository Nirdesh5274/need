import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import { formatCurrency, formatQuantity, parseNumber } from '../utils/currency';
import '../styles/common.css';
import './Inventory.css';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    total: 0,
    pages: 0
  });
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: 0,
    unit: 'kg',
    price: 0,
    lowStockThreshold: 10
  });
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async (page = 1) => {
    try {
      const params = {
        page,
        limit: 20,
        search: searchTerm,
        category: categoryFilter,
        stockStatus: stockFilter
      };
      const response = await api.get('/products', { params });
      if (response.data.products) {
        setProducts(response.data.products);
        setPagination(response.data.pagination);
      } else {
        setProducts(response.data);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
    }
  };
  
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts();
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, categoryFilter, stockFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/products/${editingId}`, formData);
      } else {
        await api.post('/products', formData);
      }
      fetchProducts();
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
      alert(error.response?.data?.message || 'Error saving product');
    }
  };

  const handleEdit = (product) => {
    setFormData(product);
    setEditingId(product._id);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${id}`);
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Error deleting product');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      quantity: 0,
      unit: 'kg',
      price: 0,
      lowStockThreshold: 10
    });
    setEditingId(null);
    setShowModal(false);
  };

  if (loading) return <div className="loading">Loading...</div>;

  const getStockStatus = (product) => {
    if (product.quantity === 0) return { label: 'Out of Stock', class: 'danger' };
    if (product.quantity <= product.lowStockThreshold) return { label: 'Low Stock', class: 'warning' };
    return { label: 'In Stock', class: 'success' };
  };

  return (
    <div className="inventory">
      <div className="page-header">
        <span style={{ fontSize: '28px' }}>📦</span>
        <h1>Inventory Management</h1>
        <button className="btn-add" onClick={() => setShowModal(true)} style={{ marginLeft: 'auto' }}>
          <FiPlus /> Add Product
        </button>
      </div>

      <div className="search-box">
        <FiSearch />
        <input
          type="text"
          placeholder="Search products by name, SKU, category..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          <label>Category</label>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            <option value="Raw Materials">Raw Materials</option>
            <option value="Finished Goods">Finished Goods</option>
            <option value="Equipment">Equipment</option>
            <option value="Supplies">Supplies</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="filter-group">
          <label>Stock Status</label>
          <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Unit</th>
              <th>Price</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length > 0 ? (
              products.map((product) => {
                const status = getStockStatus(product);
                return (
                  <tr key={product._id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{product.name}</div>
                    </td>
                    <td>{product.category || '-'}</td>
                    <td><strong>{product.quantity}</strong></td>
                    <td style={{ textTransform: 'uppercase', fontSize: '12px', color: '#6b7280', fontWeight: 600 }}>
                      {product.unit || 'kg'}
                    </td>
                    <td style={{ fontWeight: 600, color: '#7c3aed' }}>{formatCurrency(product.price)}</td>
                    <td>
                      <span className={`status ${status.class}`}>
                        {status.label}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-icon" onClick={() => handleEdit(product)} title="Edit">
                          <FiEdit2 />
                        </button>
                        <button className="btn-icon delete" onClick={() => handleDelete(product._id)} title="Delete">
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                  No products found. Add your first product to get started!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => fetchProducts(pagination.current - 1)}
            disabled={pagination.current === 1}
          >
            Previous
          </button>
          <span>
            Page {pagination.current} of {pagination.pages}
          </span>
          <button 
            onClick={() => fetchProducts(pagination.current + 1)}
            disabled={pagination.current === pagination.pages}
          >
            Next
          </button>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingId ? 'Edit Product' : 'Add New Product'}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Category *</label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Quantity *</label>
                  <input
                    type="number"
                    step="0.001"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseNumber(e.target.value) })}
                    placeholder="Enter quantity"
                  />
                </div>
                <div className="form-group">
                  <label>Unit *</label>
                  <select
                    required
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  >
                    <option value="kg">Kilogram (kg)</option>
                    <option value="pcs">Pieces</option>
                    <option value="l">Liter (l)</option>
                    <option value="g">Gram (g)</option>
                    <option value="ml">Milliliter (ml)</option>
                    <option value="box">Box</option>
                    <option value="pack">Pack</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Price *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseNumber(e.target.value) })}
                  placeholder="Enter selling price"
                />
              </div>
              <div className="form-group">
                <label>Low Stock Threshold</label>
                <input
                  type="number"
                  value={formData.lowStockThreshold}
                  onChange={(e) => setFormData({ ...formData, lowStockThreshold: Number(e.target.value) })}
                />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  {editingId ? 'Update' : 'Add'} Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
