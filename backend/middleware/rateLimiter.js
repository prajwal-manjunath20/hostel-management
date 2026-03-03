const rateLimit = require('express-rate-limit');

// Rate limiter for owner applications (max 3 applications per day per IP)
const ownerApplicationLimiter = rateLimit({
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    max: 3, // Limit each IP to 3 requests per windowMs
    message: {
        error: 'Too many owner applications from this IP, please try again after 24 hours'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests: false
});

// Rate limiter for authentication endpoints (stricter)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: {
        error: 'Too many login attempts, please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    ownerApplicationLimiter,
    authLimiter
};
