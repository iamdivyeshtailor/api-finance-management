const Expense = require('../models/Expense');
const Settings = require('../models/Settings');

// GET /api/expenses?month=M&year=Y
const getExpenses = async (req, res, next) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      const error = new Error('month and year query parameters are required');
      error.statusCode = 400;
      throw error;
    }

    const expenses = await Expense.find({
      userId: req.user.id,
      month: Number(month),
      year: Number(year)
    }).sort({ date: -1 });

    res.json(expenses);
  } catch (error) {
    next(error);
  }
};

// POST /api/expenses
const addExpense = async (req, res, next) => {
  try {
    const { date, category, amount, description } = req.body;

    // Validate date
    if (!date) {
      const error = new Error('Date is required');
      error.statusCode = 400;
      throw error;
    }

    const expenseDate = new Date(date);
    if (isNaN(expenseDate.getTime())) {
      const error = new Error('Invalid date format');
      error.statusCode = 400;
      throw error;
    }

    // Validate category
    if (!category || !category.trim()) {
      const error = new Error('Category is required');
      error.statusCode = 400;
      throw error;
    }

    // Validate amount
    if (!amount || amount <= 0) {
      const error = new Error('Amount must be greater than 0');
      error.statusCode = 400;
      throw error;
    }

    // Validate description
    if (!description || !description.trim()) {
      const error = new Error('Description is required');
      error.statusCode = 400;
      throw error;
    }

    if (description.trim().length > 200) {
      const error = new Error('Description must be 200 characters or fewer');
      error.statusCode = 400;
      throw error;
    }

    // Determine budget month cycle based on salaryCreditDate
    const settings = await Settings.findOne({ userId: req.user.id });
    const salaryCreditDate = settings ? settings.salaryCreditDate : 1;

    const day = expenseDate.getDate();
    let month = expenseDate.getMonth() + 1; // getMonth() is 0-based
    let year = expenseDate.getFullYear();

    if (day < salaryCreditDate) {
      // Expense is before salary credit — belongs to previous month's cycle
      month = month - 1;
      if (month === 0) {
        month = 12;
        year = year - 1;
      }
    }

    const expense = await Expense.create({
      userId: req.user.id,
      date: expenseDate,
      category: category.trim(),
      amount,
      description: description.trim(),
      month,
      year
    });

    res.status(201).json(expense);
  } catch (error) {
    next(error);
  }
};

// PUT /api/expenses/:id
const updateExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user.id });

    if (!expense) {
      const error = new Error('Expense not found');
      error.statusCode = 404;
      throw error;
    }

    const { date, category, amount, description } = req.body;

    // Update fields if provided
    if (date) {
      const expenseDate = new Date(date);
      if (isNaN(expenseDate.getTime())) {
        const error = new Error('Invalid date format');
        error.statusCode = 400;
        throw error;
      }
      expense.date = expenseDate;

      // Recalculate budget month cycle
      const settings = await Settings.findOne({ userId: req.user.id });
      const salaryCreditDate = settings ? settings.salaryCreditDate : 1;
      const day = expenseDate.getDate();
      let m = expenseDate.getMonth() + 1;
      let y = expenseDate.getFullYear();
      if (day < salaryCreditDate) {
        m = m - 1;
        if (m === 0) { m = 12; y = y - 1; }
      }
      expense.month = m;
      expense.year = y;
    }

    if (category) expense.category = category.trim();

    if (amount !== undefined) {
      if (amount <= 0) {
        const error = new Error('Amount must be greater than 0');
        error.statusCode = 400;
        throw error;
      }
      expense.amount = amount;
    }

    if (description !== undefined) {
      if (!description.trim()) {
        const error = new Error('Description is required');
        error.statusCode = 400;
        throw error;
      }
      if (description.trim().length > 200) {
        const error = new Error('Description must be 200 characters or fewer');
        error.statusCode = 400;
        throw error;
      }
      expense.description = description.trim();
    }

    const updated = await expense.save();
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// DELETE /api/expenses/:id
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user.id });

    if (!expense) {
      const error = new Error('Expense not found');
      error.statusCode = 404;
      throw error;
    }

    await expense.deleteOne();
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getExpenses, addExpense, updateExpense, deleteExpense };
