// backend/controllers/reportController.js
const moment = require('moment'); // Good for date handling
const Transaction = require('../models/Transaction'); // Assuming your transaction model


const getDateRange = (query) => {
    const { startDate: queryStartDate, endDate: queryEndDate, period, year, month } = query;
    let startDate, endDate;

    if (queryStartDate && queryEndDate) {
        // If specific start and end dates are provided, use them
        startDate = moment(queryStartDate).startOf('day');
        endDate = moment(queryEndDate).endOf('day'); // Ensure end of day for inclusive range
    } else if (period && year) {
        // Fallback to period-based calculation
        const parsedYear = parseInt(year, 10);
        let parsedMonth = month ? parseInt(month, 10) - 1 : undefined; // Convert to 0-indexed if month is provided

        if (period === 'monthly') {
            startDate = moment().year(parsedYear).month(parsedMonth).startOf('month');
            endDate = moment().year(parsedYear).month(parsedMonth).endOf('month');
        } else if (period === 'quarterly') {
            // Moment's quarter() is 1-indexed. We need to derive the quarter from the 0-indexed month.
            // Example: month 0,1,2 -> quarter 1; month 3,4,5 -> quarter 2
            const quarter = Math.floor(parsedMonth / 3) + 1;
            startDate = moment().year(parsedYear).quarter(quarter).startOf('quarter');
            endDate = moment().year(parsedYear).quarter(quarter).endOf('quarter');
        } else if (period === 'annually') {
            startDate = moment().year(parsedYear).startOf('year');
            endDate = moment().year(parsedYear).endOf('year');
        } else {
            throw new Error('Invalid period specified.');
        }
    } else {
        throw new Error('Please provide a valid date range (startDate, endDate) or a period, year, and optionally month.');
    }

    return {
        startDate: startDate.toDate(), 
        endDate: endDate.toDate()
    };
};

// @desc Get expenses by category report
exports.getExpensesByCategory = async (req, res) => {
    try {
        const userId = req.user.id; // From auth middleware

        // Pass the entire req.query object to getDateRange
        let { startDate, endDate } = getDateRange(req.query);

        // Optional: Add validation for startDate/endDate if they are derived from period
        if (!startDate || !endDate) {
            return res.status(400).json({ msg: 'Unable to determine a valid date range from the provided parameters.' });
        }

        const expensesByCategory = await Transaction.aggregate([
            {
                $match: {
                    user: userId,
                    type: 'expense',
                    date: { $gte: startDate, $lte: endDate }
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

        res.json({ expensesByCategory, startDate, endDate }); // Send back date range for frontend display
    } catch (err) {
        console.error(err.message);
        // Provide more specific error messages
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
};

// @desc Get income by category report
exports.getIncomeByCategory = async (req, res) => {
    try {
        const userId = req.user.id;

        let { startDate, endDate } = getDateRange(req.query);

        if (!startDate || !endDate) {
            return res.status(400).json({ msg: 'Unable to determine a valid date range from the provided parameters.' });
        }

        const incomeByCategory = await Transaction.aggregate([
            {
                $match: {
                    user: userId,
                    type: 'income',
                    date: { $gte: startDate, $lte: endDate }
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

        res.json({ incomeByCategory, startDate, endDate });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
};

// @desc Get transaction trends report (expenses or income over time)
exports.getTransactionTrends = async (req, res) => {
    try {
        const { type } = req.query; // Only type is directly used here, the rest go to getDateRange
        const userId = req.user.id;

        if (!type) {
            return res.status(400).json({ msg: 'Transaction type is required for transaction trends.' });
        }
        if (type !== 'expense' && type !== 'income') {
            return res.status(400).json({ msg: 'Invalid transaction type. Must be "expense" or "income".' });
        }

        let { startDate, endDate } = getDateRange(req.query);

        if (!startDate || !endDate) {
            return res.status(400).json({ msg: 'Unable to determine a valid date range from the provided parameters for transaction trends.' });
        }

        // Determine aggregation granularity based on the 'period' from the query that getDateRange used.
        // It's safer to determine this based on what getDateRange successfully processed or what the frontend explicitly asks for.
        // For 'transaction-trends', typically you want trends over the chosen period, so you'd group by month if period is monthly/quarterly, and by year if annually.
        const { period } = req.query; // Re-extract period to determine groupByFormat

        let groupByFormat;
        if (period === 'monthly' || period === 'quarterly') {
            groupByFormat = { year: { $year: '$date' }, month: { $month: '$date' } };
        } else if (period === 'annually') {
            groupByFormat = { year: { $year: '$date' } };
        } else {
            // Default to monthly if no clear period or period is 'date-range' based
            // This ensures trends always have some grouping
            groupByFormat = { year: { $year: '$date' }, month: { $month: '$date' } };
        }


        const trends = await Transaction.aggregate([
            {
                $match: {
                    user: userId,
                    type: type,
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: groupByFormat,
                    totalAmount: { $sum: '$amount' }
                }
            },
            {
                $sort: { '_id.year': 1, '_id.month': 1 } // Sort by year, then month
            },
            // The $project stage for formatting _id for frontend display is better done on the frontend
            // or if needed, make sure the period information is available.
            // For now, let's simplify and send raw year/month and format on frontend.
        ]);

        // Further refine _id formatting for better display on the backend before sending
        // This makes the frontend's job easier.
        const formattedTrends = trends.map(item => {
            if (item._id && typeof item._id === 'object') {
                if (item._id.month) {
                    const monthName = moment().month(item._id.month - 1).format('MMM'); // Convert 1-indexed month to name
                    return { _id: `${monthName} ${item._id.year}`, totalAmount: item.totalAmount };
                } else if (item._id.year) {
                    return { _id: `${item._id.year}`, totalAmount: item.totalAmount };
                }
            }
            return item; // Return as is if format is unexpected
        });

        res.json({ trends: formattedTrends, startDate, endDate });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
};

// @desc Get net income report
exports.getNetIncomeReport = async (req, res) => {
    try {
        const userId = req.user.id;

        let { startDate, endDate } = getDateRange(req.query);

        if (!startDate || !endDate) {
            return res.status(400).json({ msg: 'Unable to determine a valid date range from the provided parameters.' });
        }

        const income = await Transaction.aggregate([
            {
                $match: {
                    user: userId,
                    type: 'income',
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            { $group: { _id: null, totalIncome: { $sum: '$amount' } } }
        ]);

        const expenses = await Transaction.aggregate([
            {
                $match: {
                    user: userId,
                    type: 'expense',
                    date: { $gte: startDate, $lte: endDate }
                }
            },
            { $group: { _id: null, totalExpenses: { $sum: '$amount' } } }
        ]);

        const totalIncome = income.length > 0 ? income[0].totalIncome : 0;
        const totalExpenses = expenses.length > 0 ? expenses[0].totalExpenses : 0;
        const netIncome = totalIncome - totalExpenses;

        res.json({
            totalIncome,
            totalExpenses,
            netIncome,
            startDate,
            endDate
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: err.message || 'Server Error' });
    }
};