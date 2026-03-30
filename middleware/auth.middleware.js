const jwt = require("jsonwebtoken");
const AppError = require("../utils/AppError.utils");

const requireAuth = async (req, res, next) => {
    try {
        let accessToken = req.cookies.accessToken;
        if (!accessToken && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            accessToken = req.headers.authorization.split(' ')[1];
        }

        const { csrfToken } = req.cookies;

        if (!accessToken) {
            throw new AppError("Authentication required. Please login.", 401);
        }

        // Verify CSRF (Cookie presence validation)
        const isStateChangingMethod = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method);
        
        if (isStateChangingMethod) {
            if (!csrfToken) {
                throw new AppError("CSRF verification failed.", 403);
            }
        }

        // Verify Access Token
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
        req.user = { id: decoded.userId };
        
        next();
    } catch (e) {
        if (e.name === 'TokenExpiredError') {
            return res.status(401).json({ status: 'error', message: 'Token expired. Please refresh your token.' });
        }
        next(e);
    }
};

module.exports = { requireAuth };
