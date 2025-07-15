// backend/routes/budgetRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Our authentication middleware
const budgetController = require('../controllers/budgetController'); // Import the controller

// @route   GET api/budgets
// @desc    Get all budgets for the authenticated user
// @access  Private
router.get('/', auth, budgetController.getBudgets);

// @route   GET api/budgets/:id
// @desc    Get single budget by ID for the authenticated user
// @access  Private
router.get('/:id', auth, budgetController.getBudgetById);

// @route   POST api/budgets
// @desc    Create a new budget
// @access  Private
router.post('/', auth, budgetController.createBudget);

// @route   PUT api/budgets/:id
// @desc    Update an existing budget
// @access  Private
router.put('/:id', auth, budgetController.updateBudget);

// @route   DELETE api/budgets/:id
// @desc    Delete a budget
// @access  Private
router.delete('/:id', auth, budgetController.deleteBudget);

module.exports = router;