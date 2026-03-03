const { validationResult } = require("express-validator");

/**
 * Centralized validation error handler middleware
 * Extracts validation errors and returns standardized error response
 */
module.exports = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        // Extract only the error messages
        const errorMessages = errors.array().map(err => err.msg);

        return res.status(400).json({
            success: false,
            errors: errorMessages
        });
    }

    next();
};
