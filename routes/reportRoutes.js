const express = require('express');
const router = express.Router();
const {
  getCurrentReport,
  getMonthlyReport,
  getReportHistory
} = require('../controllers/reportController');

// GET /api/reports/current — Live current month summary
router.get('/current', getCurrentReport);

// GET /api/reports/monthly?month=M&year=Y — Specific month summary
router.get('/monthly', getMonthlyReport);

// GET /api/reports/history — All past month summaries
router.get('/history', getReportHistory);

module.exports = router;
