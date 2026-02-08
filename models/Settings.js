const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  salary: {
    type: Number,
    required: [true, 'Salary is required'],
    min: [1, 'Salary must be greater than 0']
  },
  salaryCreditDate: {
    type: Number,
    required: [true, 'Salary credit date is required'],
    min: [1, 'Must be between 1 and 31'],
    max: [31, 'Must be between 1 and 31']
  },
  fixedDeductions: [
    {
      name: {
        type: String,
        required: [true, 'Deduction name is required'],
        trim: true
      },
      amount: {
        type: Number,
        required: [true, 'Deduction amount is required'],
        min: [1, 'Deduction amount must be greater than 0']
      },
      deductionDate: {
        type: Number,
        required: [true, 'Deduction date is required'],
        min: [1, 'Must be between 1 and 31'],
        max: [31, 'Must be between 1 and 31']
      }
    }
  ],
  categories: [
    {
      name: {
        type: String,
        required: [true, 'Category name is required'],
        trim: true
      },
      monthlyLimit: {
        type: Number,
        required: [true, 'Monthly limit is required'],
        min: [1, 'Monthly limit must be greater than 0']
      },
      type: {
        type: String,
        enum: ['fixed', 'variable'],
        default: 'variable'
      }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Settings', settingsSchema);
