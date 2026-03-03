'use strict';

const { randomUUID } = require('crypto');
const logger = require('../utils/logger');

/**
 * Attaches a unique request ID to every incoming request for tracing.
 * Logs method, path, user ID, and status on response finish.
 */
module.exports = (req, res, next) => {
    req.id = randomUUID();

    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const meta = {
            requestId: req.id,
            method: req.method,
            path: req.path,
            status: res.statusCode,
            durationMs: duration,
            userId: req.user?.id || null
        };

        if (res.statusCode >= 500) {
            logger.error('Request error', meta);
        } else if (res.statusCode >= 400) {
            logger.warn('Request client error', meta);
        } else {
            logger.info('Request completed', meta);
        }
    });

    next();
};
