const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Sale = require('../models/Sale');
const Expense = require('../models/Expense');
const Product = require('../models/Product');

// Get comprehensive dashboard summary with trend analysis
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, compareWithPrevious } = req.query;
    const dateFilter = {};

    if (startDate && endDate) {
      dateFilter.saleDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Current period - Sales
    const salesData = await Sale.aggregate([
      { $match: dateFilter },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$totalAmount' }, 
          count: { $sum: 1 },
          avgOrderValue: { $avg: '$totalAmount' },
          totalProfit: { $sum: '$profit' }
        } 
      }
    ]);

    // Current period - Expenses
    const expenseFilter = startDate && endDate ? {
      expenseDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    } : {};

    const expensesData = await Expense.aggregate([
      { $match: expenseFilter },
      { 
        $group: { 
          _id: null, 
          total: { $sum: '$amount' }, 
          count: { $sum: 1 },
          avgExpense: { $avg: '$amount' }
        } 
      }
    ]);

    // Inventory metrics
    const totalProducts = await Product.countDocuments({ isActive: true });
    const lowStockProducts = await Product.countDocuments({
      isActive: true,
      $expr: { $lte: ['$quantity', '$lowStockThreshold'] }
    });
    const outOfStockProducts = await Product.countDocuments({
      isActive: true,
      quantity: 0
    });

    const inventoryValue = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalCostValue: { $sum: { $multiply: ['$quantity', '$costPrice'] } },
          totalRetailValue: { $sum: { $multiply: ['$quantity', '$price'] } }
        }
      }
    ]);

    const totalSales = salesData.length > 0 ? salesData[0].total : 0;
    const totalExpenses = expensesData.length > 0 ? expensesData[0].total : 0;
    const netProfit = totalSales - totalExpenses;

    // Payment status breakdown
    const paymentBreakdown = await Sale.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    res.json({
      sales: {
        total: totalSales,
        count: salesData.length > 0 ? salesData[0].count : 0,
        avgOrderValue: salesData.length > 0 ? salesData[0].avgOrderValue : 0,
        totalProfit: salesData.length > 0 ? salesData[0].totalProfit : 0
      },
      expenses: {
        total: totalExpenses,
        count: expensesData.length > 0 ? expensesData[0].count : 0,
        avgExpense: expensesData.length > 0 ? expensesData[0].avgExpense : 0
      },
      profit: {
        netProfit,
        profitMargin: totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(2) : 0
      },
      inventory: {
        totalProducts,
        lowStockCount: lowStockProducts,
        outOfStockCount: outOfStockProducts,
        totalCostValue: inventoryValue.length > 0 ? inventoryValue[0].totalCostValue : 0,
        totalRetailValue: inventoryValue.length > 0 ? inventoryValue[0].totalRetailValue : 0
      },
      paymentBreakdown
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get detailed sales report with trend analysis
router.get('/sales', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'daily' } = req.query;
    const matchFilter = {};

    if (startDate && endDate) {
      matchFilter.saleDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    let groupByField;
    if (groupBy === 'daily') {
      groupByField = { $dateToString: { format: '%Y-%m-%d', date: '$saleDate' } };
    } else if (groupBy === 'weekly') {
      groupByField = { 
        year: { $year: '$saleDate' },
        week: { $week: '$saleDate' }
      };
    } else if (groupBy === 'monthly') {
      groupByField = { $dateToString: { format: '%Y-%m', date: '$saleDate' } };
    } else if (groupBy === 'yearly') {
      groupByField = { $year: '$saleDate' };
    }

    const salesReport = await Sale.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: groupByField,
          totalSales: { $sum: '$totalAmount' },
          count: { $sum: 1 },
          avgOrderValue: { $avg: '$totalAmount' },
          totalProfit: { $sum: '$profit' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Top products by revenue
    const topProducts = await Sale.aggregate([
      { $match: matchFilter },
      { $unwind: '$products' },
      {
        $group: {
          _id: '$products.product',
          totalRevenue: { $sum: '$products.total' },
          totalQuantity: { $sum: '$products.quantity' }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'product'
        }
      },
      { $unwind: '$product' },
      {
        $project: {
          name: '$product.name',
          sku: '$product.sku',
          totalRevenue: 1,
          totalQuantity: 1
        }
      }
    ]);

    // Payment method breakdown
    const byPaymentMethod = await Sale.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          total: { $sum: '$totalAmount' }
        }
      },
      { $sort: { total: -1 } }
    ]);

    res.json({
      timeSeries: salesReport,
      topProducts,
      byPaymentMethod
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get detailed expenses report with category breakdown
router.get('/expenses', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'daily' } = req.query;
    const matchFilter = {};

    if (startDate && endDate) {
      matchFilter.expenseDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // By category with subcategories
    const expensesByCategory = await Expense.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: {
            category: '$category',
            subcategory: '$subcategory'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          avgAmount: { $avg: '$amount' }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Time series
    let groupByField;
    if (groupBy === 'daily') {
      groupByField = { $dateToString: { format: '%Y-%m-%d', date: '$expenseDate' } };
    } else if (groupBy === 'monthly') {
      groupByField = { $dateToString: { format: '%Y-%m', date: '$expenseDate' } };
    } else if (groupBy === 'yearly') {
      groupByField = { $year: '$expenseDate' };
    }

    const expensesTimeSeries = await Expense.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: groupByField,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // By department
    const byDepartment = await Expense.aggregate([
      { $match: { ...matchFilter, department: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$department',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);

    // Top vendors
    const topVendors = await Expense.aggregate([
      { $match: { ...matchFilter, 'vendor.name': { $exists: true } } },
      {
        $group: {
          _id: '$vendor.name',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } },
      { $limit: 10 }
    ]);

    // Payment status summary
    const paymentStatus = await Expense.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$paymentStatus',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      byCategory: expensesByCategory,
      timeSeries: expensesTimeSeries,
      byDepartment,
      topVendors,
      paymentStatus
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get comprehensive profit/loss report
router.get('/profit-loss', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'monthly' } = req.query;
    
    let salesDateFilter = {};
    let expenseDateFilter = {};

    if (startDate && endDate) {
      salesDateFilter = {
        saleDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
      expenseDateFilter = {
        expenseDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    let groupByField;
    let salesGroupBy;
    let expensesGroupBy;

    if (groupBy === 'daily') {
      salesGroupBy = { $dateToString: { format: '%Y-%m-%d', date: '$saleDate' } };
      expensesGroupBy = { $dateToString: { format: '%Y-%m-%d', date: '$expenseDate' } };
    } else if (groupBy === 'monthly') {
      salesGroupBy = { $dateToString: { format: '%Y-%m', date: '$saleDate' } };
      expensesGroupBy = { $dateToString: { format: '%Y-%m', date: '$expenseDate' } };
    } else if (groupBy === 'yearly') {
      salesGroupBy = { $year: '$saleDate' };
      expensesGroupBy = { $year: '$expenseDate' };
    }

    const salesByPeriod = await Sale.aggregate([
      { $match: salesDateFilter },
      {
        $group: {
          _id: salesGroupBy,
          totalRevenue: { $sum: '$totalAmount' },
          totalProfit: { $sum: '$profit' },
          salesCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const expensesByPeriod = await Expense.aggregate([
      { $match: expenseDateFilter },
      {
        $group: {
          _id: expensesGroupBy,
          totalExpenses: { $sum: '$amount' },
          expensesCount: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Merge data
    const profitLossData = {};
    
    salesByPeriod.forEach(item => {
      profitLossData[item._id] = {
        period: item._id,
        revenue: item.totalRevenue,
        grossProfit: item.totalProfit,
        expenses: 0,
        netProfit: 0,
        salesCount: item.salesCount,
        expensesCount: 0
      };
    });

    expensesByPeriod.forEach(item => {
      if (!profitLossData[item._id]) {
        profitLossData[item._id] = {
          period: item._id,
          revenue: 0,
          grossProfit: 0,
          expenses: 0,
          netProfit: 0,
          salesCount: 0,
          expensesCount: 0
        };
      }
      profitLossData[item._id].expenses = item.totalExpenses;
      profitLossData[item._id].expensesCount = item.expensesCount;
    });

    // Calculate net profit and margins
    Object.keys(profitLossData).forEach(key => {
      const data = profitLossData[key];
      data.netProfit = data.revenue - data.expenses;
      data.profitMargin = data.revenue > 0 ? ((data.netProfit / data.revenue) * 100).toFixed(2) : 0;
    });

    const sortedData = Object.values(profitLossData).sort((a, b) => 
      a.period > b.period ? 1 : -1
    );

    res.json({
      data: sortedData,
      summary: {
        totalRevenue: sortedData.reduce((sum, item) => sum + item.revenue, 0),
        totalExpenses: sortedData.reduce((sum, item) => sum + item.expenses, 0),
        totalNetProfit: sortedData.reduce((sum, item) => sum + item.netProfit, 0)
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get comprehensive inventory report
router.get('/inventory', authMiddleware, async (req, res) => {
  try {
    const { category, stockStatus } = req.query;
    
    let filter = { isActive: true };
    if (category) filter.category = category;

    const products = await Product.find(filter).sort({ quantity: 1 });
    
    // Overall metrics
    const totalValue = products.reduce((sum, product) => {
      return sum + (product.quantity * product.costPrice);
    }, 0);

    const totalRetailValue = products.reduce((sum, product) => {
      return sum + (product.quantity * product.price);
    }, 0);

    const potentialProfit = totalRetailValue - totalValue;

    // Stock status breakdown
    const lowStock = products.filter(p => p.quantity > 0 && p.quantity <= p.lowStockThreshold);
    const outOfStock = products.filter(p => p.quantity === 0);
    const inStock = products.filter(p => p.quantity > p.lowStockThreshold);

    // By category
    const byCategory = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: { $multiply: ['$quantity', '$costPrice'] } },
          avgPrice: { $avg: '$price' }
        }
      },
      { $sort: { totalValue: -1 } }
    ]);

    // Slow moving products (low quantity and old stock)
    const slowMoving = products
      .filter(p => p.quantity > 0 && p.quantity < 10)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      .slice(0, 20);

    // Fast moving (need reordering soon)
    const fastMoving = products
      .filter(p => p.quantity > 0 && p.reorderLevel && p.quantity <= p.reorderLevel)
      .slice(0, 20);

    res.json({
      summary: {
        totalProducts: products.length,
        totalValue,
        totalRetailValue,
        potentialProfit,
        lowStockCount: lowStock.length,
        outOfStockCount: outOfStock.length,
        inStockCount: inStock.length
      },
      stockStatus: {
        lowStock: lowStock.slice(0, 50),
        outOfStock: outOfStock.slice(0, 50),
        inStock: inStock.length
      },
      byCategory,
      slowMoving,
      fastMoving
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get cash flow report
router.get('/cash-flow', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let salesDateFilter = {};
    let expenseDateFilter = {};

    if (startDate && endDate) {
      salesDateFilter = {
        saleDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
      expenseDateFilter = {
        expenseDate: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    // Cash inflow by payment status
    const cashInflow = await Sale.aggregate([
      { $match: salesDateFilter },
      {
        $group: {
          _id: '$paymentStatus',
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Cash outflow by payment status
    const cashOutflow = await Expense.aggregate([
      { $match: expenseDateFilter },
      {
        $group: {
          _id: '$paymentStatus',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const paidInflow = cashInflow.find(item => item._id === 'paid') || { total: 0 };
    const paidOutflow = cashOutflow.find(item => item._id === 'paid') || { total: 0 };

    res.json({
      inflow: cashInflow,
      outflow: cashOutflow,
      netCashFlow: paidInflow.total - paidOutflow.total,
      receivables: (cashInflow.find(item => item._id === 'pending') || { total: 0 }).total,
      payables: (cashOutflow.find(item => item._id === 'pending') || { total: 0 }).total
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Export comprehensive data for external reporting
router.get('/export/all', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let dateFilter = {};
    if (startDate && endDate) {
      dateFilter = {
        $or: [
          { saleDate: { $gte: new Date(startDate), $lte: new Date(endDate) } },
          { expenseDate: { $gte: new Date(startDate), $lte: new Date(endDate) } }
        ]
      };
    }

    const sales = await Sale.find(
      startDate && endDate ? { saleDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } : {}
    )
      .populate('products.product', 'name sku')
      .select('invoiceNumber saleDate totalAmount paymentMethod paymentStatus')
      .sort({ saleDate: -1 });

    const expenses = await Expense.find(
      startDate && endDate ? { expenseDate: { $gte: new Date(startDate), $lte: new Date(endDate) } } : {}
    )
      .select('expenseNumber expenseDate amount category paymentMethod paymentStatus')
      .sort({ expenseDate: -1 });

    const products = await Product.find({ isActive: true })
      .select('name sku category quantity price costPrice lowStockThreshold')
      .sort({ name: 1 });

    res.json({
      sales,
      expenses,
      products,
      exportDate: new Date(),
      dateRange: { startDate, endDate }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
