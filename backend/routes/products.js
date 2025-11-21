const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Product = require('../models/Product');

// Get all products with advanced filtering, pagination, and search
router.get('/', authMiddleware, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search,
      category,
      stockStatus,
      sortBy = 'name',
      sortOrder = 'asc',
      minPrice,
      maxPrice
    } = req.query;

    const query = { isActive: true };

    // Full-text search across multiple fields
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    if (category) query.category = category;
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Advanced stock status filtering
    if (stockStatus === 'low_stock') {
      query.$expr = { $lte: ['$quantity', '$lowStockThreshold'] };
    } else if (stockStatus === 'out_of_stock') {
      query.quantity = 0;
    } else if (stockStatus === 'in_stock') {
      query.quantity = { $gt: 0 };
      query.$expr = { $gt: ['$quantity', '$lowStockThreshold'] };
    } else if (stockStatus === 'reorder') {
      query.$expr = { $lte: ['$quantity', '$reorderLevel'] };
    }

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const products = await Product.find(query)
      .sort(sort)
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Product.countDocuments(query);

    res.json({
      products,
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

// Get comprehensive product statistics
router.get('/statistics', authMiddleware, async (req, res) => {
  try {
    const stats = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalInventoryValue: { $sum: { $multiply: ['$quantity', '$costPrice'] } },
          totalRetailValue: { $sum: { $multiply: ['$quantity', '$price'] } },
          potentialProfit: {
            $sum: {
              $multiply: ['$quantity', { $subtract: ['$price', '$costPrice'] }]
            }
          },
          avgMargin: {
            $avg: {
              $multiply: [
                {
                  $divide: [
                    { $subtract: ['$price', '$costPrice'] },
                    '$costPrice'
                  ]
                },
                100
              ]
            }
          },
          lowStockCount: {
            $sum: { $cond: [{ $lte: ['$quantity', '$lowStockThreshold'] }, 1, 0] }
          },
          outOfStockCount: {
            $sum: { $cond: [{ $eq: ['$quantity', 0] }, 1, 0] }
          }
        }
      }
    ]);

    const categoryStats = await Product.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          totalValue: { $sum: { $multiply: ['$quantity', '$costPrice'] } },
          avgPrice: { $avg: '$price' }
        }
      },
      { $sort: { totalValue: -1 } }
    ]);

    const topProducts = await Product.find({ isActive: true })
      .sort({ quantity: -1 })
      .limit(10)
      .select('name quantity price costPrice');

    res.json({
      overall: stats[0] || {},
      byCategory: categoryStats,
      topByQuantity: topProducts
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get low stock alerts
router.get('/alerts/low-stock', authMiddleware, async (req, res) => {
  try {
    const products = await Product.find({
      isActive: true,
      $expr: { $lte: ['$quantity', '$lowStockThreshold'] }
    }).sort({ quantity: 1 });

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all unique categories
router.get('/data/categories', authMiddleware, async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });
    res.json(categories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Export products data for reporting
router.get('/export/all', authMiddleware, async (req, res) => {
  try {
    const products = await Product.find({ isActive: true })
      .select('name sku category quantity price costPrice lowStockThreshold barcode unit')
      .sort({ name: 1 });

    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single product with full details and stock history
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create product
router.post('/', authMiddleware, async (req, res) => {
  try {
    const product = new Product({
      ...req.body,
      createdBy: req.userId || 'admin123',
      updatedBy: req.userId || 'admin123'
    });

    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error('Product creation error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'SKU or Barcode already exists' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message, errors: error.errors });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update product
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        updatedBy: req.userId,
        updatedAt: Date.now()
      },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'SKU or Barcode already exists' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// Adjust stock manually
router.post('/:id/adjust-stock', authMiddleware, async (req, res) => {
  try {
    const { adjustment, type, reason, notes } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const oldQuantity = product.quantity;
    product.quantity += adjustment;

    if (product.quantity < 0) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    // Add to stock history
    product.stockHistory.push({
      date: new Date(),
      quantity: adjustment,
      type: type || (adjustment > 0 ? 'in' : 'out'),
      reference: `Manual adjustment by user`,
      notes: notes || reason
    });

    product.updatedBy = req.userId;
    await product.save();

    res.json({
      message: 'Stock adjusted successfully',
      oldQuantity,
      newQuantity: product.quantity,
      adjustment,
      product
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete product (soft delete)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false, updatedBy: req.userId },
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk update prices
router.post('/bulk/update-prices', authMiddleware, async (req, res) => {
  try {
    const { productIds, priceChange, type } = req.body; // type: 'increase', 'decrease', 'set'

    const products = await Product.find({ _id: { $in: productIds } });

    for (const product of products) {
      if (type === 'increase') {
        product.price += priceChange;
      } else if (type === 'decrease') {
        product.price = Math.max(0, product.price - priceChange);
      } else if (type === 'set') {
        product.price = priceChange;
      }
      product.updatedBy = req.userId;
      await product.save();
    }

    res.json({ message: `Updated ${products.length} products`, count: products.length });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
