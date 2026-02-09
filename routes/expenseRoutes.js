const express = require('express');
const router = express.Router();
const {
  getExpenses,
  addExpense,
  updateExpense,
  deleteExpense
} = require('../controllers/expenseController');
const { uploadMiddleware, parseStatement, saveBulkExpenses } = require('../controllers/importController');
const { protect } = require('../middleware/auth');

// All expense routes require authentication
router.use(protect);

// GET /api/expenses?month=M&year=Y — Get expenses filtered by month/year
router.get('/', getExpenses);

// POST /api/expenses — Add a new expense
router.post('/', addExpense);

// POST /api/expenses/import/parse — Upload & parse bank statement
router.post('/import/parse', uploadMiddleware, parseStatement);

// POST /api/expenses/import/save — Bulk save confirmed transactions
router.post('/import/save', saveBulkExpenses);

// PUT /api/expenses/:id — Update an existing expense
router.put('/:id', updateExpense);

// DELETE /api/expenses/:id — Delete an expense
router.delete('/:id', deleteExpense);

module.exports = router;
