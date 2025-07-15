// backend/routes/transactionRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Assuming auth middleware is here
const transactionController = require('../controllers/transactionController'); // Import the controller

// Create a new transaction
router.post('/', auth, transactionController.createTransaction);

// Get all transactions for a user
router.get('/', auth, transactionController.getTransactions);

// Get a single transaction by ID
router.get('/:id', auth, transactionController.getTransactionById);

// Update a transaction
router.put('/:id', auth, transactionController.updateTransaction);

// Delete a transaction
router.delete('/:id', auth, transactionController.deleteTransaction);

module.exports = router;