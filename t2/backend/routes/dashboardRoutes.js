// backend/routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

// @route   GET api/dashboard/summary
// @desc    Get summary data for the dashboard
// @access  Private
router.get('/summary', auth, dashboardController.getDashboardSummary);

// @route   GET /api/dashboard/reports/transactions-by-category
// @desc    Get transactions (income or expense) by category for a given period
// @access  Private
// @query   type=expense/income, period=monthly/quarterly/annually, year=YYYY, month=MM (optional)
router.get('/reports/transactions-by-category', auth, dashboardController.getTransactionsByCategory);

// @route   GET /api/dashboard/reports/transaction-trends
// @desc    Get daily/monthly/yearly transaction totals for a given period (trend data)
// @access  Private
router.get('/reports/transaction-trends', auth, dashboardController.getTransactionTrends);

module.exports = router;