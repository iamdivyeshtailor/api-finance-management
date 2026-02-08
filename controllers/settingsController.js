const Settings = require('../models/Settings');

// GET /api/settings
const getSettings = async (req, res, next) => {
  try {
    const settings = await Settings.findOne({});

    if (!settings) {
      return res.json({
        salary: 0,
        salaryCreditDate: 1,
        fixedDeductions: [],
        categories: []
      });
    }

    res.json(settings);
  } catch (error) {
    next(error);
  }
};

// PUT /api/settings
const updateSettings = async (req, res, next) => {
  try {
    const { salary, salaryCreditDate, fixedDeductions, categories } = req.body;

    // Validate salary
    if (!salary || salary <= 0) {
      const error = new Error('Salary is required and must be greater than 0');
      error.statusCode = 400;
      throw error;
    }

    // Validate salary credit date
    if (!salaryCreditDate || salaryCreditDate < 1 || salaryCreditDate > 31) {
      const error = new Error('Salary credit date must be between 1 and 31');
      error.statusCode = 400;
      throw error;
    }

    // Validate categories
    if (!categories || categories.length === 0) {
      const error = new Error('At least one category is required');
      error.statusCode = 400;
      throw error;
    }

    // Validate category names are unique
    const categoryNames = categories.map(c => c.name.trim().toLowerCase());
    const uniqueNames = new Set(categoryNames);
    if (uniqueNames.size !== categoryNames.length) {
      const error = new Error('Category names must be unique');
      error.statusCode = 400;
      throw error;
    }

    // Upsert: create if none exists, update if it does
    const settings = await Settings.findOneAndUpdate(
      {},
      { salary, salaryCreditDate, fixedDeductions, categories },
      { new: true, upsert: true, runValidators: true }
    );

    res.json(settings);
  } catch (error) {
    next(error);
  }
};

module.exports = { getSettings, updateSettings };
