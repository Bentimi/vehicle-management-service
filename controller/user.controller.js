const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const client = require("../config/redis");
const userService = require('../services/user.service');
const User = require("../models/user.model");

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
            expiresIn: '15m'
        });

        const newJti = uuidv4();
        const newRefreshToken = jwt.sign({ userId: user._id, jti: newJti }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
            expiresIn: '30m'
        });

        await client.setEx(`refresh_token:${user._id}:${newJti}`, 30 * 60, '1');

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 1000 // 7 days
        });

        const csrfToken = uuidv4();
        res.cookie('csrfToken', csrfToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
        });

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.success({ user }, "Login successful")
    } catch (e) {
        next(e);
    }
}

const refresh_token = async (req, res, next) => {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken) {
            return res.status(401).json({ status: 'error', message: 'No refresh token provided' });
        }

        let decoded;
        try {
            decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
        } catch (err) {
            return res.status(401).json({ status: 'error', message: 'Invalid refresh token' });
        }

        const { userId, jti } = decoded;

        // Check Redis for JTI
        const isValid = await client.get(`refresh_token:${userId}:${jti}`);

        if (!isValid) {
            // Token Reuse Detection
            const keys = await client.keys(`refresh_token:${userId}:*`);
            if (keys.length > 0) {
                await client.del(keys); // Invalidate all refresh tokens for user
            }
            return res.status(403).json({ status: 'error', message: 'Token reuse detected. Please login again.' });
        }

        // Invalidate old JTI
        await client.del(`refresh_token:${userId}:${jti}`);

        const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
            expiresIn: '15m'
        });

        const newJti = uuidv4();
        const newRefreshToken = jwt.sign({ userId, jti: newJti }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
            expiresIn: '7d'
        });

        await client.setEx(`refresh_token:${userId}:${newJti}`, 7 * 24 * 60, '1');

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 7 * 24 * 60 * 1000 // 7 days
        });

        const csrfToken = uuidv4();
        res.cookie('csrfToken', csrfToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
        });

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.success(null, "Token refreshed successfully");
    } catch (e) {
        next(e);
    }
}

const get_me = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user || (!user.active)) {
            return res.status(401).json({ status: 'error', message: 'Account is inactive or not found.' });
        }
        res.success({ user }, "Session valid");
    } catch (e) {
        next(e);
    }
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
        const { refreshToken } = req.cookies;
        if (refreshToken) {
            try {
                // Ignore expiration so we can delete the record even if the token just expired
                const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, { ignoreExpiration: true });
                const { userId, jti } = decoded;
                if (userId && jti) {
                    await client.del(`refresh_token:${userId}:${jti}`);
                }
            } catch (err) {
                next(err);
            }
        }

        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax'
        });

        res.clearCookie('accessToken', {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax'
        });
        
        res.clearCookie('csrfToken', {
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

const change_password = async (req, res, next) => {
    try { 
        const userId = req.user.id;
        const targetId = req.params.id;
        const data = req.body;
        const result = await userService.changePassword(userId, targetId, req.body);
        res.success(result, "Password changed successfully")
    } catch (e) {
        next(e);
    }
}

const role_allocation = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const targetId = req.params.id;
        const data = req.body;
        const result = await userService.roleAllocation(userId, targetId, data);
        res.success(result, "User role updated successfully")
    } catch (e) {
        next(e);
    }
}

module.exports = {
    user_signUp,
    user_login,
    get_me,
    refresh_token,
    user_logout,
    get_users,
    userActions,
    change_password,
    role_allocation
}