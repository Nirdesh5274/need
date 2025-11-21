import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { FiShoppingCart, FiSearch, FiTrash2, FiX, FiPrinter } from 'react-icons/fi';
import { formatCurrency, formatQuantity, parseNumber } from '../utils/currency';
import '../styles/common.css';
import './NewSale.css';

const NewSale = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState([]);
  const [discountType, setDiscountType] = useState('rupee'); // 'rupee' or 'percentage'
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [lastSaleId, setLastSaleId] = useState(null);
  const [formData, setFormData] = useState({
    customerName: '',
    customerContact: '',
    paymentMethod: 'cash',
    discount: 0,
    paidAmount: 0,
    notes: '',
    saleDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchProducts();
  }, []);

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

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.product._id === product._id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.product._id === product._id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { 
        product, 
        quantity: 1, 
        price: product.price 
      }]);
    }
  };

  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      setCart(cart.filter(item => item.product._id !== productId));
    } else {
      setCart(cart.map(item =>
        item.product._id === productId
          ? { ...item, quantity: parseNumber(quantity) }
          : item
      ));
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.product._id !== productId));
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateTotal = () => {
    const subtotal = calculateSubtotal();
    if (discountType === 'percentage') {
      const discountAmount = (subtotal * (formData.discount || 0)) / 100;
      return subtotal - discountAmount;
    }
    return subtotal - (formData.discount || 0);
  };

  const getDiscountAmount = () => {
    const subtotal = calculateSubtotal();
    if (discountType === 'percentage') {
      return (subtotal * (formData.discount || 0)) / 100;
    }
    return formData.discount || 0;
  };

  const clearCart = () => {
    if (window.confirm('Clear all items from cart?')) {
      setCart([]);
    }
  };

  const handleSubmit = async () => {
    if (cart.length === 0) {
      alert('Please add items to cart');
      return;
    }

    if (!formData.customerName.trim()) {
      alert('Please enter customer name');
      return;
    }

    try {
      const saleData = {
        products: cart.map(item => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.price
        })),
        customerName: formData.customerName,
        customerContact: formData.customerContact,
        paymentMethod: formData.paymentMethod,
        discount: formData.discount,
        paidAmount: formData.paidAmount || calculateTotal(),
        notes: formData.notes,
        saleDate: formData.saleDate
      };

      const response = await api.post('/sales', saleData);
      setLastSaleId(response.data._id);
      setShowInvoiceModal(true);
      
      // Reset form
      setCart([]);
      setDiscountType('rupee');
      setFormData({
        customerName: '',
        customerContact: '',
        paymentMethod: 'cash',
        discount: 0,
        paidAmount: 0,
        notes: '',
        saleDate: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      console.error('Error creating sale:', error);
      alert('❌ Error creating sale: ' + (error.response?.data?.message || error.message));
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

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="new-sale">
      <div className="page-header">
        <FiShoppingCart size={28} />
        <h1>New Sale</h1>
      </div>

      <div className="new-sale-grid">
        {/* Products Section */}
        <div className="products-panel">
          <div className="panel-header">
            <FiSearch size={20} />
            <h2>Select Products</h2>
          </div>
          
          <div className="search-box-inline">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="products-table">
            <table>
              <thead>
                <tr>
                  <th>PRODUCT</th>
                  <th>PRICE</th>
                  <th>AVAILABLE</th>
                  <th>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <div className="product-info">
                        <strong>{product.name}</strong>
                        <small>{product.category}</small>
                      </div>
                    </td>
                    <td className="price-cell">{formatCurrency(product.price)}</td>
                    <td>
                      <span className="stock-badge">
                        {formatQuantity(product.quantity, product.unit)} {product.unit || 'PIECE'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn-add-product"
                        onClick={() => addToCart(product)}
                        disabled={product.quantity <= 0}
                      >
                        ⊕ ADD
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cart Section */}
        <div className="cart-panel">
          <div className="panel-header cart-header">
            <FiShoppingCart size={20} />
            <h2>Cart ({cart.length})</h2>
            {cart.length > 0 && (
              <button className="btn-clear-cart" onClick={clearCart} title="Clear Cart">
                <FiTrash2 size={16} />
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="empty-cart">
              <FiShoppingCart size={48} style={{ opacity: 0.3 }} />
              <p>No items added</p>
              <small>Add products from the left panel</small>
            </div>
          ) : (
            <div className="cart-items">
              {cart.map((item) => (
                <div key={item.product._id} className="cart-item">
                  <div className="item-info">
                    <strong>{item.product.name}</strong>
                    <small>{formatCurrency(item.price)} × {item.quantity}</small>
                  </div>
                  <div className="item-controls">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateCartQuantity(item.product._id, e.target.value)}
                      min="0"
                      step={item.product.unit === 'kg' || item.product.unit === 'l' ? '0.001' : '1'}
                    />
                    <button 
                      className="btn-remove"
                      onClick={() => removeFromCart(item.product._id)}
                      title="Remove item"
                    >
                      <FiX size={18} />
                    </button>
                  </div>
                  <div className="item-total">
                    {formatCurrency(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="cart-summary">
            <div className="summary-row">
              <span>Subtotal:</span>
              <strong>{formatCurrency(calculateSubtotal())}</strong>
            </div>

            <div className="form-group-inline">
              <label>DISCOUNT</label>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input
                  type="number"
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: parseNumber(e.target.value) })}
                  min="0"
                  step="0.01"
                  placeholder={discountType === 'percentage' ? 'Enter %' : 'Enter amount'}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '2px solid #e5e7eb', fontSize: '14px' }}
                />
                <select 
                  value={discountType} 
                  onChange={(e) => setDiscountType(e.target.value)}
                  style={{ padding: '12px 16px', borderRadius: '8px', border: '2px solid #e5e7eb', fontSize: '13px', fontWeight: '600', cursor: 'pointer', background: 'white' }}
                >
                  <option value="rupee">₹ Rupee</option>
                  <option value="percentage">% Percent</option>
                </select>
              </div>
            </div>

            {formData.discount > 0 && (
              <div className="summary-row" style={{ color: '#dc2626', fontSize: '14px' }}>
                <span>Discount Amount:</span>
                <strong>- {formatCurrency(getDiscountAmount())}</strong>
              </div>
            )}

            <div className="summary-row total-row">
              <span>Total:</span>
              <strong className="total-amount">{formatCurrency(calculateTotal())}</strong>
            </div>

            <div className="form-group">
              <label>CUSTOMER NAME</label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="Enter customer name (optional)"
              />
            </div>

            <div className="form-group">
              <label>PHONE NUMBER (FOR SMS)</label>
              <input
                type="text"
                value={formData.customerContact}
                onChange={(e) => setFormData({ ...formData, customerContact: e.target.value })}
                placeholder="Optional"
              />
            </div>

            <div className="form-group">
              <label>AMOUNT PAID</label>
              <input
                type="number"
                value={formData.paidAmount}
                onChange={(e) => setFormData({ ...formData, paidAmount: parseNumber(e.target.value) })}
                placeholder="Enter amount received"
                step="0.01"
              />
              <small>Leave empty or enter full amount for full payment</small>
            </div>

            <div className="form-group">
              <label>PAYMENT METHOD</label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #e5e7eb', fontSize: '14px' }}
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="online">Online Transfer</option>
                <option value="cheque">Cheque</option>
              </select>
            </div>

            <button 
              className="btn-complete-sale"
              onClick={handleSubmit}
              disabled={cart.length === 0}
            >
              ✓ COMPLETE SALE
            </button>
          </div>
        </div>
      </div>

      {showInvoiceModal && lastSaleId && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px', textAlign: 'center' }}>
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>✅</div>
            <h2 style={{ color: '#059669', marginBottom: '16px', fontSize: '28px' }}>Sale Completed!</h2>
            <p style={{ color: '#6b7280', fontSize: '16px', marginBottom: '30px' }}>
              The sale has been recorded successfully.
            </p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button 
                className="btn-submit" 
                onClick={() => {
                  generateInvoice(lastSaleId);
                  setShowInvoiceModal(false);
                  setLastSaleId(null);
                }}
                style={{ width: '100%', padding: '16px', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                <FiPrinter size={20} />
                Print Invoice
              </button>
              
              <button 
                className="btn-cancel" 
                onClick={() => {
                  setShowInvoiceModal(false);
                  setLastSaleId(null);
                }}
                style={{ width: '100%', padding: '16px', fontSize: '16px' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewSale;
