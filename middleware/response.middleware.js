const responseHandler = (req, res, next) => {
    res.success = (data, message="Success", statusCode = 200)

    return res.status(statusCode).json({
        status: 'success',
        message,
        data
    })
}

module.exports = { responseHandler }