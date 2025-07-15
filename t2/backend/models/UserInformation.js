const mongoose = require('mongoose');

const UserInformationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true,
        unique: true // Ensures each user has only one profile
    },
    name: {
        type: String,
        trim: true
    },
    bio: {
        type: String,
        maxlength: [200, 'Bio cannot be more than 200 words.']
    },
    profilepic: {
        // Storing images directly in the database is often discouraged for performance.
        // It's better to store a URL to a file in cloud storage (e.g., S3).
        // This is a correct way if you choose to store the data directly.
        data: Buffer,
        contentType: String
    },
    purpose: {
        type: String,
        maxlength: [50, 'Purpose cannot be more than 50 characters.']
    },
}, {
    timestamps: true // This automatically adds createdAt and updatedAt fields
});

module.exports = mongoose.model('UserInformation', UserInformationSchema);