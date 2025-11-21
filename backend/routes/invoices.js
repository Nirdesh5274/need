const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Sale = require('../models/Sale');

// Generate and download invoice PDF
router.get('/generate/:saleId', authMiddleware, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.saleId).populate('products.product');
    
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Generate HTML invoice
    const invoiceHTML = generateInvoiceHTML(sale);
    
    res.json({
      html: invoiceHTML,
      sale: sale
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get invoice data
router.get('/data/:saleId', authMiddleware, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.saleId).populate('products.product');
    
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    res.json(sale);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

function generateInvoiceHTML(sale) {
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatQuantity = (quantity, unit) => {
    const decimals = ['kg', 'g', 'l', 'ml'].includes(unit) ? 3 : 2;
    return `${Number(quantity).toFixed(decimals)} ${unit}`;
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Invoice ${sale.invoiceNumber}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: 'Segoe UI', Arial, sans-serif; 
          padding: 40px; 
          color: #333;
          background: #f5f5f5;
        }
        .invoice-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          padding: 40px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .print-button {
          position: fixed;
          top: 20px;
          right: 20px;
          padding: 12px 24px;
          background: #059669;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          box-shadow: 0 2px 8px rgba(5, 150, 105, 0.3);
          transition: all 0.2s;
        }
        .print-button:hover {
          background: #047857;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(5, 150, 105, 0.4);
        }
        .invoice-header {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 3px solid #059669;
        }
        .company-info h1 {
          color: #059669;
          font-size: 32px;
          margin-bottom: 8px;
          font-weight: 700;
        }
        .company-info p {
          color: #666;
          font-size: 14px;
          line-height: 1.6;
        }
        .invoice-meta {
          text-align: right;
        }
        .invoice-meta h2 {
          color: #333;
          font-size: 24px;
          margin-bottom: 10px;
        }
        .invoice-meta p {
          color: #666;
          font-size: 14px;
          margin-bottom: 5px;
        }
        .invoice-details {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
        }
        .detail-section h3 {
          color: #333;
          font-size: 16px;
          margin-bottom: 10px;
        }
        .detail-section p {
          color: #666;
          font-size: 14px;
          line-height: 1.6;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        thead {
          background: #f0fdf4;
        }
        th {
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #059669;
          border-bottom: 2px solid #059669;
        }
        td {
          padding: 12px;
          border-bottom: 1px solid #e5e7eb;
          color: #666;
        }
        .text-right {
          text-align: right;
        }
        .totals-section {
          margin-left: auto;
          width: 350px;
          margin-top: 20px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          font-size: 14px;
        }
        .total-row.grand-total {
          font-size: 20px;
          font-weight: bold;
          color: #059669;
          padding-top: 12px;
          border-top: 2px solid #059669;
          margin-top: 8px;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        .badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
        }
        .badge.paid {
          background: #d1fae5;
          color: #059669;
        }
        .badge.pending {
          background: #fef3c7;
          color: #d97706;
        }
        @media print {
          body { padding: 0; background: white; }
          .invoice-container { box-shadow: none; }
          .print-button { display: none; }
        }
      </style>
    </head>
    <body>
      <button class="print-button" onclick="window.print()">🖨️ Print Invoice</button>
      
      <div class="invoice-container">
        <div class="invoice-header">
          <div class="company-info">
            <h1>AZR</h1>
            <p><strong>Address:</strong> Maksudpur, Fatwah</p>
            <p><strong>GSTIN:</strong> [Your GST Number]</p>
            <p><strong>Email:</strong> info@azr.com</p>
          </div>
          <div class="invoice-meta">
            <h2>INVOICE</h2>
            <p><strong>Invoice #:</strong> ${sale.invoiceNumber}</p>
            <p><strong>Date:</strong> ${formatDate(sale.saleDate)}</p>
            <p><span class="badge ${sale.paymentStatus}">${sale.paymentStatus.toUpperCase()}</span></p>
          </div>
        </div>

        <div class="invoice-details">
          <div class="detail-section">
            <h3>Bill To:</h3>
            <p>
              <strong>${sale.customerName || sale.customer?.name || 'Walk-in Customer'}</strong><br>
              ${sale.customerContact || sale.customer?.phone || 'N/A'}<br>
              ${sale.customer?.email || ''}
            </p>
          </div>
          <div class="detail-section">
            <h3>Payment Details:</h3>
            <p>
              <strong>Method:</strong> ${sale.paymentMethod.toUpperCase()}<br>
              <strong>Status:</strong> ${sale.paymentStatus.toUpperCase()}
            </p>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Product</th>
              <th>SKU</th>
              <th class="text-right">Quantity</th>
              <th class="text-right">Unit Price (₹)</th>
              <th class="text-right">Total (₹)</th>
            </tr>
          </thead>
          <tbody>
            ${sale.products.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.product?.name || 'Product'}</td>
                <td>${item.product?.sku || '-'}</td>
                <td class="text-right">${formatQuantity(item.quantity, item.product?.unit || 'pcs')}</td>
                <td class="text-right">${formatCurrency(item.price)}</td>
                <td class="text-right">${formatCurrency(item.total)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals-section">
          <div class="total-row">
            <span>Subtotal:</span>
            <span>${formatCurrency(sale.subtotal || sale.totalAmount)}</span>
          </div>
          ${sale.totalDiscount && sale.totalDiscount > 0 ? `
            <div class="total-row" style="color: #dc2626;">
              <span>Discount:</span>
              <span>- ${formatCurrency(sale.totalDiscount)}</span>
            </div>
          ` : ''}
          ${sale.totalTax && sale.totalTax > 0 ? `
            <div class="total-row">
              <span>Tax:</span>
              <span>${formatCurrency(sale.totalTax)}</span>
            </div>
          ` : ''}
          ${sale.shippingCost && sale.shippingCost > 0 ? `
            <div class="total-row">
              <span>Shipping:</span>
              <span>${formatCurrency(sale.shippingCost)}</span>
            </div>
          ` : ''}
          <div class="total-row grand-total">
            <span>Total Amount:</span>
            <span>${formatCurrency(sale.totalAmount)}</span>
          </div>
          ${sale.paymentDetails ? `
            <div style="margin-top: 20px; padding-top: 20px; border-top: 2px solid #e5e7eb;">
              <div class="total-row" style="color: #059669;">
                <span>Paid Amount:</span>
                <span>${formatCurrency(sale.paymentDetails.paidAmount || 0)}</span>
              </div>
              ${sale.paymentDetails.pendingAmount > 0 ? `
                <div class="total-row" style="color: #dc2626; font-weight: 600;">
                  <span>Due Amount:</span>
                  <span>${formatCurrency(sale.paymentDetails.pendingAmount)}</span>
                </div>
              ` : ''}
            </div>
          ` : ''}
        </div>

        ${sale.paymentHistory && sale.paymentHistory.length > 0 ? `
          <div style="margin-top: 30px;">
            <h3 style="margin-bottom: 15px; color: #333;">Payment History:</h3>
            <table style="margin-bottom: 0;">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Payment Method</th>
                  <th class="text-right">Amount</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                ${sale.paymentHistory.map(payment => `
                  <tr>
                    <td>${formatDate(payment.date)}</td>
                    <td>${payment.method?.toUpperCase() || 'N/A'}</td>
                    <td class="text-right">${formatCurrency(payment.amount)}</td>
                    <td>${payment.notes || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        ` : ''}

        ${sale.notes ? `
          <div style="margin-top: 30px;">
            <h3 style="margin-bottom: 10px;">Notes:</h3>
            <p style="color: #666; font-size: 14px;">${sale.notes}</p>
          </div>
        ` : ''}

        <div class="footer">
          <p><strong>Thank you for your business!</strong></p>
          <p style="margin-top: 10px;">This is a computer-generated invoice and does not require a signature.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

module.exports = router;
