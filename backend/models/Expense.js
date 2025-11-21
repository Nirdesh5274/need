const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  expenseNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['rent', 'utilities', 'salaries', 'raw_materials', 'maintenance', 'transportation', 'marketing', 'insurance', 'taxes', 'equipment', 'software', 'office_supplies', 'professional_services', 'depreciation', 'other'],
    index: true
  },
  subcategory: {
    type: String
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'bank_transfer', 'check', 'mobile_payment', 'other'],
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'overdue', 'cancelled'],
    default: 'paid'
  },
  vendor: {
    type: mongoose.Schema.Types.Mixed
  },
  vendorName: String,
  invoiceNumber: String,
  purchaseOrderNumber: String,
  dueDate: Date,
  paidDate: Date,
  receipts: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    uploadedAt: Date
  }],
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    uploadedAt: Date
  }],
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringDetails: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']
    },
    startDate: Date,
    endDate: Date,
    nextDate: Date
  },
  isReimbursable: {
    type: Boolean,
    default: false
  },
  reimbursementStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'paid']
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: Date,
  project: {
    type: String
  },
  department: {
    type: String,
    enum: ['operations', 'sales', 'marketing', 'hr', 'it', 'finance', 'admin', 'production']
  },
  taxDeductible: {
    type: Boolean,
    default: false
  },
  taxAmount: {
    type: Number,
    default: 0
  },
  tags: [String],
  notes: String,
  internalNotes: String,
  expenseDate: {
    type: Date,
    default: Date.now,
    index: true
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
ExpenseSchema.index({ expenseNumber: 1 });
ExpenseSchema.index({ expenseDate: -1 });
ExpenseSchema.index({ category: 1, expenseDate: -1 });
ExpenseSchema.index({ paymentStatus: 1 });
ExpenseSchema.index({ 'vendor.name': 1 });

// Pre-save hook to generate expense number
ExpenseSchema.pre('save', async function(next) {
  if (!this.expenseNumber) {
    try {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      
      const Expense = this.constructor;
      const count = await Expense.countDocuments({});
      
      this.expenseNumber = `EXP-${year}${month}-${String(count + 1).padStart(5, '0')}`;
    } catch (error) {
      console.error('Error generating expense number:', error);
      this.expenseNumber = `EXP-${Date.now()}`;
    }
  }
  next();
});

module.exports = mongoose.model('Expense', ExpenseSchema);
