const userService = require('../services/user.service');


const user_signUp = async (req, res, next) => {
    try {
        const data = req.body;
        const user = await userService.userSignUp(data);
        res.status(201).json({ status: 'success', user})
    } catch (e) {
        next(e)
    }
}

const get_users = async (req, res, next) => {
    try {
        const page = req.query.page || 1;
        const pageSize = req.query.pageSize || 10;
        const users = await userService.getUsers(page, pageSize);
        res.success(users, "Users successfully retrieved")
    } catch (e) {
        next(e);
    }
}

module.exports = {
    user_signUp,
    get_users
}