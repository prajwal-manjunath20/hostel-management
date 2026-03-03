const { ROLES } = require('../config/constants');

/**
 * Middleware to check if user account is active
 * Blocks suspended users from accessing protected routes
 */
exports.checkAccountStatus = (req, res, next) => {
    if (req.user && req.user.accountStatus === 'suspended') {
        return res.status(403).json({
            error: 'Account suspended',
            message: 'Your account has been suspended by the platform administrator.',
            reason: req.user.suspensionReason,
            suspendedAt: req.user.suspendedAt
        });
    }
    next();
};

/**
 * Middleware to check account status for owners only
 * Apply to owner-specific routes
 */
exports.checkOwnerAccountStatus = (req, res, next) => {
    if (req.user && req.user.role === ROLES.OWNER && req.user.accountStatus === 'suspended') {
        return res.status(403).json({
            error: 'Account suspended',
            message: 'Your owner account has been suspended.',
            reason: req.user.suspensionReason
        });
    }
    next();
};
