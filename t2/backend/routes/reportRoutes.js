// backend/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const reportController = require('../controllers/reportController');

// @route   GET /api/reports/expenses-by-category
// @desc    Get expenses by category report. Can filter by date range or period.
// @access  Private
// Query Params: startDate={YYYY-MM-DD}, endDate={YYYY-MM-DD}
// OR: period={monthly|quarterly|annually}, year={YYYY}, month={1-12, if monthly/quarterly}
router.get('/expenses-by-category', auth, reportController.getExpensesByCategory);

// @route   GET /api/reports/income-by-category
// @desc    Get income by category report. Can filter by date range or period.
// @access  Private
// Query Params: startDate={YYYY-MM-DD}, endDate={YYYY-MM-DD}
// OR: period={monthly|quarterly|annually}, year={YYYY}, month={1-12, if monthly/quarterly}
router.get('/income-by-category', auth, reportController.getIncomeByCategory);

// @route   GET /api/reports/transaction-trends
// @desc    Get transaction trends (expenses or income over time) for a given period.
// @access  Private
// Query Params: type={expense|income}, startDate={YYYY-MM-DD}, endDate={YYYY-MM-DD}
// OR: period={monthly|quarterly|annually}, year={YYYY}, month={1-12, if monthly/quarterly}
router.get('/transaction-trends', auth, reportController.getTransactionTrends);

// @route   GET /api/reports/net-income
// @desc    Get net income/loss report. Can filter by date range or period.
// @access  Private
// Query Params: startDate={YYYY-MM-DD}, endDate={YYYY-MM-DD}
// OR: period={monthly|quarterly|annually}, year={YYYY}, month={1-12, if monthly/quarterly}
router.get('/net-income', auth, reportController.getNetIncomeReport);

module.exports = router;