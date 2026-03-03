/**
 * Pagination utility functions
 */

/**
 * Apply pagination to a Mongoose query
 * @param {Query} query - Mongoose query object
 * @param {Number} page - Page number (1-indexed)
 * @param {Number} limit - Items per page
 * @returns {Query} Modified query with skip and limit
 */
exports.paginate = (query, page = 1, limit = 10) => {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    return query.skip(skip).limit(limitNum);
};

/**
 * Generate pagination metadata
 * @param {Number} total - Total number of items
 * @param {Number} page - Current page number
 * @param {Number} limit - Items per page
 * @returns {Object} Pagination metadata
 */
exports.getPaginationMeta = (total, page = 1, limit = 10) => {
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const totalPages = Math.ceil(total / limitNum);

    return {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
        nextPage: pageNum < totalPages ? pageNum + 1 : null,
        prevPage: pageNum > 1 ? pageNum - 1 : null
    };
};

/**
 * Extract pagination parameters from request query
 * @param {Object} query - Express request query object
 * @returns {Object} Pagination parameters
 */
exports.getPaginationParams = (query) => {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;

    // Ensure reasonable limits
    const maxLimit = 100;
    const finalLimit = limit > maxLimit ? maxLimit : limit;

    return { page, limit: finalLimit };
};
