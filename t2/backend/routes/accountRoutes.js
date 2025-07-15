// backend/routes/accountRoutes.js
const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const auth = require('../middleware/auth'); // Assuming you have this

// Create a new account
router.post('/', auth, accountController.createAccount);

// Get all accounts for a user
router.get('/', auth, accountController.getAccounts);

// Get a single account by ID (optional, but good practice)
router.get('/:id', auth, accountController.getAccountById);

// Update an account by ID
router.put('/:id', auth, accountController.updateAccount); // <--- ADD THIS LINE

// Delete an account by ID
router.delete('/:id', auth, accountController.deleteAccount);

module.exports = router;