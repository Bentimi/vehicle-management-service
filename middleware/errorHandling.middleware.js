const AppError = require("../utils/AppError.utils");

const errorHandler = (err, _req, _res, _next) => {
    // Custom AppError
    if (err instanceof AppError) {
        return res.status(err.status).json({
            status: false,
            message: err.message
        });
    }

    // Default server error
    return res.status(500).json({
        success: false,
        message: "Internal server error",
        ...(process.env.NODE_ENV === 'development' && { error: err.message })
    })

}

module.exports = { errorHandler }