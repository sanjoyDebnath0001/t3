const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const Budget = require('../models/Budget');
const errorHandler = require('../utils/errorHandler');

// router.post('/', auth, transactionController.createTransaction);
exports.createTransaction = async (req, res) => {
    const { account, amount, type, category, description, date } = req.body;
    const userId = req.user.id;

    try {
        // Validate amount to ensure it's a valid number
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ message: 'Invalid amount provided. Amount must be a positive number.' });
        }

        const targetAccount = await Account.findById(account);

        if (!targetAccount) {
            return res.status(404).json({ message: 'Account not found' });
        }

        if (targetAccount.user.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to create transaction for this account' });
        }

        const newTransaction = new Transaction({
            user: userId,
            account,
            amount: parsedAmount, // Use the parsed amount
            type,
            category: category ? category.trim() : '', // Trim and handle potential null/undefined
            description: description ? description.trim() : '', // Trim and handle potential null/undefined
            date: date || new Date() // Use current date if not provided
        });

        const transaction = await newTransaction.save();

        if (type === 'income') {
            targetAccount.currentBalance += parsedAmount;
        } else if (type === 'expense') {
            targetAccount.currentBalance -= parsedAmount;
        }
        await targetAccount.save();

        // Only update budget for expenses with a valid category
        if (type === 'expense' && category && category.trim() !== '') {
            const transactionDateObj = new Date(transaction.date);

            const budget = await Budget.findOneAndUpdate(
                {
                    user: userId,
                    category: category.trim(), // Use trimmed category for budget lookup
                    startDate: { $lte: transactionDateObj },
                    endDate: { $gte: transactionDateObj }
                },
                {
                    $inc: { spentAmount: parsedAmount }
                },
                {
                    new: true,
                    runValidators: true
                }
            );

            if (budget) {
                console.log(`Budget for ${category.trim()} updated. New spent amount: ${budget.spentAmount}`);
            } else {
                console.log(`No budget found for category '${category.trim()}' for the transaction date.`);
            }
        }

        res.status(201).json(transaction);

    } catch (err) {
        errorHandler(err, res, 'Server error creating transaction');
    }
};

// @route   GET /api/transactions
// @desc    Get all transactions for a user
// @access  Private
exports.getTransactions = async (req, res) => {
    try {
        const query = { user: req.user.id };

        if (req.query.account) {
            const accountId = req.query.account;
            const checkAccount = await Account.findById(accountId);
            if (!checkAccount || checkAccount.user.toString() !== req.user.id) {
                return res.status(400).json({ message: 'Not authorized to view transactions for this account' });
            }
            query.account = accountId;
        }
        if (req.query.startDate && req.query.endDate) {
            query.date = {
                $gte: new Date(req.query.startDate),
                $lte: new Date(req.query.endDate)
            };
        } else if (req.query.startDate) {
            query.date = { $gte: new Date(req.query.startDate) };
        } else if (req.query.endDate) {
            query.date = { $lte: new Date(req.query.endDate) };
        }

        const transactions = await Transaction.find(query)
            .populate('account', ['name', 'type', 'currency', 'currentBalance']) // Ensure currentBalance is populated
            .sort({ date: -1, createdAt: -1 });

        res.json(transactions);
    } catch (err) {
        errorHandler(err, res, 'Server error fetching transactions');
    }
};

// @route   GET /api/transactions/:id
// @desc    Get a single transaction by ID
// @access  Private
exports.getTransactionById = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id).populate('account', ['name', 'type', 'currency', 'currentBalance']); // Ensure currentBalance is populated

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }
        if (transaction.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized to view this transaction' });
        }

        res.json(transaction);
    } catch (err) {
        errorHandler(err, res, 'Server error fetching transaction');
    }
};

