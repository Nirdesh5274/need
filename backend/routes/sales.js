const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Sale = require('../models/Sale');
const Product = require('../models/Product');

// Get all sales with advanced filtering and pagination
router.get('/', authMiddleware, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      startDate,
      endDate,
      paymentStatus,
      deliveryStatus,
      search,
      minAmount,
      maxAmount,
      sortBy = 'saleDate',
      sortOrder = 'desc'
    } = req.query;

    let query = {};

    // Date range filter
    if (startDate && endDate) {
      query.saleDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.saleDate = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.saleDate = { $lte: new Date(endDate) };
    }

    // Payment status filter
    if (paymentStatus) query.paymentStatus = paymentStatus;

    // Delivery status filter
    if (deliveryStatus) query.deliveryStatus = deliveryStatus;

    // Search by invoice number or customer name
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'customer.name': { $regex: search, $options: 'i' } },
        { 'customer.phone': { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } }
      ];
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      query.totalAmount = {};
      if (minAmount) query.totalAmount.$gte = parseFloat(minAmount);
      if (maxAmount) query.totalAmount.$lte = parseFloat(maxAmount);
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const sales = await Sale.find(query)
      .populate('products.product', 'name sku')
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Sale.countDocuments(query);

    res.json({
      sales,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        total,
        hasMore: parseInt(page) * parseInt(limit) < total
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get sales analytics
router.get('/analytics/summary', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let matchQuery = {};
    if (startDate && endDate) {
      matchQuery.saleDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const analytics = await Sale.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: '$totalAmount' },
          avgOrderValue: { $avg: '$totalAmount' },
          totalProfit: { $sum: '$profit' },
          paidOrders: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] }
          },
          pendingPayments: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, '$totalAmount', 0] }
          }
        }
      }
    ]);

    // Sales by payment method
    const byPaymentMethod = await Sale.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$totalAmount' }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Top selling products
    const topProducts = await Sale.aggregate([
      { $match: matchQuery },
      { $unwind: '$products' },
      {
        $group: {
          _id: '$products.product',
          totalQuantity: { $sum: '$products.quantity' },
          totalRevenue: { $sum: '$products.total' },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' },
      {
        $project: {
          name: '$productDetails.name',
          sku: '$productDetails.sku',
          totalQuantity: 1,
          totalRevenue: 1,
          orderCount: 1
        }
      }
    ]);

    // Daily sales trend
    const dailyTrend = await Sale.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$saleDate' } },
          count: { $sum: 1 },
          revenue: { $sum: '$totalAmount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      summary: analytics[0] || {},
      byPaymentMethod,
      topProducts,
      dailyTrend
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single sale with full details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id).populate('products.product');
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    res.json(sale);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create sale with enhanced features
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { 
      products, 
      paymentMethod, 
      customer,
      customerName, 
      customerContact, 
      notes, 
      saleDate 
    } = req.body;

    // Validate products
    if (!products || products.length === 0) {
      return res.status(400).json({ message: 'At least one product is required' });
    }

    // Validate and calculate totals
    let subtotal = 0;
    const saleProducts = [];

    for (const item of products) {
      const product = await Product.findById(item.product);
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.product}` });
      }

      if (product.quantity < item.quantity) {
        return res.status(400).json({ 
          message: `Insufficient stock for ${product.name}. Available: ${product.quantity}` 
        });
      }

      const itemTotal = item.quantity * item.price;
      subtotal += itemTotal;

      saleProducts.push({
        product: product._id,
        quantity: Number(item.quantity),
        price: Number(item.price),
        total: itemTotal
      });

      // Update product quantity
      product.quantity -= item.quantity;
      if (product.stockHistory) {
        product.stockHistory.push({
          date: new Date(),
          quantity: -item.quantity,
          type: 'out',
          reference: 'Sale',
          notes: `Sold ${item.quantity} units`
        });
      }
      await product.save();
    }

    // Calculate discount and payment status
    const discount = req.body.discount || 0;
    const totalAmount = subtotal - discount;
    const paidAmount = req.body.paidAmount || totalAmount;
    const pendingAmount = totalAmount - paidAmount;
    
    let paymentStatus = 'paid';
    if (pendingAmount > 0) {
      paymentStatus = paidAmount > 0 ? 'partial' : 'pending';
    }

    const sale = new Sale({
      products: saleProducts,
      subtotal,
      totalAmount,
      totalDiscount: discount,
      totalTax: 0,
      shippingCost: 0,
      paymentMethod: paymentMethod || 'cash',
      paymentStatus,
      paymentDetails: {
        paidAmount,
        pendingAmount
      },
      paymentHistory: paidAmount > 0 ? [{
        date: new Date(),
        amount: paidAmount,
        method: paymentMethod || 'cash',
        notes: 'Initial payment'
      }] : [],
      customerName: customerName || customer?.name || '',
      customerContact: customerContact || customer?.phone || '',
      notes: notes || '',
      saleDate: saleDate || Date.now(),
      createdBy: req.userId || 'admin123'
    });

    await sale.save();
    await sale.populate('products.product');
    res.status(201).json(sale);
  } catch (error) {
    console.error('Error creating sale:', error);
    res.status(500).json({ 
      message: error.message || 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
    });
  }
});

// Update payment status
router.patch('/:id/payment-status', authMiddleware, async (req, res) => {
  try {
    const { paymentStatus, paymentDate, paymentAmount, paymentNotes, paymentMethod } = req.body;
    
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Update payment details
    if (paymentAmount) {
      const currentPaid = sale.paymentDetails?.paidAmount || 0;
      const newPaidAmount = currentPaid + Number(paymentAmount);
      const newPendingAmount = Math.max(0, sale.totalAmount - newPaidAmount);

      sale.paymentDetails = {
        paidAmount: newPaidAmount,
        pendingAmount: newPendingAmount
      };

      // Update payment status based on pending amount
      if (newPendingAmount === 0) {
        sale.paymentStatus = 'paid';
      } else if (newPaidAmount > 0) {
        sale.paymentStatus = 'partial';
      } else {
        sale.paymentStatus = 'pending';
      }

      // Record payment history
      sale.paymentHistory = sale.paymentHistory || [];
      sale.paymentHistory.push({
        date: new Date(),
        amount: Number(paymentAmount),
        method: paymentMethod || sale.paymentMethod,
        notes: paymentNotes || 'Additional payment received'
      });
    } else {
      sale.paymentStatus = paymentStatus;
    }
    
    if (paymentDate) sale.paymentDate = paymentDate;

    await sale.save();
    await sale.populate('products.product');
    res.json(sale);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update delivery status
router.patch('/:id/delivery-status', authMiddleware, async (req, res) => {
  try {
    const { deliveryStatus, deliveryDate, trackingNumber, courierName } = req.body;
    
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    sale.deliveryStatus = deliveryStatus;
    if (deliveryDate) sale.deliveryDate = deliveryDate;
    if (trackingNumber) sale.trackingNumber = trackingNumber;
    if (courierName) sale.courierName = courierName;

    await sale.save();
    res.json(sale);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete sale and restore inventory
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    // Restore product quantities
    for (const item of sale.products) {
      const product = await Product.findById(item.product);
      if (product) {
        product.quantity += item.quantity;
        product.stockHistory.push({
          date: new Date(),
          quantity: item.quantity,
          type: 'in',
          reference: 'Sale Cancellation',
          notes: `Restored ${item.quantity} units from cancelled sale`
        });
        await product.save();
      }
    }

    await Sale.findByIdAndDelete(req.params.id);
    res.json({ message: 'Sale deleted and inventory restored successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
