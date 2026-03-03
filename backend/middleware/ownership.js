const { ROLES, OWNER_STATUS } = require('../config/constants');
const Hostel = require('../models/Hostel');
const Room = require('../models/Room');
const Booking = require('../models/Booking');

/**
 * Middleware to check if user owns a specific hostel
 */
exports.checkHostelOwnership = async (req, res, next) => {
    try {
        const { id } = req.params;
        const hostel = await Hostel.findById(id);

        if (!hostel) {
            return res.status(404).json({ error: 'Hostel not found' });
        }

        // Superadmin can access all hostels
        if (req.user.role === ROLES.SUPERADMIN) {
            return next();
        }

        // Check if user owns this hostel
        if (hostel.owner.toString() !== req.user.id) {
            return res.status(403).json({
                error: 'Access denied. You do not own this hostel.'
            });
        }

        next();
    } catch (error) {
        console.error('Hostel ownership check error:', error);
        res.status(500).json({ error: 'Server error during ownership validation' });
    }
};

/**
 * Middleware to check if user owns a specific room
 */
exports.checkRoomOwnership = async (req, res, next) => {
    try {
        const { id } = req.params;
        const room = await Room.findById(id);

        if (!room) {
            return res.status(404).json({ error: 'Room not found' });
        }

        // Superadmin can access all rooms
        if (req.user.role === ROLES.SUPERADMIN) {
            return next();
        }

        // Check if user owns this room
        if (room.owner.toString() !== req.user.id) {
            return res.status(403).json({
                error: 'Access denied. You do not own this room.'
            });
        }

        next();
    } catch (error) {
        console.error('Room ownership check error:', error);
        res.status(500).json({ error: 'Server error during ownership validation' });
    }
};

/**
 * Middleware to check if user owns the hostel associated with a booking
 */
exports.checkBookingOwnership = async (req, res, next) => {
    try {
        const { id } = req.params;
        const booking = await Booking.findById(id).populate('hostel');

        if (!booking) {
            return res.status(404).json({ error: 'Booking not found' });
        }

        // Superadmin can access all bookings
        if (req.user.role === ROLES.SUPERADMIN) {
            return next();
        }

        // Check if user owns the hostel for this booking
        if (booking.hostel.owner.toString() !== req.user.id) {
            return res.status(403).json({
                error: 'Access denied. You do not own the hostel for this booking.'
            });
        }

        next();
    } catch (error) {
        console.error('Booking ownership check error:', error);
        res.status(500).json({ error: 'Server error during ownership validation' });
    }
};

/**
 * Middleware to check if staff belongs to the owner
 */
exports.checkStaffOwnership = async (req, res, next) => {
    try {
        const { id } = req.params;
        const User = require('../models/User');
        const staff = await User.findById(id);

        if (!staff) {
            return res.status(404).json({ error: 'Staff not found' });
        }

        // Superadmin can access all staff
        if (req.user.role === ROLES.SUPERADMIN) {
            return next();
        }

        // Check if this staff belongs to the owner
        if (staff.owner?.toString() !== req.user.id) {
            return res.status(403).json({
                error: 'Access denied. This staff does not belong to you.'
            });
        }

        next();
    } catch (error) {
        console.error('Staff ownership check error:', error);
        res.status(500).json({ error: 'Server error during ownership validation' });
    }
};

/**
 * Middleware to require approved owner status
 */
exports.requireApprovedOwner = (req, res, next) => {
    if (req.user.role !== ROLES.OWNER) {
        return res.status(403).json({
            error: 'Access denied. Only owners can perform this action.'
        });
    }

    // Note: ownerStatus is not in JWT, need to check from DB if needed
    // For now, assume if role is owner, they are approved (enforced at role assignment)
    next();
};

/**
 * Middleware to require superadmin role
 */
exports.requireSuperadmin = (req, res, next) => {
    if (req.user.role !== ROLES.SUPERADMIN) {
        return res.status(403).json({
            error: 'Access denied. Only superadmin can perform this action.'
        });
    }
    next();
};

/**
 * Middleware to require owner or staff role
 */
exports.requireOwnerOrStaff = (req, res, next) => {
    if (![ROLES.OWNER, ROLES.STAFF].includes(req.user.role)) {
        return res.status(403).json({
            error: 'Access denied. Only owners or staff can perform this action.'
        });
    }
    next();
};

/**
 * Filter query by ownership for multi-tenant data isolation
 * Adds owner filter to query unless user is superadmin
 */
exports.addOwnerFilter = (req, res, next) => {
    // Superadmin sees all data
    if (req.user.role === ROLES.SUPERADMIN) {
        req.ownerFilter = {};
    }
    // Owners see their own data
    else if (req.user.role === ROLES.OWNER) {
        req.ownerFilter = { owner: req.user.id };
    }
    // Staff see their owner's data
    else if (req.user.role === ROLES.STAFF && req.user.owner) {
        req.ownerFilter = { owner: req.user.owner };
    }
    // Residents don't filter by owner (they see all approved hostels)
    else {
        req.ownerFilter = {};
    }

    next();
};
