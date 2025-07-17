const mongoose = require('mongoose');

const UserInformationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true,
        unique: true // Ensures each user has only one profile
    },
    name: {
        type: String
        
    },
    bio: {
        type: String,
        maxlength: [200, 'Bio cannot be more than 200 words.']
    },
    profilepic: {
        
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