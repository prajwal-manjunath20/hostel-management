'use strict';

/**
 * Unified API response helpers.
 *
 * Convention:
 *  - List endpoints:   success(res, data, message, meta)  — meta MUST be populated
 *  - Single resource:  success(res, data, message, null)   — meta = null
 *  - Errors:           error(res, code, message, status)   — code = SCREAMING_SNAKE_CASE
 *
 * Shape (success):  { success: true,  message, data, meta }
 * Shape (error):    { success: false, error: { code, message } }
 */

exports.success = (res, data, message = 'OK', meta = null, status = 200) => {
    return res.status(status).json({ success: true, message, data, meta });
};

exports.created = (res, data, message = 'Created') => {
    return res.status(201).json({ success: true, message, data, meta: null });
};

exports.error = (res, code, message, status = 400) => {
    return res.status(status).json({ success: false, error: { code, message } });
};

exports.serverError = (res, err, logger) => {
    if (logger) logger.error('Unhandled server error', err);
    return res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: process.env.NODE_ENV === 'production'
                ? 'An unexpected error occurred'
                : err.message
        }
    });
};
