// backend/models/Budget.js
const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true
    },
    name: {
        type: String,
        required: [true, 'Budget name is required'],
        trim: true
    },
    period: {
        type: String,
        enum: ['monthly', 'quarterly', 'annually', 'custom'],
        default: 'monthly'
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required']
    },
    endDate: {
        type: Date,
        required: [true, 'End date is required']
    },
    // Budget categories with allocated amounts
    categories: [
        {
            name: {
                type: String,
                required: [true, 'Category name is required'],
                trim: true
            },
            allocatedAmount: {
                type: Number,
                required: [true, 'Allocated amount is required'],
                min: 0
            },
            // You might add a type here (e.g., 'income' or 'expense')
            type: {
                type: String,
                enum: ['income', 'expense'],
                default: 'expense' // Most categories will be expenses
            }
        }
    ],
    totalAllocatedAmount: { // Sum of all allocated amounts in categories
        type: Number,
        default: 0
    },
    description: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Pre-save hook to calculate totalAllocatedAmount
BudgetSchema.pre('save', function(next) {
    let total = 0;
    this.categories.forEach(cat => {
        if (cat.type === 'expense') {
            total -= cat.allocatedAmount; // Expenses reduce the budget
        } else if (cat.type === 'income') {
            total += cat.allocatedAmount; // Income adds to the budget
        }
    });
    this.totalAllocatedAmount = total;
    this.updatedAt = Date.now();
    next();
});


module.exports = mongoose.model('Budget', BudgetSchema);