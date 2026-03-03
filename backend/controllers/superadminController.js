const OwnerApplication = require('../models/OwnerApplication');
const User = require('../models/User');
const Hostel = require('../models/Hostel');
const Booking = require('../models/Booking');
const { ROLES, OWNER_STATUS } = require('../config/constants');
const { sendEmail } = require('../services/emailService');
const { createAuditLog } = require('../utils/auditLogger');
const { getPaginationParams, getPaginationMeta } = require('../utils/pagination');
const logger = require('../utils/logger');

/**
 * @desc    Get all pending owner applications
 * @route   GET /api/admin/owner-requests
 * @access  Private (superadmin only)
 */
exports.getOwnerRequests = async (req, res) => {
    try {
        const { status = OWNER_STATUS.PENDING } = req.query;
        const { page, limit } = getPaginationParams(req.query);

        const filter = { status };
        const total = await OwnerApplication.countDocuments(filter);

        const applications = await OwnerApplication.find(filter)
            .populate('user', 'name email phone createdAt')
            .populate('reviewedBy', 'name email')
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            count: applications.length,
            data: applications,
            pagination: getPaginationMeta(total, page, limit)
        });
    } catch (error) {
        logger.error('Get owner requests error', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch owner applications' } });
    }
};

/**
 * @desc    Approve owner application
 * @route   PATCH /api/admin/approve-owner/:id
 * @access  Private (superadmin only)
 */
exports.approveOwner = async (req, res) => {
    try {
        const { id } = req.params;

        // Find application
        const application = await OwnerApplication.findById(id).populate('user');

        if (!application) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found' } });
        }

        if (application.status !== OWNER_STATUS.PENDING) {
            return res.status(400).json({
                success: false, error: { code: 'ALREADY_PROCESSED', message: `Application already ${application.status}` }
            });
        }

        const user = application.user;

        // Update user role and status
        user.role = ROLES.OWNER;
        user.ownerStatus = OWNER_STATUS.APPROVED;
        await user.save();

        // Update application
        application.status = OWNER_STATUS.APPROVED;
        application.reviewedBy = req.user.id;
        application.reviewedAt = new Date();
        await application.save();

        // Create audit log
        await createAuditLog({
            userId: req.user.id,
            action: 'OWNER_APPROVED',
            targetUserId: user._id,
            targetResource: `OwnerApplication:${application._id} `,
            details: { businessName: application.businessName },
            req
        });

        // Send approval email
        try {
            await sendEmail(user.email, 'ownerApproved', {
                ownerName: user.name,
                businessName: application.businessName
            });
        } catch (emailError) {
            logger.warn('Owner approval email failed', { userId: user._id, error: emailError.message });
        }

        res.json({
            success: true,
            message: 'Owner application approved successfully',
            data: application
        });
    } catch (error) {
        logger.error('Approve owner error', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to approve application' } });
    }
};

/**
 * @desc    Reject owner application
 * @route   PATCH /api/admin/reject-owner/:id
 * @access  Private (superadmin only)
 */
exports.rejectOwner = async (req, res) => {
    try {
        const { id } = req.params;
        const { rejectionReason } = req.body;

        if (!rejectionReason || rejectionReason.trim().length === 0) {
            return res.status(400).json({ success: false, error: { code: 'MISSING_REASON', message: 'Rejection reason is required' } });
        }

        // Find application
        const application = await OwnerApplication.findById(id).populate('user');

        if (!application) {
            return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Application not found' } });
        }

        if (application.status !== OWNER_STATUS.PENDING) {
            return res.status(400).json({
                success: false, error: { code: 'ALREADY_PROCESSED', message: `Application already ${application.status}` }
            });
        }

        const user = application.user;

        // Update application
        application.status = OWNER_STATUS.REJECTED;
        application.rejectionReason = rejectionReason;
        application.reviewedBy = req.user.id;
        application.reviewedAt = new Date();
        await application.save();

        // Revert user role to resident and mark ownerStatus as rejected.
        // Role MUST be reverted — ownerStatus alone does not remove access.
        await User.findByIdAndUpdate(application.user._id, {
            role: ROLES.RESIDENT,
            ownerStatus: OWNER_STATUS.REJECTED
        });

        // Create audit log
        await createAuditLog({
            userId: req.user.id,
            action: 'OWNER_REJECTED',
            targetUserId: user._id,
            targetResource: `OwnerApplication:${application._id} `,
            details: { businessName: application.businessName, reason: rejectionReason },
            req
        });

        // Send rejection email
        try {
            await sendEmail(user.email, 'ownerRejected', {
                ownerName: user.name,
                businessName: application.businessName,
                reason: rejectionReason
            });
        } catch (emailError) {
            logger.warn('Owner rejection email failed', { userId: user._id, error: emailError.message });
        }

        res.json({
            success: true,
            message: 'Owner application rejected',
            data: application
        });
    } catch (error) {
        logger.error('Reject owner error', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to reject application' } });
    }
};

/**
 * @desc    Get all approved owners
 * @route   GET /api/admin/all-owners
 * @access  Private (superadmin only)
 */
exports.getAllOwners = async (req, res) => {
    try {
        const { page, limit } = getPaginationParams(req.query);
        const { accountStatus } = req.query;

        const filter = {
            role: ROLES.OWNER,
            ownerStatus: OWNER_STATUS.APPROVED
        };

        if (accountStatus) filter.accountStatus = accountStatus;

        const total = await User.countDocuments(filter);

        const owners = await User.find(filter)
            .select('-password')
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 });

        // Get statistics for each owner
        const ownersWithStats = await Promise.all(
            owners.map(async (owner) => {
                const hostelCount = await Hostel.countDocuments({ owner: owner._id });
                const bookingCount = await Booking.countDocuments({
                    hostel: { $in: await Hostel.find({ owner: owner._id }).distinct('_id') }
                });

                return {
                    ...owner.toObject(),
                    stats: {
                        hostels: hostelCount,
                        bookings: bookingCount
                    }
                };
            })
        );

        res.json({
            success: true,
            count: ownersWithStats.length,
            data: ownersWithStats,
            pagination: getPaginationMeta(total, page, limit)
        });
    } catch (error) {
        logger.error('Get all owners error', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch owners' } });
    }
};

/**
 * @desc    Get platform statistics
 * @route   GET /api/admin/platform-stats
 * @access  Private (superadmin only)
 */
exports.getPlatformStats = async (req, res) => {
    try {
        const totalOwners = await User.countDocuments({
            role: ROLES.OWNER,
            ownerStatus: OWNER_STATUS.APPROVED
        });

        const pendingApplications = await OwnerApplication.countDocuments({
            status: OWNER_STATUS.PENDING
        });

        const totalHostels = await Hostel.countDocuments();
        const totalBookings = await Booking.countDocuments();
        const totalResidents = await User.countDocuments({ role: ROLES.RESIDENT });
        const totalStaff = await User.countDocuments({ role: ROLES.STAFF });

        res.json({
            success: true,
            data: {
                owners: totalOwners,
                pendingApplications,
                hostels: totalHostels,
                bookings: totalBookings,
                residents: totalResidents,
                staff: totalStaff
            }
        });
    } catch (error) {
        logger.error('Get platform stats error', error);
        res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Failed to fetch platform statistics' } });
    }
};
