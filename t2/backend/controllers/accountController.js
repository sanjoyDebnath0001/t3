const Account = require('../models/Account');
const errorHandler = require('../utils/errorHandler'); // Your error handler

// @route   POST /api/accounts
// @desc    Create a new account
// @access  Private
exports.createAccount = async (req, res) => {
    const { name, type, balance } = req.body;
    const userId = req.user.id;

    try {
        const newAccount = new Account({
            user: userId,
            name,
            type,
            balance,
        });

        const account = await newAccount.save();
        res.status(201).json(account);
    } catch (err) {
        errorHandler(err, res, 'Server error creating account');
    }
};

// @route   GET /api/accounts
// @desc    Get all accounts for a user
// @access  Private
exports.getAccounts = async (req, res) => {
    try {
        const accounts = await Account.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(accounts);
    } catch (err) {
        errorHandler(err, res, 'Server error fetching accounts');
    }
};

// @route   GET /api/accounts/:id
// @desc    Get a single account by ID
// @access  Private
exports.getAccountById = async (req, res) => {
    try {
        const account = await Account.findById(req.params.id);

        if (!account) {
            return res.status(404).json({ message: 'Account not found' });
        }
        if (account.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to view this account' });
        }

        res.json(account);
    } catch (err) {
        errorHandler(err, res, 'Server error fetching account');
    }
};

// @route   PUT /api/accounts/:id
// @desc    Update an account
// @access  Private
exports.updateAccount = async (req, res) => {
    const { name, type, initialBalance,currentBalance,currency } = req.body;
    const accountId = req.params.id;
    const userId = req.user.id;

    try {
        let account = await Account.findById(accountId);

        if (!account) {
            return res.status(404).json({ message: 'Account not found' });
        }

        // Ensure the logged-in user owns this account
        if (account.user.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to update this account' });
        }

        // Update account fields if provided in the request body
        if (name !== undefined) account.name = name;
        if (type !== undefined) account.type = type;
        if (currentBalance !== undefined) account.currentBalance = currentBalance; 
		if (currency!==undefined)account.currency =currency;

        // Save the updated account
        const updatedAccount = await account.save();
        res.json(updatedAccount);

    } catch (err) {
        // If it's a CastError (e.g., invalid ID format) or Mongoose validation error
        errorHandler(err, res, 'Server error updating account');
    }
};


// @route   DELETE /api/accounts/:id
// @desc    Delete an account
// @access  Private
exports.deleteAccount = async (req, res) => {
    const accountId = req.params.id;
    const userId = req.user.id;

    try {
        const account = await Account.findById(accountId);

        if (!account) {
            return res.status(404).json({ message: 'Account not found' });
        }
        if (account.user.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to delete this account' });
        }

        await account.deleteOne(); // Use deleteOne() on the document instance
        res.json({ message: 'Account removed successfully' });

    } catch (err) {
        errorHandler(err, res, 'Server error deleting account');
    }
};