const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Expense = require('../models/Expense');

// Get all expenses with advanced filtering and pagination
router.get('/', authMiddleware, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      startDate,
      endDate,
      category,
      subcategory,
      paymentStatus,
      department,
      minAmount,
      maxAmount,
      search,
      sortBy = 'expenseDate',
      sortOrder = 'desc'
    } = req.query;

    let query = {};

    // Date range filter
    if (startDate && endDate) {
      query.expenseDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.expenseDate = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.expenseDate = { $lte: new Date(endDate) };
    }

    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (department) query.department = department;

    // Amount range filter
    if (minAmount || maxAmount) {
      query.amount = {};
      if (minAmount) query.amount.$gte = parseFloat(minAmount);
      if (maxAmount) query.amount.$lte = parseFloat(maxAmount);
    }

    // Search by expense number, title, description, vendor
    if (search) {
      query.$or = [
        { expenseNumber: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { 'vendor.name': { $regex: search, $options: 'i' } },
        { vendor: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const expenses = await Expense.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Expense.countDocuments(query);

    res.json({
      expenses,
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

// Get expense analytics
router.get('/analytics/summary', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let matchQuery = {};
    if (startDate && endDate) {
      matchQuery.expenseDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Overall summary
    const summary = await Expense.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalExpenses: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' },
          paidAmount: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$amount', 0] }
          },
          pendingAmount: {
            $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, '$amount', 0] }
          },
          taxDeductibleAmount: {
            $sum: { $cond: ['$taxDeductible', '$amount', 0] }
          }
        }
      }
    ]);

    // By category
    const byCategory = await Expense.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          total: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // By department
    const byDepartment = await Expense.aggregate([
      { $match: { ...matchQuery, department: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // By payment method
    const byPaymentMethod = await Expense.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Top vendors
    const topVendors = await Expense.aggregate([
      { $match: { ...matchQuery, 'vendor.name': { $exists: true } } },
      {
        $group: {
          _id: '$vendor.name',
          count: { $sum: 1 },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 10 }
    ]);

    // Monthly trend
    const monthlyTrend = await Expense.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            year: { $year: '$expenseDate' },
            month: { $month: '$expenseDate' }
          },
          count: { $sum: 1 },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      summary: summary[0] || {},
      byCategory,
      byDepartment,
      byPaymentMethod,
      topVendors,
      monthlyTrend
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get recurring expenses
router.get('/recurring/list', authMiddleware, async (req, res) => {
  try {
    const recurringExpenses = await Expense.find({
      'recurring.isRecurring': true,
      'recurring.isActive': true
    }).sort({ expenseDate: -1 });

    res.json(recurringExpenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get expenses pending approval
router.get('/approvals/pending', authMiddleware, async (req, res) => {
  try {
    const pendingExpenses = await Expense.find({
      'approval.required': true,
      'approval.status': 'pending'
    }).sort({ expenseDate: -1 });

    res.json(pendingExpenses);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single expense with full details
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    res.json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create expense with enhanced features
router.post('/', authMiddleware, async (req, res) => {
  try {
    const expense = new Expense({
      ...req.body,
      createdBy: 'admin'
    });

    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create recurring expense
router.post('/recurring/create', authMiddleware, async (req, res) => {
  try {
    const { 
      title, 
      description, 
      amount, 
      category, 
      subcategory,
      frequency, 
      startDate, 
      endDate,
      paymentMethod,
      vendor,
      department
    } = req.body;

    const expense = new Expense({
      title,
      description,
      amount,
      category,
      subcategory,
      paymentMethod,
      vendor,
      department,
      expenseDate: startDate || new Date(),
      recurring: {
        isRecurring: true,
        frequency,
        startDate: startDate || new Date(),
        endDate,
        isActive: true
      },
      createdBy: 'admin'
    });

    await expense.save();
    res.status(201).json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update expense
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const expense = await Expense.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: Date.now() },
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    res.json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update payment status
router.patch('/:id/payment-status', authMiddleware, async (req, res) => {
  try {
    const { paymentStatus, paymentDate, paymentReference } = req.body;
    
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    expense.paymentStatus = paymentStatus;
    if (paymentDate) expense.paymentDate = paymentDate;
    if (paymentReference) expense.paymentReference = paymentReference;

    await expense.save();
    res.json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Approve/reject expense
router.patch('/:id/approval', authMiddleware, async (req, res) => {
  try {
    const { status, comments } = req.body;
    
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    if (!expense.approval.required) {
      return res.status(400).json({ message: 'This expense does not require approval' });
    }

    expense.approval.status = status;
    expense.approval.approvedBy = req.userId;
    expense.approval.approvedDate = new Date();
    expense.approval.comments = comments;

    await expense.save();
    res.json(expense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete expense
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
