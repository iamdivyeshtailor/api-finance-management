const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [200, 'Description must be 200 characters or fewer']
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  }
}, { timestamps: true });

// Index for fetching all expenses of a user's month
expenseSchema.index({ userId: 1, month: 1, year: 1 });

// Index for per-category aggregation within a user's month
expenseSchema.index({ userId: 1, category: 1, month: 1, year: 1 });

module.exports = mongoose.model('Expense', expenseSchema);
