const mongoose = require('mongoose');

const SaleSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  products: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: String,
    sku: String,
    quantity: {
      type: Number,
      required: true,
      min: 0.001
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    tax: {
      type: Number,
      default: 0,
      min: 0
    },
    total: {
      type: Number,
      required: true
    }
  }],
  customerName: String,
  customerContact: String,
  customer: {
    name: String,
    email: String,
    phone: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer'
    }
  },
  subtotal: {
    type: Number,
    required: true
  },
  totalDiscount: {
    type: Number,
    default: 0
  },
  totalTax: {
    type: Number,
    default: 0
  },
  shippingCost: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank_transfer', 'credit', 'check', 'mobile_payment', 'other'],
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid', 'refunded', 'cancelled'],
    default: 'paid'
  },
  paymentDetails: {
    transactionId: String,
    cardLast4: String,
    paidAmount: Number,
    pendingAmount: Number,
    dueDate: Date
  },
  paymentHistory: [{
    date: {
      type: Date,
      default: Date.now
    },
    amount: {
      type: Number,
      required: true
    },
    method: {
      type: String,
      default: 'cash'
    },
    notes: String
  }],
  status: {
    type: String,
    enum: ['draft', 'confirmed', 'processing', 'completed', 'cancelled', 'refunded'],
    default: 'confirmed'
  },
  deliveryStatus: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  deliveryDate: Date,
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  notes: String,
  internalNotes: String,
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String
  }],
  refundInfo: {
    refundedAmount: Number,
    refundDate: Date,
    refundReason: String,
    refundedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  saleDate: {
    type: Date,
    default: Date.now,
    index: true
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

// Indexes
SaleSchema.index({ invoiceNumber: 1 });
SaleSchema.index({ saleDate: -1 });
SaleSchema.index({ 'customer.email': 1 });
SaleSchema.index({ paymentStatus: 1 });
SaleSchema.index({ status: 1 });

// Pre-save hook to generate invoice number
SaleSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    try {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      
      const Sale = this.constructor;
      const count = await Sale.countDocuments({});
      
      this.invoiceNumber = `INV-${year}${month}-${String(count + 1).padStart(5, '0')}`;
    } catch (error) {
      console.error('Error generating invoice number:', error);
      this.invoiceNumber = `INV-${Date.now()}`;
    }
  }
  next();
});

// Virtual for profit
SaleSchema.virtual('profit').get(function() {
  // This would need cost price data
  return 0;
});

module.exports = mongoose.model('Sale', SaleSchema);
