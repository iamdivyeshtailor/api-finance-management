const multer = require('multer');
const Expense = require('../models/Expense');
const Settings = require('../models/Settings');
const { parseCSV, parsePDF, autoCategorize } = require('../utils/importParser');

// Multer config: memory storage, 5MB limit, CSV/PDF only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['text/csv', 'application/pdf', 'application/vnd.ms-excel'];
    // Also accept by extension
    const ext = file.originalname.toLowerCase().split('.').pop();
    if (allowed.includes(file.mimetype) || ext === 'csv' || ext === 'pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and PDF files are allowed'));
    }
  },
});

const uploadMiddleware = upload.single('statement');

/**
 * POST /api/expenses/import/parse
 * Upload bank statement → parse → auto-categorize → return transactions
 */
const parseStatement = async (req, res, next) => {
  try {
    if (!req.file) {
      const error = new Error('No file uploaded');
      error.statusCode = 400;
      throw error;
    }

    const ext = req.file.originalname.toLowerCase().split('.').pop();
    let transactions;

    if (ext === 'csv') {
      transactions = parseCSV(req.file.buffer);
    } else if (ext === 'pdf') {
      transactions = await parsePDF(req.file.buffer);
    } else {
      const error = new Error('Unsupported file format. Use CSV or PDF.');
      error.statusCode = 400;
      throw error;
    }

    if (transactions.length === 0) {
      const error = new Error('No transactions found in the uploaded file');
      error.statusCode = 400;
      throw error;
    }

    // Get user's categories for auto-categorization
    const settings = await Settings.findOne({ userId: req.user.id });
    const userCategories = settings ? settings.categories : [];
    const categoryNames = userCategories.map((c) => c.name);

    // Auto-categorize each transaction
    transactions = transactions.map((txn) => ({
      ...txn,
      category: autoCategorize(txn.description, userCategories),
    }));

    const summary = {
      total: transactions.length,
      debits: transactions.filter((t) => t.type === 'debit').length,
      credits: transactions.filter((t) => t.type === 'credit').length,
      totalDebitAmount: transactions
        .filter((t) => t.type === 'debit')
        .reduce((sum, t) => sum + t.amount, 0),
      totalCreditAmount: transactions
        .filter((t) => t.type === 'credit')
        .reduce((sum, t) => sum + t.amount, 0),
    };

    res.json({
      transactions,
      availableCategories: categoryNames,
      summary,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/expenses/import/save
 * Receive confirmed transactions → validate → bulk insert
 */
const saveBulkExpenses = async (req, res, next) => {
  try {
    const { transactions } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      const error = new Error('No transactions to save');
      error.statusCode = 400;
      throw error;
    }

    // Get salary credit date for month calculation
    const settings = await Settings.findOne({ userId: req.user.id });
    const salaryCreditDate = settings ? settings.salaryCreditDate : 1;

    const expenses = transactions.map((txn) => {
      const expenseDate = new Date(txn.date);
      if (isNaN(expenseDate.getTime())) {
        throw Object.assign(new Error(`Invalid date: ${txn.date}`), { statusCode: 400 });
      }

      const day = expenseDate.getDate();
      let month = expenseDate.getMonth() + 1;
      let year = expenseDate.getFullYear();

      if (day < salaryCreditDate) {
        month = month - 1;
        if (month === 0) {
          month = 12;
          year = year - 1;
        }
      }

      // Normalize tags
      const tags = Array.isArray(txn.tags)
        ? [...new Set(txn.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean))].slice(0, 10)
        : [];

      return {
        userId: req.user.id,
        date: expenseDate,
        category: (txn.category || 'Uncategorized').trim(),
        amount: Number(txn.amount) || 0,
        description: (txn.description || 'Bank Transaction').trim().substring(0, 200),
        tags,
        month,
        year,
      };
    });

    // Validate all amounts
    const invalidAmount = expenses.find((e) => e.amount <= 0);
    if (invalidAmount) {
      const error = new Error('All transactions must have an amount greater than 0');
      error.statusCode = 400;
      throw error;
    }

    const saved = await Expense.insertMany(expenses);
    res.status(201).json({ message: `${saved.length} expenses imported successfully`, count: saved.length });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadMiddleware, parseStatement, saveBulkExpenses };
