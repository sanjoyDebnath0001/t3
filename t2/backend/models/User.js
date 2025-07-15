// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); // Import crypto module

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        match: [/.+\@.+\..+/, 'Please fill a valid email address']
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['regular', 'accountant', 'manager', 'admin'],
        default: 'regular'
    },
    orgCode: {
        type: String,
        required: function () {
            return ['admin', 'manager', 'accountant'].includes(this.role);
        }
    },
    passwordResetToken: String,      // New field for reset token
    passwordResetExpires: Date,      // New field for token expiration
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// Method to compare passwords
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Method to generate password reset token
UserSchema.methods.getResetPasswordToken = function() {
    // Generate token
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash token and set to passwordResetToken field
    // Store hashed version in DB to compare with future request token
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set expire
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    return resetToken; // Return the unhashed token to send to the user
};

// Method to generate 2FA secret (for initial setup)
UserSchema.methods.generateTwoFactorSecret = function() {
    const secret = speakeasy.generateSecret({ length: 20, name: 'FinanceApp', issuer: 'YourAppName' });
    this.twoFactorSecret = secret.base32; // Store the base32 secret
    return secret; // Return full secret object (contains base32, otpauth_url)
};


module.exports = mongoose.model('User', UserSchema);