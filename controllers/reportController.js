const Settings = require('../models/Settings');
const Expense = require('../models/Expense');
const MonthlySummary = require('../models/MonthlySummary');
const { getCurrentMonthCycle } = require('../utils/dateHelpers');

// GET /api/reports/current
const getCurrentReport = async (req, res, next) => {
  try {
    // Fetch settings
    const settings = await Settings.findOne({});
    if (!settings) {
      const error = new Error('Settings not configured. Please set up your budget first.');
      error.statusCode = 404;
      throw error;
    }

    // Determine current month cycle
    const { month, year } = getCurrentMonthCycle(settings.salaryCreditDate);

    // Calculate total fixed deductions
    const totalFixedDeductions = settings.fixedDeductions.reduce(
      (sum, d) => sum + d.amount, 0
    );

    // Distributable amount (salary minus fixed deductions)
    const distributableAmount = settings.salary - totalFixedDeductions;

    // Aggregate expenses by category for current month
    const expensesByCategory = await Expense.aggregate([
      { $match: { month, year } },
      { $group: { _id: '$category', spent: { $sum: '$amount' } } }
    ]);

    // Build a lookup map: category name → spent amount
    const spentMap = {};
    expensesByCategory.forEach(e => {
      spentMap[e._id] = e.spent;
    });

    // Calculate per-category breakdown
    const categories = settings.categories.map(cat => {
      const spent = spentMap[cat.name] || 0;
      const remaining = cat.monthlyLimit - spent;
      const percentUsed = cat.monthlyLimit > 0
        ? Math.round((spent / cat.monthlyLimit) * 100)
        : 0;

      return {
        name: cat.name,
        limit: cat.monthlyLimit,
        type: cat.type,
        spent,
        remaining,
        percentUsed
      };
    });

    // Total variable spending (across all categories)
    const totalVariableSpent = categories.reduce((sum, c) => sum + c.spent, 0);

    // Total spent = fixed deductions + variable expenses
    const totalSpent = totalFixedDeductions + totalVariableSpent;

    // Total budgeted = fixed deductions + sum of all category limits
    const totalBudgeted = totalFixedDeductions + categories.reduce((sum, c) => sum + c.limit, 0);

    // Current savings = salary - total spent
    const currentSavings = settings.salary - totalSpent;

    res.json({
      month,
      year,
      salary: settings.salary,
      salaryCreditDate: settings.salaryCreditDate,
      totalFixedDeductions,
      fixedDeductions: settings.fixedDeductions,
      distributableAmount,
      categories,
      totalBudgeted,
      totalSpent,
      currentSavings
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/monthly?month=M&year=Y
const getMonthlyReport = async (req, res, next) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      const error = new Error('month and year query parameters are required');
      error.statusCode = 400;
      throw error;
    }

    const m = Number(month);
    const y = Number(year);

    // Check if a stored summary already exists
    let summary = await MonthlySummary.findOne({ month: m, year: y });

    if (summary) {
      return res.json(summary);
    }

    // No stored summary — compute from expenses + settings
    const settings = await Settings.findOne({});
    if (!settings) {
      const error = new Error('Settings not configured. Please set up your budget first.');
      error.statusCode = 404;
      throw error;
    }

    const totalFixedDeductions = settings.fixedDeductions.reduce(
      (sum, d) => sum + d.amount, 0
    );

    // Aggregate expenses by category
    const expensesByCategory = await Expense.aggregate([
      { $match: { month: m, year: y } },
      { $group: { _id: '$category', spent: { $sum: '$amount' } } }
    ]);

    const spentMap = {};
    expensesByCategory.forEach(e => {
      spentMap[e._id] = e.spent;
    });

    const categoryBreakdown = settings.categories.map(cat => ({
      category: cat.name,
      limit: cat.monthlyLimit,
      spent: spentMap[cat.name] || 0
    }));

    const totalVariableSpent = categoryBreakdown.reduce((sum, c) => sum + c.spent, 0);
    const totalSpent = totalFixedDeductions + totalVariableSpent;
    const totalSavings = settings.salary - totalSpent;

    // Store the summary for future lookups
    summary = await MonthlySummary.findOneAndUpdate(
      { month: m, year: y },
      {
        salary: settings.salary,
        totalFixedDeductions,
        categoryBreakdown,
        totalSpent,
        totalSavings
      },
      { new: true, upsert: true, runValidators: true }
    );

    res.json(summary);
  } catch (error) {
    next(error);
  }
};

// GET /api/reports/history
const getReportHistory = async (req, res, next) => {
  try {
    const summaries = await MonthlySummary.find({})
      .sort({ year: -1, month: -1 });

    res.json(summaries);
  } catch (error) {
    next(error);
  }
};

module.exports = { getCurrentReport, getMonthlyReport, getReportHistory };
