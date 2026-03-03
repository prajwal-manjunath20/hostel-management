/**
 * Middleware to require verified email for sensitive actions
 */
exports.requireVerifiedEmail = (req, res, next) => {
    if (req.user && !req.user.isEmailVerified) {
        return res.status(403).json({
            error: 'Email not verified',
            message: 'Please verify your email address before performing this action.',
            code: 'EMAIL_NOT_VERIFIED'
        });
    }
    next();
};
