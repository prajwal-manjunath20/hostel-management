// Centralized Error Handler Middleware
const logger = require('../utils/logger');
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode).json({
            success: false,
            error: { code: 'DEV_ERROR', message: err.message },
            stack: err.stack,
            details: err
        });
    } else {
        // Production: don't leak error details
        if (err.isOperational) {
            res.status(err.statusCode).json({
                success: false,
                error: { code: err.code || 'APP_ERROR', message: err.message }
            });
        } else {
            // Programming or unknown error: never leak internals
            logger.error('Unhandled application error', err);
            res.status(500).json({
                success: false,
                error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' }
            });
        }
    }
};

// Handle unhandled promise rejections
const unhandledRejectionHandler = (err) => {
    logger.error('UNHANDLED REJECTION — shutting down', err);
    process.exit(1);
};

// Handle uncaught exceptions
const uncaughtExceptionHandler = (err) => {
    logger.error('UNCAUGHT EXCEPTION — shutting down', err);
    process.exit(1);
};

module.exports = {
    AppError,
    errorHandler,
    unhandledRejectionHandler,
    uncaughtExceptionHandler
};
