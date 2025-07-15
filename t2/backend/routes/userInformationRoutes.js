const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const userInformationController = require('../controllers/userInformationController'); // Corrected import name for consistency

// @route   GET /api/userinfo
// @desc    Get the single user information entry for the logged-in user
// @access  Private
router.get('/', auth, userInformationController.getUserInformation);

// @route   GET /api/userinfo/:id
// @desc    Get a single user info entry by ID for a user
// @access  Private
router.get('/:id', auth, userInformationController.getUserInformationById);

// @route   POST /api/userinfo
// @desc    Create a new user information profile
// @access  Private
router.post('/', auth, userInformationController.createOrUpdateUserInformation);

// @route   PUT /api/userinfo/:id
// @desc    Update a user's profile details
// @access  Private
router.put("/:id", auth, userInformationController.createOrUpdateUserInformation);

module.exports = router;