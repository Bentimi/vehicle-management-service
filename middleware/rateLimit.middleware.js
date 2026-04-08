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

            res.set({
                "X-RateLimit-Limit": points,
                "X-RateLimit-Remaining": 0,
                "X-RateLimit-Reset": new Date(Date.now() + rejRes.msBeforeNext).getTime() / 1000,
                "Retry-After": Math.round(rejRes.msBeforeNext / 1000) || 1
            });
            
            res.status(429).json({
                success: false,
                message: "Too many requests, please try again later.",
                retry_after_seconds: Math.round(rejRes.msBeforeNext / 1000) || 1
            });
        }
    };
};


const dataUploadLimiter = createRateLimiterMiddleware("data_upload", 10, 60);

const anonymousLimiter = createRateLimiterMiddleware("anonymous_general", 30, 15 * 60);

const signUpLimiter = createRateLimiterMiddleware("signup", 5, 15 * 60);

const signInLimiter = createRateLimiterMiddleware("signin", 10, 15 * 60);

const authenticatedLimiter = createRateLimiterMiddleware("authenticated_general", 1000, 15 * 60);

module.exports = {
    dataUploadLimiter,
    signUpLimiter,
    signInLimiter,
    anonymousLimiter,
    authenticatedLimiter
};