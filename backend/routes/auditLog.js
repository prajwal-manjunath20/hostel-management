const express = require('express');
const router = express.Router();
const { requireSuperadmin } = require('../middleware/role');
const { getAuditLogs } = require('../utils/auditLogger');

// Get audit logs (superadmin only)
router.get('/audit-logs', requireSuperadmin, async (req, res) => {
    try {
        const { action, userId, limit = 100, skip = 0 } = req.query;

        const filters = {};
        if (action) filters.action = action;
        if (userId) filters.user = userId;

        const { logs, total } = await getAuditLogs(filters, parseInt(limit), parseInt(skip));

        res.json({
            logs,
            total,
            limit: parseInt(limit),
            skip: parseInt(skip)
        });
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
});

module.exports = router;
