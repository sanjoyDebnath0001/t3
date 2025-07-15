// backend/controllers/budgetController.js
const Budget = require('../models/Budget');

// @desc    Get all budgets for a user
// @route   GET /api/budgets
// @access  Private
exports.getBudgets = async (req, res) => {
    try {
        const budgets = await Budget.find({ user: req.user.id }).sort({ startDate: -1 });
        res.json(budgets);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get single budget by ID for a user
// @route   GET /api/budgets/:id
// @access  Private
exports.getBudgetById = async (req, res) => {
    try {
        const budget = await Budget.findById(req.params.id);

        if (!budget) {
            return res.status(404).json({ msg: 'Budget not found' });
        }

        // Ensure budget belongs to the logged-in user
        if (budget.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized to view this budget' });
        }

        res.json(budget);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') { // Handle invalid ObjectId format
            return res.status(400).json({ msg: 'Invalid Budget ID' });
        }
        res.status(500).send('Server Error');
    }
};

// @desc    Create a new budget
// @route   POST /api/budgets
// @access  Private
exports.createBudget = async (req, res) => {
    const { name, period, startDate, endDate, categories, description } = req.body;

    try {
        const newBudget = new Budget({
            user: req.user.id, // Comes from auth middleware
            name,
            period,
            startDate,
            endDate,
            categories,
            description
        });

        const budget = await newBudget.save();
        res.status(201).json(budget); // 201 Created
    } catch (err) {
        console.error(err.message);
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Server Error');
    }
};

// @desc    Update an existing budget
// @route   PUT /api/budgets/:id
// @access  Private
exports.updateBudget = async (req, res) => {
    const { name, period, startDate, endDate, categories, description } = req.body;

    try {
        let budget = await Budget.findById(req.params.id);

        if (!budget) {
            return res.status(404).json({ msg: 'Budget not found' });
        }

        // Ensure budget belongs to the logged-in user
        if (budget.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized to update this budget' });
        }

        // Update fields
        budget.name = name || budget.name;
        budget.period = period || budget.period;
        budget.startDate = startDate || budget.startDate;
        budget.endDate = endDate || budget.endDate;
        budget.categories = categories || budget.categories;
        budget.description = description || budget.description;

        await budget.save(); // pre-save hook will update totalAllocatedAmount and updatedAt
        res.json(budget);

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'Invalid Budget ID' });
        }
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Server Error');
    }
};

// @desc    Delete a budget
// @route   DELETE /api/budgets/:id
// @access  Private
exports.deleteBudget = async (req, res) => {
    try {
        const budget = await Budget.findById(req.params.id);

        if (!budget) {
            return res.status(404).json({ msg: 'Budget not found' });
        }

        // Ensure budget belongs to the logged-in user
        if (budget.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized to delete this budget' });
        }

        await Budget.deleteOne({ _id: req.params.id }); // Use deleteOne for Mongoose 6+

        res.json({ msg: 'Budget removed' });

    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'Invalid Budget ID' });
        }
        res.status(500).send('Server Error');
    }
};
