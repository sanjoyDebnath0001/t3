
const errorHandler = (err, res, customMessage = 'Server error') => {
    console.error('An error occurred:', err.message); // Log the detailed error on the server side

    if (err.name === 'ValidationError') {
        // Mongoose validation errors
        // Example: if a required field is missing or data type is wrong
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({ message: messages.join(', ') });
    }

    if (err.code === 11000) {
        // Duplicate key error (e.g., unique: true field)
        const field = Object.keys(err.keyValue)[0];
        const value = err.keyValue[field];
        return res.status(409).json({ message: `Duplicate ${field}: ${value}. Please use a different value.` });
    }

    if (err.kind === 'ObjectId') {
        // Invalid MongoDB ObjectId format
        return res.status(400).json({ message: 'Invalid ID format' });
    }

    // Generic 500 error for unhandled errors
    res.status(500).send(customMessage);
};

module.exports = errorHandler;