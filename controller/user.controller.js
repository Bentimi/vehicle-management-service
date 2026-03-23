const userService = require('../services/user.service');


const user_signUp = async (req, res, next) => {
    try {
        const data = req.body;
        const user = userService.userSignUp(data);
        res.status(201).json({ status: 'success', user})
    } catch (e) {
        next(e)
    }
}

module.exports = {
    user_signUp
}