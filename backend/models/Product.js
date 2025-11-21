const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    required: true,
    index: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 0,
    min: 0
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  costPrice: {
    type: Number,
    required: false,
    default: 0,
    min: 0
  },
  sku: {
    type: String,
    unique: true,
    sparse: true,
    uppercase: true
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true
  },
  lowStockThreshold: {
    type: Number,
    default: 10
  },
  unit: {
    type: String,
    default: 'pcs',
    enum: ['pcs', 'kg', 'g', 'l', 'ml', 'box', 'pack', 'set']
  },
  reorderLevel: {
    type: Number,
    default: 20
  },
  location: {
    warehouse: String,
    aisle: String,
    shelf: String
  },
  supplier: {
    name: String,
    contact: String,
    email: String
  },
  images: [{
    url: String,
    isPrimary: Boolean
  }],
  tags: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  stockHistory: [{
    date: Date,
    quantity: Number,
    type: {
      type: String,
      enum: ['in', 'out', 'adjustment', 'return']
    },
    reference: String,
    notes: String
  }],
  metadata: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
      unit: String
    },
    manufacturer: String,
    warranty: String
  },
  createdBy: {
    type: String,
    required: true,
    default: 'admin'
  },
  updatedBy: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
ProductSchema.index({ name: 'text', description: 'text', tags: 'text' });
ProductSchema.index({ quantity: 1, lowStockThreshold: 1 });
ProductSchema.index({ category: 1, isActive: 1 });

// Virtual for profit margin
ProductSchema.virtual('profitMargin').get(function() {
  return ((this.price - this.costPrice) / this.costPrice * 100).toFixed(2);
});

// Virtual for stock status
ProductSchema.virtual('stockStatus').get(function() {
  if (this.quantity === 0) return 'out_of_stock';
  if (this.quantity <= this.lowStockThreshold) return 'low_stock';
  if (this.quantity <= this.reorderLevel) return 'reorder_needed';
  return 'in_stock';
});

// Virtual for total value
ProductSchema.virtual('totalValue').get(function() {
  return this.quantity * this.costPrice;
});

ProductSchema.set('toJSON', { virtuals: true });
ProductSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', ProductSchema);
