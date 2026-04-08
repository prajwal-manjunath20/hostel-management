const { error } = require('../utils/apiResponse');

/**
 * Middleware to require verified email for sensitive actions
 */
exports.requireVerifiedEmail = (req, res, next) => {
    if (req.user && !req.user.isEmailVerified) {
        return error(res, 'EMAIL_NOT_VERIFIED', 'Please verify your email address before performing this action.', 403);
    }
    next();
};
