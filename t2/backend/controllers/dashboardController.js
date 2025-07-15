// backend/controllers/dashboardController.js

const Transaction = require('../models/Transaction'); // Use the unified Transaction model
const Budget = require('../models/Budget');
const mongoose = require('mongoose');

// Helper function to calculate start and end of current month (already exists)
const getCurrentMonthDateRange = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    endOfMonth.setHours(23, 59, 59, 999);
    return { startOfMonth, endOfMonth };
};

// Helper function to calculate start and end of a given period
const getDateRangeForPeriod = (period, year, month = null) => {
    let startDate, endDate;
    const now = new Date();

    const y = year || now.getFullYear();
    const m = month !== null ? parseInt(month) : now.getMonth();

    switch (period) {
        case 'monthly':
            startDate = new Date(y, m, 1);
            endDate = new Date(y, m + 1, 0);
            break;
        case 'quarterly':
            const quarter = Math.floor(m / 3);
            startDate = new Date(y, quarter * 3, 1);
            endDate = new Date(y, quarter * 3 + 3, 0);
            break;
        case 'annually':
            startDate = new Date(y, 0, 1);
            endDate = new Date(y, 11, 31);
            break;
        default: // Current month as default
            return getCurrentMonthDateRange();
    }
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
};


// @desc    Get dashboard summary data for a user
// @route   GET /api/dashboard/summary
// @access  Private
exports.getDashboardSummary = async (req, res) => {
    try {
        const userId = req.user.id;
        const { startOfMonth, endOfMonth } = getCurrentMonthDateRange();

        // 1 & 2. Total Income and Total Expenses for current month (in one efficient query)
        const totalSummary = await Transaction.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(userId),
                    transactionDate: { $gte: startOfMonth, $lte: endOfMonth }
                }
            },
            {
                $group: {
                    _id: '$type',
                    totalAmount: { $sum: '$amount' }
                }
            }
        ]);

        const totalIncome = totalSummary.find(item => item._id === 'income')?.totalAmount || 0;
        const totalExpenses = totalSummary.find(item => item._id === 'expense')?.totalAmount || 0;
        
        // 3. Current Balance (current month)
        const currentMonthBalance = totalIncome - totalExpenses;

        // 4. Budget vs Actual (for current month, if a monthly budget exists)
        const activeMonthlyBudget = await Budget.findOne({
            user: userId,
            period: 'monthly',
            startDate: { $lte: endOfMonth },
            endDate: { $gte: startOfMonth }
        });

        let budgetVsActual = null;
        if (activeMonthlyBudget) {
            const budgetCategories = activeMonthlyBudget.categories.filter(cat => cat.type === 'expense');
            const budgetedExpenseTotal = budgetCategories.reduce((acc, cat) => acc + cat.allocatedAmount, 0);

            const actualExpensesByCategory = await Transaction.aggregate([
                {
                    $match: {
                        user: new mongoose.Types.ObjectId(userId),
                        type: 'expense',
                        transactionDate: { $gte: activeMonthlyBudget.startDate, $lte: activeMonthlyBudget.endDate },
                        category: { $in: budgetCategories.map(cat => cat.name) }
                    }
                },
                { $group: { _id: '$category', totalSpent: { $sum: '$amount' } } }
            ]);

            const actualExpensesMap = new Map();
            actualExpensesByCategory.forEach(item => {
                actualExpensesMap.set(item._id, item.totalSpent);
            });

            const categoryBreakdown = budgetCategories.map(bCat => ({
                category: bCat.name,
                budgeted: bCat.allocatedAmount,
                spent: actualExpensesMap.get(bCat.name) || 0,
                remaining: bCat.allocatedAmount - (actualExpensesMap.get(bCat.name) || 0)
            }));

            const totalActualExpenses = actualExpensesByCategory.reduce((acc, item) => acc + item.totalSpent, 0);

            budgetVsActual = {
                budgetName: activeMonthlyBudget.name,
                budgetPeriod: activeMonthlyBudget.period,
                budgetStartDate: activeMonthlyBudget.startDate,
                budgetEndDate: activeMonthlyBudget.endDate,
                totalBudgetedExpenses: budgetedExpenseTotal,
                totalActualExpenses: totalActualExpenses,
                remainingBudget: budgetedExpenseTotal - totalActualExpenses,
                categoryBreakdown: categoryBreakdown
            };
        }

        // 5. Recent Transactions (last 10 total, sorted by date)
        const recentTransactions = await Transaction.find({ user: userId })
            .sort({ transactionDate: -1, createdAt: -1 })
            .limit(10); // Limit to 10 for a combined recent view

        res.json({
            totalIncome: totalIncome,
            totalExpenses: totalExpenses,
            currentMonthBalance: currentMonthBalance,
            budgetVsActual: budgetVsActual,
            recentTransactions: recentTransactions
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};


// --- New Reporting Endpoints ---

// @desc    Get transactions by category for a given period and type (income/expense)
// @route   GET /api/dashboard/reports/transactions-by-category
// @access  Private
// @query   type=expense/income, period=monthly/quarterly/annually, year=YYYY, month=MM (optional)
exports.getTransactionsByCategory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { type, period, year, month } = req.query;

        if (!type || (type !== 'income' && type !== 'expense')) {
            return res.status(400).json({ msg: 'A valid transaction type (income or expense) is required.' });
        }

        const { startDate, endDate } = getDateRangeForPeriod(period, year, month);

        const transactionsByCategory = await Transaction.aggregate([
            {
                $match: {
                    user: new mongoose.Types.ObjectId(userId),
                    type: type, // Filter by type (income or expense)
                    transactionDate: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: '$category',
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { totalAmount: -1 } }
        ]);

        res.json({ type, startDate, endDate, transactionsByCategory });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get daily/monthly/yearly transaction totals for a given period (trend data)
// @route   GET /api/dashboard/reports/transaction-trends
// @access  Private
// @query   type=expense/income, period=monthly/yearly (for grouping), year=YYYY (required for yearly)
exports.getTransactionTrends = async (req, res) => {
    try {
        const userId = req.user.id;
        const { type, period, year } = req.query;

        if (!type || (type !== 'income' && type !== 'expense')) {
            return res.status(400).json({ msg: 'A valid transaction type (income or expense) is required.' });
        }

        if (period === 'yearly' && !year) {
            return res.status(400).json({ msg: 'Year is required for yearly trends.' });
        }
        
        // Define the group format and match query based on the period
        const groupFormat = period === 'monthly' ? { $dateToString: { format: '%Y-%m', date: '$transactionDate' } } : { $dateToString: { format: '%Y', date: '$transactionDate' } };
        const matchQuery = {
            user: new mongoose.Types.ObjectId(userId),
            type: type
        };

        if (year) {
            const startOfYear = new Date(year, 0, 1);
            const endOfYear = new Date(parseInt(year) + 1, 0, 0);
            endOfYear.setHours(23, 59, 59, 999);
            matchQuery.transactionDate = { $gte: startOfYear, $lte: endOfYear };
        }

        const trends = await Transaction.aggregate([
            { $match: matchQuery },
            {
                $group: {
                    _id: groupFormat,
                    totalAmount: { $sum: '$amount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json({ type, period, year, trends });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};