// backend/routes/reportRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Our authentication middleware
const reportController = require('../controllers/reportController'); // Import the controller

// @route   GET /api/reports/transactions-by-category
// @desc    Get transactions (income or expense) by category report for a given period
// @access  Private
// Query Params: type=expense/income, startDate (YYYY-MM-DD), endDate (YYYY-MM-DD)
router.get('/transactions-by-category', auth, reportController.getTransactionsByCategory);

// @route   GET /api/reports/net-income
// @desc    Get net income/loss report for a given period
// @access  Private
// Query Params: startDate (YYYY-MM-DD), endDate (YYYY-MM-DD)
router.get('/net-income', auth, reportController.getNetIncomeReport);

module.exports = router;