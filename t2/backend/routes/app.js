const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware'); // Assuming you have this
const http = require('http');
const url = require('url');

const userController = require('../controllers/userController');
const budgetController = require('../controllers/budgetController');
const expenseController = require('../controllers/expenseController');
const incomeController = require('../controllers/incomeController');
const accountController = require('../controllers/accountController');
const transactionController = require('../controllers/transactionController');
const userinformationcontroller = require('../controllers/userinformationcontroller');
// Authentication routes
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);


router.get('/budgets', authMiddleware, budgetController.getBudgets);
router.post('/budgets', authMiddleware, budgetController.createBudget);


router.get('/expenses', authMiddleware, expenseController.getExpenses);
router.post('/expenses', authMiddleware, expenseController.createExpense);


router.get('/income', authMiddleware, incomeController.getIncomes);
router.post('/income', authMiddleware, incomeController.createIncome);


router.get('/accounts', authMiddleware, accountController.getAccounts);
router.post('/accounts', authMiddleware, accountController.createAccount); 

router.post('/transactions', authMiddleware, transactionController.createTransaction);
router.get('/transactions', authMiddleware, transactionController.getTransactions);


router.get('/userinfo', authMiddleware, userinformationcontroller.getUserinformation);
router.put('/userinfo', authMiddleware, userinformationcontroller, userinformationcontroller.updateUserinformation);

module.exports = router;