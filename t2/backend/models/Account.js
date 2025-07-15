// models/Account.js

const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    name: {
        type: String,
        required: [true, 'Account name is required'],
        trim: true,
        maxlength: [50, 'Account name cannot be more than 50 characters']
    },
    type: {
        type: String,
        required: [true, "Account type is required (e.g., 'Savings', 'Checking')"],
        enum: ['Savings', 'Checking', 'Credit Card', 'Cash', 'Investment', 'Loan', 'Other'], // 'other' changed to 'Other' for enum consistency
        default: 'Checking' 
    },
    
    initialBalance: {
        type: Number,
        required: [true, 'Initial balance is required'], // Makes sure frontend always sends it
        default: 0 
    },
    currentBalance: {
        type: Number,
        // --- IMPROVED: currentBalance now defaults to initialBalance if not explicitly set ---
        default: function() { return this.initialBalance; }
    },
    currency: {
        type: String,
        required: [true, 'Select currency'],
        default: 'INR',
        trim: true,
        uppercase: true,
        maxlength: [5, 'Currency code cannot be more than 5 characters']
    },
    description: {
        type: String,
        maxlength: [200, 'Description within 200 characters']
    }
}, {
    timestamps: true
});


AccountSchema.index({ user: 1, name: 1 }, { unique: true });


module.exports = mongoose.model('Account', AccountSchema);