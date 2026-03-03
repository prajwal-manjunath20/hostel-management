'use strict';

const isDev = process.env.NODE_ENV !== 'production';

/**
 * Core structured log emitter.
 * Swap this single function to use Winston/Pino later — controllers never change.
 */
function emit(level, message, meta = {}) {
    const entry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        ...meta
    };

    // In production strip stack traces from structured output
    if (!isDev && entry.stack) {
        delete entry.stack;
    }

    // eslint-disable-next-line no-console
    console[level === 'error' ? 'error' : 'log'](JSON.stringify(entry));
}

const logger = {
    /**
     * @param {string} message
     * @param {object} [meta] - arbitrary key-value pairs (requestId, userId, etc.)
     */
    info(message, meta = {}) {
        emit('info', message, meta);
    },

    warn(message, meta = {}) {
        emit('warn', message, meta);
    },

    /**
     * @param {string} message
     * @param {Error|object} [errorOrMeta]
     * @param {object} [extra]
     */
    error(message, errorOrMeta = {}, extra = {}) {
        const meta = errorOrMeta instanceof Error
            ? { ...extra, error: errorOrMeta.message, stack: isDev ? errorOrMeta.stack : undefined }
            : { ...errorOrMeta, ...extra };
        emit('error', message, meta);
    },

    debug(message, meta = {}) {
        if (isDev) emit('debug', message, meta);
    }
};

module.exports = logger;
