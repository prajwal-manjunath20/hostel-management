const AuditLog = require('../models/AuditLog');

/**
 * Create an audit log entry
 * @param {Object} params - Audit log parameters
 * @param {String} params.userId - User performing the action
 * @param {String} params.action - Action type
 * @param {String} params.targetUserId - Target user (optional)
 * @param {String} params.targetResource - Target resource (optional)
 * @param {Object} params.details - Additional details (optional)
 * @param {Object} params.req - Express request object (for IP/UA)
 */
const createAuditLog = async ({ userId, action, targetUserId, targetResource, details, req }) => {
    try {
        await AuditLog.create({
            user: userId,
            action,
            targetUser: targetUserId,
            targetResource,
            details,
            ipAddress: req?.ip || req?.connection?.remoteAddress,
            userAgent: req?.get('user-agent')
        });
    } catch (error) {
        console.error('Failed to create audit log:', error);
        // Don't throw - audit logging should not break the main flow
    }
};

/**
 * Get audit logs with filters
 * @param {Object} filters - Query filters
 * @param {Number} limit - Number of records to return
 * @param {Number} skip - Number of records to skip
 */
const getAuditLogs = async (filters = {}, limit = 100, skip = 0) => {
    try {
        const logs = await AuditLog.find(filters)
            .populate('user', 'name email role')
            .populate('targetUser', 'name email role')
            .sort({ timestamp: -1 })
            .limit(limit)
            .skip(skip);

        const total = await AuditLog.countDocuments(filters);

        return { logs, total };
    } catch (error) {
        console.error('Failed to fetch audit logs:', error);
        throw error;
    }
};

module.exports = {
    createAuditLog,
    getAuditLogs
};
