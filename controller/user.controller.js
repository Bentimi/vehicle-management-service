const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const client = require("../config/redis");
const userService = require('../services/user.service');

const isProduction = process.env.NODE_ENV === 'production';


const user_signUp = async (req, res, next) => {
    try {
        const data = req.body;
        const user = await userService.userSignUp(data);
        res.status(201).json({ status: 'success', user})
    } catch (e) {
        next(e)
    }
}

const user_login = async (req, res, next) => {
    try {
        const data = req.body;
        const loginResponse = await userService.userLogin(data);
        const user = loginResponse.user;

        const accessToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: '30m'
        });

        const csrfToken = uuidv4();
        res.cookie('csrfToken', csrfToken, {
            httpOnly: false,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
        });

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 30 * 60 * 1000 // 30 minutes
        });

        res.success({ user, csrfToken }, "Login successful")
    } catch (e) {
        next(e);
    }
}

const refresh_token = async (req, res, next) => {
    // Sliding sessions now handle continuous rotation automatically on active requests.
    // If the frontend calls this, it means the 30-minute inactivity limit was exceeded and they truly expired.
    return res.status(401).json({ status: 'error', message: 'Session expired due to inactivity. Please login again.' });
}

const get_users = async (req, res, next) => {
    try {
        const userId = req.user.id
        const page = parseInt(req.query.page) || 1;
        const pageSize = parseInt(req.query.pageSize) || 10;
        const search = req.query.search || '';
        const usersData = await userService.getUsers(page, pageSize, search, userId);
        res.success(usersData, "Users successfully retrieved")
    } catch (e) {
        next(e);
    }
}

const user_logout = async (req, res, next) => {
    try {
        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax'
        });
        
        res.clearCookie('csrfToken', {
            httpOnly: false,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax'
        });

        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax'
        });

        res.success(null, "Logged out successfully");
    } catch (e) {
        next(e);
    }
}

const userActions = async (req, res, next) => {
    try {

        const method = req.method.toLowerCase();
        const targetId = req.params.id;
        const userId = req.user.id;

        const actions = {
            get: async () => await userService.userProfile(userId, targetId),
            put: async () => await userService.updateProfile(userId, targetId, req.body)
        }
        if (!actions[method]) return res.status(405).end();
        const result = await actions[method]();

        res.success(result, "user profile")
    } catch (e) {
        next(e);
    }
}

module.exports = {
    user_signUp,
    user_login,
    refresh_token,
    user_logout,
    get_users,
    userActions
}