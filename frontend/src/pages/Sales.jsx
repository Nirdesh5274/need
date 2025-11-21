import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { FiPlus, FiFileText, FiDownload, FiSearch, FiFilter, FiPrinter } from 'react-icons/fi';
import { format } from 'date-fns';
import { formatCurrency, formatQuantity, parseNumber } from '../utils/currency';
import '../styles/common.css';
import './Sales.css';

const Sales = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedSale, setSelectedSale] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [formData, setFormData] = useState({
    products: [{ product: '', quantity: 1, price: 0 }],
    customerName: '',
    customerContact: '',
    paymentMethod: 'cash',
    discount: 0,
    paidAmount: 0,
    notes: '',
    saleDate: new Date().toISOString().split('T')[0]
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchSales();
    fetchProducts();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await api.get('/sales');
      const salesData = response.data.sales || response.data;
      setSales(Array.isArray(salesData) ? salesData : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching sales:', error);
      setSales([]);
      setLoading(false);
    }
  };

  const generateInvoice = async (saleId) => {
    try {
      const response = await api.get(`/invoices/generate/${saleId}`);
      const invoiceWindow = window.open('', '_blank');
      invoiceWindow.document.write(response.data.html);
      invoiceWindow.document.close();
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('Error generating invoice');
    }
  };

  const openPaymentModal = (sale) => {
    setSelectedSale(sale);
    setPaymentAmount(sale.paymentDetails?.pendingAmount || 0);
    setShowPaymentModal(true);
  };

  const handleAddPayment = async () => {
    try {
      if (!paymentAmount || paymentAmount <= 0) {
        alert('Please enter a valid payment amount');
        return;
      }

      const pendingAmount = selectedSale.paymentDetails?.pendingAmount || 0;
      const newPaidAmount = (selectedSale.paymentDetails?.paidAmount || 0) + parseNumber(paymentAmount);
      const newPendingAmount = Math.max(0, selectedSale.totalAmount - newPaidAmount);
      
      let newPaymentStatus = 'paid';
      if (newPendingAmount > 0) {
        newPaymentStatus = 'partial';
      }

      await api.patch(`/sales/${selectedSale._id}/payment-status`, {
        paymentAmount: parseNumber(paymentAmount),
        paymentStatus: newPaymentStatus,
        paymentNotes: 'Additional payment received',
        paymentMethod: selectedSale.paymentMethod
      });

      alert('✅ Payment added successfully!');
      setShowPaymentModal(false);
      setSelectedSale(null);
      setPaymentAmount(0);
      fetchSales();
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Error adding payment');
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      const productsData = response.data.products || response.data;
      setProducts(Array.isArray(productsData) ? productsData : []);
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  };

  const handleAddProduct = () => {
    setFormData({
      ...formData,
      products: [...formData.products, { product: '', quantity: 1, price: 0 }]
    });
  };

  const handleRemoveProduct = (index) => {
    const newProducts = formData.products.filter((_, i) => i !== index);
    setFormData({ ...formData, products: newProducts });
  };

  const handleProductChange = (index, field, value) => {
    const newProducts = [...formData.products];
    newProducts[index][field] = value;
    
    if (field === 'product') {
      const selectedProduct = products.find(p => p._id === value);
      if (selectedProduct) {
        newProducts[index].price = selectedProduct.price;
      }
    }
    
    setFormData({ ...formData, products: newProducts });
  };

  const calculateTotal = () => {
    return formData.products.reduce((sum, item) => {
      return sum + (item.quantity * item.price);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/sales', formData);
      fetchSales();
      
      // Ask user if they want to print invoice
      if (window.confirm('Sale created successfully! Do you want to print the invoice?')) {
        generateInvoice(response.data._id);
      }
      
      resetForm();
    } catch (error) {
      console.error('Error creating sale:', error);
      alert(error.response?.data?.message || 'Error creating sale');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this sale?')) {
      try {
        await api.delete(`/sales/${id}`);
        fetchSales();
      } catch (error) {
        console.error('Error deleting sale:', error);
        alert('Error deleting sale');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      products: [{ product: '', quantity: 1, price: 0 }],
      customerName: '',
      customerContact: '',
      paymentMethod: 'cash',
      discount: 0,
      paidAmount: 0,
      notes: '',
      saleDate: new Date().toISOString().split('T')[0]
    });
    setSearchTerm('');
    setShowModal(false);
  };

  const calculateSubtotal = () => {
    return formData.products.reduce((sum, item) => {
      return sum + (item.quantity * item.price);
    }, 0);
  };

  const calculateFinalTotal = () => {
    const subtotal = calculateSubtotal();
    return Math.max(0, subtotal - (formData.discount || 0));
  };

  const calculateDueAmount = () => {
    const total = calculateFinalTotal();
    return Math.max(0, total - (formData.paidAmount || 0));
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="sales">
      <div className="page-header">
        <h1>Sales Management</h1>
        <button className="btn-add" onClick={() => navigate('/sales/new')} style={{ marginLeft: 'auto' }}>
          <FiPlus /> New Sale
        </button>
      </div>

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
              <th>Actions</th>
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
                    <td className="amount">{formatCurrency(sale.totalAmount)}</td>
                    <td style={{ color: '#059669', fontWeight: '600' }}>{formatCurrency(paidAmount)}</td>
                    <td style={{ color: dueAmount > 0 ? '#dc2626' : '#6b7280', fontWeight: '600' }}>
                      {formatCurrency(dueAmount)}
                    </td>
                    <td>
                      <span className={`payment-status-badge ${sale.paymentStatus || 'paid'}`}>
                        {(sale.paymentStatus || 'paid').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button 
                          className="btn-icon" 
                          onClick={() => generateInvoice(sale._id)}
                          title="Print Invoice"
                          style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: 'white' }}
                        >
                          <FiPrinter />
                        </button>
                        {(sale.paymentStatus === 'partial' || sale.paymentStatus === 'pending') && (
                          <button 
                            className="btn-icon" 
                            onClick={() => openPaymentModal(sale)}
                            title="Add Payment"
                            style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: 'white' }}
                          >
                            💰
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#6b7280' }}>
                  <div>
                    <FiFileText style={{ fontSize: '48px', opacity: '0.3', marginBottom: '16px' }} />
                    <p style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>No sales yet</p>
                    <p style={{ fontSize: '14px' }}>Click "New Sale" to create your first sale</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={resetForm}>
          <div className="modal large" onClick={(e) => e.stopPropagation()}>
            <h2>New Sale</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Customer Name</label>
                  <input
                    type="text"
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Customer Contact</label>
                  <input
                    type="text"
                    value={formData.customerContact}
                    onChange={(e) => setFormData({ ...formData, customerContact: e.target.value })}
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
                  <label>Sale Date *</label>
                  <input
                    type="date"
                    value={formData.saleDate}
                    onChange={(e) => setFormData({ ...formData, saleDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="products-section">
                <div className="section-header">
                  <h3>Products</h3>
                  <button type="button" className="btn-small" onClick={handleAddProduct}>
                    <FiPlus /> Add Item
                  </button>
                </div>
                
                {formData.products.map((item, index) => {
                  const selectedProduct = products.find(p => p._id === item.product);
                  return (
                    <div key={index} className="product-row">
                      <div className="product-select-wrapper">
                        <select
                          value={item.product}
                          onChange={(e) => handleProductChange(index, 'product', e.target.value)}
                          required
                        >
                          <option value="">Select Product</option>
                          {products.map((product) => (
                            <option key={product._id} value={product._id}>
                              {product.name} - {product.category} (Stock: {formatQuantity(product.quantity, product.unit)} @ {formatCurrency(product.price)})
                            </option>
                          ))}
                        </select>
                        {selectedProduct && (
                          <small style={{ color: '#666', marginTop: '4px', display: 'block' }}>
                            Unit: {selectedProduct.unit.toUpperCase()} | Available: {formatQuantity(selectedProduct.quantity, selectedProduct.unit)}
                          </small>
                        )}
                      </div>
                      <div className="quantity-input-wrapper">
                        <input
                          type="number"
                          placeholder="Quantity"
                          min="0.001"
                          step={selectedProduct && ['kg', 'g', 'l', 'ml'].includes(selectedProduct.unit) ? '0.001' : '0.01'}
                          value={item.quantity}
                          onChange={(e) => handleProductChange(index, 'quantity', parseNumber(e.target.value))}
                          required
                        />
                        {selectedProduct && (
                          <span className="unit-badge">{selectedProduct.unit}</span>
                        )}
                      </div>
                      <input
                        type="number"
                        placeholder="Price (₹)"
                        step="0.01"
                        min="0"
                        value={item.price}
                        onChange={(e) => handleProductChange(index, 'price', parseNumber(e.target.value))}
                        required
                      />
                      <span className="item-total">{formatCurrency(item.quantity * item.price)}</span>
                      {formData.products.length > 1 && (
                        <button
                          type="button"
                          className="btn-remove"
                          onClick={() => handleRemoveProduct(index)}
                        >
                          <FiTrash2 />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="payment-summary">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span className="amount-value">{formatCurrency(calculateSubtotal())}</span>
                </div>
                <div className="summary-row discount-row">
                  <label>Discount:</label>
                  <div className="discount-input">
                    <span className="currency-symbol">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={calculateSubtotal()}
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: parseNumber(e.target.value) })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="summary-row total-row">
                  <span>Total:</span>
                  <span className="total-value">{formatCurrency(calculateFinalTotal())}</span>
                </div>
                <div className="summary-row paid-row">
                  <label>Amount Paid:</label>
                  <div className="discount-input">
                    <span className="currency-symbol">₹</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.paidAmount}
                      onChange={(e) => setFormData({ ...formData, paidAmount: parseNumber(e.target.value) })}
                      placeholder="Enter amount received"
                    />
                  </div>
                </div>
                {calculateDueAmount() > 0 && (
                  <div className="summary-row due-row">
                    <span>Due Amount:</span>
                    <span className="due-value">{formatCurrency(calculateDueAmount())}</span>
                  </div>
                )}
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={resetForm}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Complete Sale
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPaymentModal && selectedSale && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <h2>Add Payment</h2>
            <div style={{ marginBottom: '20px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#6b7280' }}>Customer:</span>
                <strong>{selectedSale.customerName || 'Walk-in Customer'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#6b7280' }}>Total Amount:</span>
                <strong>{formatCurrency(selectedSale.totalAmount)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ color: '#6b7280' }}>Already Paid:</span>
                <strong style={{ color: '#059669' }}>{formatCurrency(selectedSale.paymentDetails?.paidAmount || 0)}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '2px solid #e5e7eb', paddingTop: '8px', marginTop: '8px' }}>
                <span style={{ color: '#dc2626', fontWeight: '600' }}>Pending Amount:</span>
                <strong style={{ color: '#dc2626', fontSize: '18px' }}>{formatCurrency(selectedSale.paymentDetails?.pendingAmount || 0)}</strong>
              </div>
            </div>

            <div className="form-group">
              <label>Payment Amount *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(parseNumber(e.target.value))}
                placeholder="Enter payment amount"
                style={{ fontSize: '16px', padding: '12px' }}
              />
              <small>Enter the amount received from customer</small>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={() => setShowPaymentModal(false)}>
                Cancel
              </button>
              <button type="button" className="btn-submit" onClick={handleAddPayment}>
                Add Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
