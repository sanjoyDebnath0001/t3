// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');
const crypto =require('crypto');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const authMiddleware = require('../middleware/auth');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
require('dotenv').config();

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post(
    '/register',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
        check('orgCode').custom((value, { req }) => {
            if (['admin', 'manager', 'accountant'].includes(req.body.role) && !value) {
                throw new Error('Organization Code is required for this role');
            }
            return true;
            })
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, role, orgCode } = req.body;

        try {
            let user = await User.findOne({ email });

            if (user) {
                return res.status(400).json({ msg: 'User already exists' });
            }

            user = new User({
                email,
                password 
            });

            await user.save();

            const payload = {
                user: {
                    id: user.id,
                    role: user.role
                }
            };

            jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: '1h' }, // Token expires in 1 hour
                (err, token) => {
                    if (err) throw err;
                    res.json({ token });
                }
            );
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);


// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
    '/login',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            let user = await User.findOne({ email });

            if (!user) {
                return res.status(400).json({ msg: 'Invalid Credentials' });
            }

            const isMatch = await user.matchPassword(password);

            if (!isMatch) {
                return res.status(400).json({ msg: 'Invalid Credentials' });
            }

            const payload = {
                user: {
                    id: user.id,
                    role: user.role
                }
            };

            jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: '1h' },
                (err, token) => {
                    if (err) throw err;
                    res.json({ token });
                }
            );
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);
//Post api/auth/forgotpassword
router.post('/forgotpassword',async(req,res)=>{
    const { email } = req.body;
    try{
        const user = await User.findOne({ email });

        if(!user){
            return res.status(200).json({msg:'if an account with that email exists, a password reset link has been sent.'});
        }
        const resetToken=user.getResetPasswordToken();
        await user.save();
        const resetUrl=`${req.protocol}://${req.get('host')}/resetpassword/${resetToken}`;
        const message = `<h1>You have requested a password reset</h1>
                        <p>Please go to this link to reset your password:</p>
                        <a href="${resetUrl}" Clicktracking="off">${resetUrl}</a>
                        <p>This link is valid for 10 minutes.</p>
                        <p>If you did not request this,please ignore this email. </p>
                        `;
        try{
            await sendEmail({
                email: user.email,
                subject:'Password reset Request for Finance App',
                message,
            });
            res.status(200).json({msg:'Passworw reset link sent to your email.'});
        } catch (error){
            user.passwordResetToken =undefined;
            user.passwordResetExpires =undefined;
            await user.save();
            console.error(error);
            return res.status(500).json({msg:'Email could not be sent. Server error.'});
            }
        }catch(err){
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// @route   PUT api/auth/resetpassword/:token
// @desc    Reset user password
// @access  Public
router.put(
    '/resetpassword/:resettoken',
    [
        check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
        check('password2', 'Confirm password is required').exists(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { password, password2 } = req.body;
        const resettoken = req.params.resettoken;

        if (password !== password2) {
            return res.status(400).json({ msg: 'Passwords do not match' });
        }

        // Hash incoming token to compare with the hashed token in DB
        const resetPasswordTokenHashed = crypto.createHash('sha256').update(resettoken).digest('hex');

        try {
            const user = await User.findOne({
                passwordResetToken: resetPasswordTokenHashed,
                passwordResetExpires: { $gt: Date.now() } // Token must not be expired
            });

            if (!user) {
                return res.status(400).json({ msg: 'Invalid or expired reset token' });
            }

            // Set new password (it will be hashed by pre-save hook)
            user.password = password;
            user.passwordResetToken = undefined; // Clear token fields
            user.passwordResetExpires = undefined;

            await user.save(); // Save user with new password and cleared token fields

            res.status(200).json({ msg: 'Password reset successful. You can now log in with your new password.' });

        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// Extend login route to handle 2FA
// @route   POST api/auth/login
// @desc    Authenticate user & get token (and handle 2FA)
// @access  Public
router.post(
    '/login',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password, twoFactorCode } = req.body; // Added twoFactorCode

        try {
            let user = await User.findOne({ email });

            if (!user) {
                return res.status(400).json({ msg: 'Invalid Credentials' });
            }

            const isMatch = await user.matchPassword(password);

            if (!isMatch) {
                return res.status(400).json({ msg: 'Invalid Credentials' });
            }

            // --- 2FA Logic ---
            if (user.isTwoFactorEnabled) {
                if (!twoFactorCode) {
                    // User needs to provide 2FA code
                    return res.status(400).json({ msg: 'Two-factor authentication is enabled. Please provide your 2FA code.', twoFactorRequired: true });
                }

                const verified = speakeasy.totp.verify({
                    secret: user.twoFactorSecret,
                    encoding: 'base32',
                    token: twoFactorCode,
                    window: 1 // Allows for codes generated 30 seconds before or after current time
                });

                if (!verified) {
                    return res.status(401).json({ msg: 'Invalid 2FA code' });
                }
            }
            // --- End 2FA Logic ---

            const payload = {
                user: {
                    id: user.id,
                    role: user.role
                }
            };

            jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: '1h' },
                (err, token) => {
                    if (err) throw err;
                    res.json({ token, isTwoFactorEnabled: user.isTwoFactorEnabled }); // Send 2FA status
                }
            );
        } catch (err) {
            console.error(err.message);
            res.status(500).send('Server Error');
        }
    }
);

// @route   POST api/auth/2fa/generate-secret
// @desc    Generate 2FA secret and QR code for user
// @access  Private (requires authentication)
router.post('/2fa/generate-secret', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        if (user.isTwoFactorEnabled) {
            return res.status(400).json({ msg: 'Two-factor authentication is already enabled for this user.' });
        }

        const secret = user.generateTwoFactorSecret(); // Generates and saves secret to user model
        await user.save();

        qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ msg: 'Error generating QR code' });
            }
            res.json({
                secret: secret.base32,
                qrCodeUrl: data_url,
                otpauthUrl: secret.otpauth_url
            });
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/2fa/verify-setup
// @desc    Verify 2FA code during initial setup and enable 2FA
// @access  Private (requires authentication)
router.post('/2fa/verify-setup', authMiddleware, async (req, res) => {
    const { token } = req.body; // The 2FA code from authenticator app

    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        if (user.isTwoFactorEnabled) {
            return res.status(400).json({ msg: 'Two-factor authentication is already enabled.' });
        }
        if (!user.twoFactorSecret) {
            return res.status(400).json({ msg: '2FA setup not initiated. Generate a secret first.' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token: token,
            window: 1 // Allows for codes generated 30 seconds before or after current time
        });

        if (verified) {
            user.isTwoFactorEnabled = true;
            await user.save();
            res.json({ msg: 'Two-factor authentication successfully enabled!' });
        } else {
            res.status(400).json({ msg: 'Invalid 2FA code. Please try again.' });
        }

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/auth/2fa/disable
// @desc    Disable 2FA for a user (requires authentication and potentially current password)
// @access  Private (requires authentication)
router.post('/2fa/disable', authMiddleware, async (req, res) => {
    // For disabling, you might want to require the current password as well for security
    const { password } = req.body;

    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ msg: 'User not found' });
        }
        if (!user.isTwoFactorEnabled) {
            return res.status(400).json({ msg: 'Two-factor authentication is not currently enabled.' });
        }

        // Optional: Verify user's password before disabling 2FA
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ msg: 'Incorrect password. Cannot disable 2FA.' });
        }

        user.isTwoFactorEnabled = false;
        user.twoFactorSecret = undefined; // Clear the secret for security
        await user.save();

        res.json({ msg: 'Two-factor authentication successfully disabled!' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


module.exports = router;