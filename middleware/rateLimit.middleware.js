const { RateLimiterRedis } = require("rate-limiter-flexible");
const Redis = require("ioredis");
require('dotenv').config();

const redisClient = new Redis(process.env.REDIS_URL, {
    enableOfflineQueue: false,
});

redisClient.on('error', (err) => {
    console.warn("Redis rate limiter client connection error:", err.message);
});

const createRateLimiterMiddleware = (name, points, duration) => {
    const rateLimiter = new RateLimiterRedis({
        storeClient: redisClient,
        keyPrefix: `rate_limit_${name}`,
        points: points,
        duration: duration,
    });

    return async (req, res, next) => {
        const clientKey = (req.user && req.user.uid) ? req.user.uid : req.ip;

        try {
            const rateLimiterRes = await rateLimiter.consume(clientKey);
            res.set({
                "X-RateLimit-Limit": points,
                "X-RateLimit-Remaining": rateLimiterRes.remainingPoints,
                "X-RateLimit-Reset": new Date(Date.now() + rateLimiterRes.msBeforeNext).getTime() / 1000,
            });
            next();
        } catch (rejRes) {
            if (rejRes instanceof Error) {
                console.warn(`Rate limiter Redis error: ${rejRes.message}, allowing request fallback.`);
                return next();
            }

            const totalSeconds = Math.round(rejRes.msBeforeNext / 1000) || 1;
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        const formattedTime =
            minutes > 0
                ? `${minutes}m:${String(seconds).padStart(2, '0')}s`
                : `${seconds}s`;

        res.set({
            "X-RateLimit-Limit": points,
            "X-RateLimit-Remaining": 0,
            "X-RateLimit-Reset": new Date(Date.now() + rejRes.msBeforeNext).getTime() / 1000,
            "Retry-After": totalSeconds
        });

        res.status(429).json({
            success: false,
            message: `You're sending requests too fast. Try again in ${formattedTime}.`,
            retry_after_seconds: totalSeconds,
            retry_after_formatted: formattedTime
        });
        };
    };
};


const dataUploadLimiter = createRateLimiterMiddleware("data_upload", 10, 60);

const anonymousLimiter = createRateLimiterMiddleware("anonymous_general", 30, 15 * 60);

const signUpLimiter = createRateLimiterMiddleware("signup", 5, 15 * 60);

const signInLimiter = createRateLimiterMiddleware("signin", 7, 10 * 60);

const authenticatedLimiter = createRateLimiterMiddleware("authenticated_general", 1000, 15 * 60);

module.exports = {
    dataUploadLimiter,
    signUpLimiter,
    signInLimiter,
    anonymousLimiter,
    authenticatedLimiter
};