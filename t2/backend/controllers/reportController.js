// backend/controllers/reportController.js
const Transaction = require('../models/Transaction'); // Use the unified Transaction model
const mongoose = require('mongoose');

// Helper function to validate and parse date ranges
const parseDateRange = (startDateStr, endDateStr) => {
    const startDate = startDateStr ? new Date(startDateStr) : null;
    const endDate = endDateStr ? new Date(endDateStr) : null;

    if (startDate && isNaN(startDate.getTime())) {
        throw new Error('Invalid start date.');
    }
    if (endDate && isNaN(endDate.getTime())) {
        throw new Error('Invalid end date.');
    }

    // Adjust endDate to end of day for inclusive filtering
    if (endDate) {
        endDate.setHours(23, 59, 59, 999);
    }

    return { startDate, endDate };
};

// @desc    Get transactions by category report (for either spending or income)
// @route   GET /api/reports/transactions-by-category
// @access  Private
// @query   type=expense/income, startDate=YYYY-MM-DD, endDate=YYYY-MM-DD
exports.getTransactionsByCategory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { type, startDate, endDate } = req.query;

        if (!type || (type !== 'expense' && type !== 'income')) {
            return res.status(400).json({ msg: "Query parameter 'type' must be 'expense' or 'income'." });
        }

        const { startDate: parsedStartDate, endDate: parsedEndDate } = parseDateRange(startDate, endDate);

        const matchStage = {
            user: new mongoose.Types.ObjectId(userId),
            type: type
        };

        if (parsedStartDate || parsedEndDate) {
            matchStage.transactionDate = {};
            if (parsedStartDate) {
                matchStage.transactionDate.$gte = parsedStartDate;
            }
            if (parsedEndDate) {
                matchStage.transactionDate.$lte = parsedEndDate;
            }
        }

        const report = await Transaction.aggregate([
            { $match: matchStage },
            { $group: { _id: '$category', totalAmount: { $sum: '$amount' } } },
            { $sort: { totalAmount: -1 } }
        ]);

        res.json({
            startDate: parsedStartDate,
            endDate: parsedEndDate,
            type,
            report
        });
    } catch (err) {
        console.error(err.message);
        if (err.message === 'Invalid start date.' || err.message === 'Invalid end date.') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).json({ msg: 'Server Error' });
    }
};

// @desc    Get net income/loss report for a period
// @route   GET /api/reports/net-income
// @access  Private
// @query   startDate=YYYY-MM-DD, endDate=YYYY-MM-DD
exports.getNetIncomeReport = async (req, res) => {
    try {
        const userId = req.user.id;
        const { startDate, endDate } = parseDateRange(req.query.startDate, req.query.endDate);

        const matchStage = {
            user: new mongoose.Types.ObjectId(userId)
        };

        if (startDate || endDate) {
            matchStage.transactionDate = {};
            if (startDate) {
                matchStage.transactionDate.$gte = startDate;
            }
            if (endDate) {
                matchStage.transactionDate.$lte = endDate;
            }
        }

        // Use a single aggregation to get both income and expenses
        const aggregatedResult = await Transaction.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: '$type',
                    total: { $sum: '$amount' }
                }
            }
        ]);

        const totalIncome = aggregatedResult.find(item => item._id === 'income')?.total || 0;
        const totalExpenses = aggregatedResult.find(item => item._id === 'expense')?.total || 0;
        
        const netIncome = totalIncome - totalExpenses;

        res.json({
            startDate: startDate,
            endDate: endDate,
            totalIncome,
            totalExpenses,
            netIncome
        });
    } catch (err) {
        console.error(err.message);
        if (err.message === 'Invalid start date.' || err.message === 'Invalid end date.') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).json({ msg: 'Server Error' });
    }
};