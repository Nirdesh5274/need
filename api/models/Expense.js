const mongoose = require('mongoose');

const ExpenseSchema = new mongoose.Schema({
  expenseNumber: {
    type: String,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  amount: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  paymentMethod: {
    type: String,
    default: 'cash'
  },
  expenseDate: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: String,
    default: 'admin'
  }
}, {
  timestamps: true
});

ExpenseSchema.pre('save', async function(next) {
  if (!this.expenseNumber) {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const count = await this.constructor.countDocuments({});
    this.expenseNumber = `EXP-${year}${month}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Expense', ExpenseSchema);