// @route   PUT /api/transactions/:id
// @desc    Update a transaction
// @access  Private
exports.updateTransaction = async (req, res) => {
    const { account, amount, type, category, description, date } = req.body;
    const transactionId = req.params.id;
    const userId = req.user.id;

    try {
        let transaction = await Transaction.findById(transactionId);

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        if (transaction.user.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to update this transaction' });
        }

        // Validate amount for update as well
        const parsedAmount = amount !== undefined ? parseFloat(amount) : transaction.amount;
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ message: 'Invalid amount provided for update. Amount must be a positive number.' });
        }

        const oldAmount = transaction.amount;
        const oldType = transaction.type;
        const oldCategory = transaction.category;
        const oldDate = transaction.date;
        const oldAccountId = transaction.account.toString();

        transaction.account = account !== undefined ? account : transaction.account;
        transaction.amount = parsedAmount; // Use the parsed amount
        transaction.type = type !== undefined ? type : transaction.type;
        transaction.category = category !== undefined ? (category ? category.trim() : '') : transaction.category;
        transaction.description = description !== undefined ? (description ? description.trim() : '') : transaction.description;
        transaction.date = date !== undefined ? date : transaction.date;

        await transaction.save();

        // Revert old budget if applicable
        if (oldType === 'expense' && oldCategory && oldCategory.trim() !== '') {
            const oldTransactionDateObj = new Date(oldDate);
            await Budget.findOneAndUpdate(
                {
                    user: userId,
                    category: oldCategory.trim(),
                    startDate: { $lte: oldTransactionDateObj },
                    endDate: { $gte: oldTransactionDateObj }
                },
                { $inc: { spentAmount: -oldAmount } }
            );
        }

        // Apply new budget update if applicable
        if (transaction.type === 'expense' && transaction.category && transaction.category.trim() !== '') {
            const newTransactionDateObj = new Date(transaction.date);
            await Budget.findOneAndUpdate(
                {
                    user: userId,
                    category: transaction.category.trim(),
                    startDate: { $lte: newTransactionDateObj },
                    endDate: { $gte: newTransactionDateObj }
                },
                { $inc: { spentAmount: transaction.amount } },
                { new: true, runValidators: true }
            );
        }

        // Update account balances only if account, amount, or type changed
        if (oldAccountId !== transaction.account.toString() || oldAmount !== transaction.amount || oldType !== transaction.type) {
            const oldAccount = await Account.findById(oldAccountId);
            if (oldAccount) {
                if (oldType === 'income') {
                    oldAccount.currentBalance -= oldAmount;
                } else if (oldType === 'expense') {
                    oldAccount.currentBalance += oldAmount;
                }
                await oldAccount.save();
            }

            const newAccount = await Account.findById(transaction.account);
            if (newAccount) {
                if (transaction.type === 'income') {
                    newAccount.currentBalance += transaction.amount;
                } else if (transaction.type === 'expense') {
                    newAccount.currentBalance -= transaction.amount;
                }
                await newAccount.save();
            }
        }

        res.json(transaction);

    } catch (err) {
        errorHandler(err, res, 'Server error updating transaction');
    }
};

// @route   DELETE /api/transactions/:id
// @desc    Delete a transaction
// @access  Private
exports.deleteTransaction = async (req, res) => {
    const transactionId = req.params.id;
    const userId = req.user.id;

    try {
        const transaction = await Transaction.findById(transactionId);

        if (!transaction) {
            return res.status(404).json({ message: 'Transaction not found' });
        }

        if (transaction.user.toString() !== userId) {
            return res.status(403).json({ message: 'Not authorized to delete this transaction' });
        }

        // Revert budget if applicable
        if (transaction.type === 'expense' && transaction.category && transaction.category.trim() !== '') {
            const transactionDateObj = new Date(transaction.date);
            await Budget.findOneAndUpdate(
                {
                    user: userId,
                    category: transaction.category.trim(),
                    startDate: { $lte: transactionDateObj },
                    endDate: { $gte: transactionDateObj }
                },
                {
                    $inc: { spentAmount: -transaction.amount }
                }
            );
            console.log(`Budget for ${transaction.category.trim()} decremented due to transaction deletion.`);
        }

        const relatedAccount = await Account.findById(transaction.account);
        if (relatedAccount) {
            if (transaction.type === 'income') {
                relatedAccount.currentBalance -= transaction.amount;
            } else if (transaction.type === 'expense') {
                relatedAccount.currentBalance += transaction.amount;
            }
            await relatedAccount.save();
        }

        await transaction.deleteOne();

        res.json({ message: 'Transaction removed successfully' });

    } catch (err) {
        errorHandler(err, res, 'Server error deleting transaction');
    }
};