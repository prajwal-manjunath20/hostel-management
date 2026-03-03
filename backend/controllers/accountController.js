'use strict';

const User = require('../models/User');
const { ROLES } = require('../config/constants');
const { createAuditLog } = require('../utils/auditLogger');
const logger = require('../utils/logger');
const { success, error, serverError } = require('../utils/apiResponse');

/**
 * @desc    Suspend owner account
 * @route   PATCH /api/admin/suspend-owner/:id
 * @access  Private (superadmin only)
 */
exports.suspendOwner = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason || reason.trim().length === 0)
            return error(res, 'REASON_REQUIRED', 'Suspension reason is required');

        // Verify target is actually an owner first
        const targetUser = await User.findOne({ _id: id, role: ROLES.OWNER });
        if (!targetUser)
            return error(res, 'NOT_FOUND', 'Owner not found', 404);

        // Idempotent: if already suspended, return 200 (not an error)
        if (targetUser.accountStatus === 'suspended') {
            return success(res, {
                ownerId: targetUser._id,
                ownerName: targetUser.name,
                alreadySuspended: true
            }, 'Account is already suspended');
        }

        // Atomic: only updates if currently NOT suspended
        const owner = await User.findOneAndUpdate(
            { _id: id, role: ROLES.OWNER, accountStatus: { $ne: 'suspended' } },
            {
                accountStatus: 'suspended',
                suspensionReason: reason.trim(),
                suspendedAt: new Date(),
                suspendedBy: req.user.id
            },
            { new: true }
        );

        if (!owner)
            return error(res, 'SUSPEND_FAILED', 'Suspension failed — concurrent update detected', 409);

        await createAuditLog({
            userId: req.user.id,
            action: 'OWNER_SUSPENDED',
            targetUserId: owner._id,
            details: { reason: reason.trim() },
            req
        });

        logger.info('Owner suspended', { targetId: id, by: req.user.id, reason, requestId: req.id });
        return success(res, {
            ownerId: owner._id,
            ownerName: owner.name,
            suspendedAt: owner.suspendedAt,
            reason: owner.suspensionReason
        }, 'Owner account suspended successfully');
    } catch (err) {
        return serverError(res, err, logger);
    }
};

/**
 * @desc    Activate suspended owner account
 * @route   PATCH /api/admin/activate-owner/:id
 * @access  Private (superadmin only)
 */
exports.activateOwner = async (req, res) => {
    try {
        const { id } = req.params;

        const targetUser = await User.findOne({ _id: id, role: ROLES.OWNER });
        if (!targetUser)
            return error(res, 'NOT_FOUND', 'Owner not found', 404);

        // Idempotent: already active → return 200
        if (targetUser.accountStatus === 'active') {
            return success(res, {
                ownerId: targetUser._id,
                ownerName: targetUser.name,
                alreadyActive: true
            }, 'Account is already active');
        }

        // Atomic: only updates if currently suspended
        const owner = await User.findOneAndUpdate(
            { _id: id, role: ROLES.OWNER, accountStatus: 'suspended' },
            {
                accountStatus: 'active',
                $unset: { suspensionReason: '', suspendedAt: '', suspendedBy: '' }
            },
            { new: true }
        );

        if (!owner)
            return error(res, 'ACTIVATE_FAILED', 'Activation failed — concurrent update detected', 409);

        await createAuditLog({
            userId: req.user.id,
            action: 'OWNER_ACTIVATED',
            targetUserId: owner._id,
            details: {},
            req
        });

        logger.info('Owner activated', { targetId: id, by: req.user.id, requestId: req.id });
        return success(res, { ownerId: owner._id, ownerName: owner.name }, 'Owner account activated');
    } catch (err) {
        return serverError(res, err, logger);
    }
};
