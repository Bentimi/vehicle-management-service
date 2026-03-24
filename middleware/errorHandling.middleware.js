const AppError = require("../utils/AppError.utils");

const errorHandler = (err, _req, res, _next) => {
    // Custom AppError
    if (err instanceof AppError) {
        return res.status(err.status).json({
            status: false,
            message: err.message
        });
    }

    if (err.name === 'CastError' ) {
        return res.status(400).json({
            status: false,
            message: `Invalid ${err.path} : ${err.value}`
        });
    }

    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        return res.status(400).json({
            status: false,
            message: 'Validation error',
            errros: messages
        })
    }

    if (err.code === 11000) {
        const field = Object.keys(err.keyPattern) [0];
        return res.status(409).json({
            status: false,
            message: `Duplicate value for ${field}`
        })
    }

    // Default server error
    return res.status(500).json({
        success: false,
        message: "Internal server error",
        ...(process.env.NODE_ENV === 'development' && { error: err.message })
    })

}

module.exports = { errorHandler }