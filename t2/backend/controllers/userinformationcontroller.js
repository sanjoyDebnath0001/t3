const UserInformation = require('../models/UserInformation');

// @desc    Get the single user information entry for the logged-in user
// @route   GET /api/userinfo
// @access  Private
exports.getUserInformation = async (req, res) => {
    try {
        
        const userInformation = await UserInformation.findOne({ user: req.user.id });

        if (!userInformation) {
            // A user may not have created their profile yet.
            return res.status(404).json({ msg: 'User information not found. Please create a profile.' });
        }

        res.json(userInformation);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

// @desc    Get a single user info entry by ID for a user
// @route   GET /api/userinfo/:id
// @access  Private
exports.getUserInformationById = async (req, res) => {
    try {
        const userInformation = await UserInformation.findById(req.params.id);

        if (!userInformation) {
            return res.status(404).json({ msg: 'User information not found.' });
        }
        
        // Ensure the fetched profile belongs to the authenticated user
        if (userInformation.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized to view this profile.' });
        }

        res.json(userInformation);
    } catch (err) {
        console.error(err.message);
        if (err.kind === 'ObjectId') {
            return res.status(400).json({ msg: 'Invalid user information ID format.' });
        }
        res.status(500).send('Server Error');
    }
};

// @desc    Create or update a user's profile details
// @route   POST /api/userinfo OR PUT /api/userinfo
// @access  Private
exports.createOrUpdateUserInformation = async (req, res) => {
    // Corrected typo from porpose to purpose
    const { name, bio, profilepic, purpose } = req.body;
    
    // Build an object with the fields to update/create
    const userInformationFields = {};
    userInformationFields.user = req.user.id;
    if (name) userInformationFields.name = name;
    if (bio) userInformationFields.bio = bio;
    if (profilepic) userInformationFields.profilepic = profilepic;
    if (purpose) userInformationFields.purpose = purpose;

    try {
        // Find and update the document for the current user.
        // upsert: true means if no document matches, create a new one.
        // new: true returns the modified document rather than the original.
        // runValidators: true ensures schema validation is run on updates.
        const updatedUserInformation = await UserInformation.findOneAndUpdate(
            { user: req.user.id },
            { $set: userInformationFields },
            { new: true, upsert: true, runValidators: true }
        );

        res.json(updatedUserInformation);
    } catch (err) {
        console.error(err.message);
        // Mongoose validation errors
        if (err.name === 'ValidationError') {
            return res.status(400).json({ msg: err.message });
        }
        res.status(500).send('Server Error');
    }
};