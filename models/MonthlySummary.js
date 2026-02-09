const mongoose = require('mongoose');

const monthlySummarySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  month: {
    type: Number,
    required: [true, 'Month is required'],
    min: [1, 'Month must be between 1 and 12'],
    max: [12, 'Month must be between 1 and 12']
  },
  year: {
    type: Number,
    required: [true, 'Year is required']
  },
  salary: {
    type: Number,
    required: [true, 'Salary is required']
  },
  totalFixedDeductions: {
    type: Number,
    required: true,
    default: 0
  },
  categoryBreakdown: [
    {
      category: {
        type: String,
        required: [true, 'Category name is required']
      },
      limit: {
        type: Number,
        required: [true, 'Category limit is required']
      },
      spent: {
        type: Number,
        required: true,
        default: 0
      }
    }
  ],
  totalSpent: {
    type: Number,
    required: true,
    default: 0
  },
  totalSavings: {
    type: Number,
    required: true,
    default: 0
  }
}, { timestamps: true });

// One summary per user per month — prevents duplicates
monthlySummarySchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('MonthlySummary', monthlySummarySchema);
