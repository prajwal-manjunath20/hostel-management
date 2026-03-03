'use strict';

const Booking = require('../models/Booking');
const Room = require('../models/Room');
const Hostel = require('../models/Hostel');
const { sendEmail } = require('../services/emailService');
const { getPaginationParams, getPaginationMeta } = require('../utils/pagination');
const { assertTransition } = require('../utils/bookingStateMachine');
const logger = require('../utils/logger');
const { success, created, error, serverError } = require('../utils/apiResponse');
const { ROLES } = require('../config/constants');

// ─── Create Booking (atomic — session + transaction) ─────────────────────────
exports.createBooking = async (req, res) => {
    const session = await Booking.startSession();
    session.startTransaction();

    try {
        const { roomId, hostelId, checkIn, checkOut } = req.body;
        const residentId = req.user.id;

        if (!roomId || !hostelId || !checkIn || !checkOut) {
            await session.abortTransaction();
            session.endSession();
            return error(res, 'MISSING_FIELDS', 'All fields are required');
        }

        const checkInDate = new Date(checkIn);
        const checkOutDate = new Date(checkOut);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (checkInDate < today) {
            await session.abortTransaction();
            session.endSession();
            return error(res, 'INVALID_DATE', 'Check-in date cannot be in the past');
        }
        if (checkOutDate <= checkInDate) {
            await session.abortTransaction();
            session.endSession();
            return error(res, 'INVALID_DATE', 'Check-out must be after check-in');
        }

        const daysDiff = (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24);
        if (daysDiff < 1) {
            await session.abortTransaction();
            session.endSession();
            return error(res, 'INVALID_DATE', 'Minimum stay is 1 day');
        }

        const oneYear = 365 * 24 * 60 * 60 * 1000;
        if (checkOutDate - checkInDate > oneYear) {
            await session.abortTransaction();
            session.endSession();
            return error(res, 'INVALID_DATE', 'Booking duration cannot exceed 1 year');
        }

        const twoYearsFromNow = new Date();
        twoYearsFromNow.setFullYear(twoYearsFromNow.getFullYear() + 2);
        if (checkInDate > twoYearsFromNow) {
            await session.abortTransaction();
            session.endSession();
            return error(res, 'INVALID_DATE', 'Cannot book more than 2 years in advance');
        }

        // ── All checks below run inside the session ──────────────────────────
        // No duplicate active booking for this resident
        const existingActiveBooking = await Booking.exists({
            resident: residentId,
            status: { $in: ['pending', 'approved'] }
        }).session(session);
        if (existingActiveBooking) {
            await session.abortTransaction();
            session.endSession();
            return error(res, 'ACTIVE_BOOKING_EXISTS', 'You already have an active booking. Cancel it first.');
        }

        const room = await Room.findById(roomId).session(session);
        if (!room) {
            await session.abortTransaction();
            session.endSession();
            return error(res, 'ROOM_NOT_FOUND', 'Room not found', 404);
        }
        if (!room.isAvailable) {
            await session.abortTransaction();
            session.endSession();
            return error(res, 'ROOM_UNAVAILABLE', 'Room is not available');
        }

        // Date-overlap check — inside session so concurrent requests see each other
        const overlappingBooking = await Booking.exists({
            room: roomId,
            status: { $in: ['pending', 'approved'] },
            checkIn: { $lte: checkOutDate },
            checkOut: { $gte: checkInDate }
        }).session(session);
        if (overlappingBooking) {
            await session.abortTransaction();
            session.endSession();
            return error(res, 'ROOM_ALREADY_BOOKED', 'Room is already booked for the selected dates');
        }

        // Create — pass array form required by Mongoose when using sessions
        const [booking] = await Booking.create([{
            resident: residentId,
            room: roomId,
            hostel: hostelId,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            priceSnapshot: room.pricePerMonth,
            status: 'pending'
        }], { session });

        await session.commitTransaction();
        session.endSession();

        const populated = await Booking.findById(booking._id)
            .populate('room')
            .populate('hostel')
            .populate('resident', 'name email');

        logger.info('Booking created', { userId: residentId, bookingId: booking._id, requestId: req.id });
        return created(res, populated, 'Booking submitted successfully');
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        return serverError(res, err, logger);
    }
};


// ─── Get My Bookings ──────────────────────────────────────────────────────────
exports.getMyBookings = async (req, res) => {
    try {
        const { page, limit } = getPaginationParams(req.query);
        const total = await Booking.countDocuments({ resident: req.user.id });
        const bookings = await Booking.find({ resident: req.user.id })
            .populate('room')
            .populate('hostel')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        return success(res, bookings, 'Bookings fetched', getPaginationMeta(total, page, limit));
    } catch (err) {
        return serverError(res, err, logger);
    }
};

// ─── Get All Bookings (role-scoped) ──────────────────────────────────────────
exports.getAllBookings = async (req, res) => {
    try {
        const { page, limit } = getPaginationParams(req.query);
        const { status, hostelId, startDate, endDate } = req.query;
        const filter = {};

        if (req.user.role === ROLES.SUPERADMIN) {
            // sees all
        } else if (req.user.role === ROLES.OWNER) {
            const ownerHostels = await Hostel.find({ owner: req.user.id }).distinct('_id');
            filter.hostel = { $in: ownerHostels };
        } else if (req.user.role === ROLES.STAFF && req.user.owner) {
            const ownerHostels = await Hostel.find({ owner: req.user.owner }).distinct('_id');
            filter.hostel = { $in: ownerHostels };
        } else if (req.user.role === ROLES.RESIDENT) {
            filter.resident = req.user.id;
        }

        if (status) filter.status = status;
        if (hostelId) filter.hostel = hostelId;
        if (startDate || endDate) {
            filter.checkIn = {};
            if (startDate) filter.checkIn.$gte = new Date(startDate);
            if (endDate) filter.checkIn.$lte = new Date(endDate);
        }

        const total = await Booking.countDocuments(filter);
        const bookings = await Booking.find(filter)
            .populate('resident', 'name email phone')
            .populate('hostel', 'name address city')
            .populate('room', 'roomNumber type')
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ createdAt: -1 });

        return success(res, bookings, 'Bookings fetched', getPaginationMeta(total, page, limit));
    } catch (err) {
        return serverError(res, err, logger);
    }
};

// ─── Approve Booking (atomic) ─────────────────────────────────────────────────
exports.approveBooking = async (req, res) => {
    const session = await Booking.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;

        // Atomic: only succeeds if status is currently 'pending'
        const booking = await Booking.findOneAndUpdate(
            { _id: id, status: 'pending' },
            { status: 'approved', approvedBy: req.user.id, approvedAt: new Date() },
            { new: true, session }
        );

        if (!booking) {
            await session.abortTransaction();
            session.endSession();
            // Could be "not found" or "already processed" — either way, 409
            return error(res, 'BOOKING_ALREADY_PROCESSED',
                'Booking not found or already processed', 409);
        }

        // Ownership check (except superadmin)
        const hostel = await Hostel.findById(booking.hostel).session(session);
        if (!hostel) {
            await session.abortTransaction();
            session.endSession();
            return error(res, 'HOSTEL_NOT_FOUND', 'Hostel not found', 404);
        }

        if (req.user.role !== ROLES.SUPERADMIN) {
            const userOwnerId = req.user.role === ROLES.OWNER ? req.user.id : req.user.owner;
            if (hostel.owner.toString() !== userOwnerId) {
                await session.abortTransaction();
                session.endSession();
                return error(res, 'FORBIDDEN', 'You do not own this hostel', 403);
            }
        }

        // Atomic room availability update
        const room = await Room.findOneAndUpdate(
            { _id: booking.room, isAvailable: true },
            { isAvailable: false },
            { new: true, session }
        );
        if (!room) {
            await session.abortTransaction();
            session.endSession();
            return error(res, 'ROOM_UNAVAILABLE', 'Room is no longer available');
        }

        await session.commitTransaction();
        session.endSession();

        const populated = await Booking.findById(booking._id)
            .populate('resident', 'name email phone')
            .populate('room')
            .populate('hostel')
            .populate('approvedBy', 'name');

        // Email is fire-and-forget (don't block response)
        sendEmail(populated.resident.email, 'bookingApproved', {
            residentName: populated.resident.name,
            hostelName: populated.hostel.name,
            roomNumber: populated.room.roomNumber,
            checkIn: populated.checkIn,
            checkOut: populated.checkOut,
            price: populated.priceSnapshot
        }).catch(e => logger.error('Approve booking email failed', e));

        logger.info('Booking approved', { bookingId: id, userId: req.user.id, requestId: req.id });
        return success(res, populated, 'Booking approved');
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        return serverError(res, err, logger);
    }
};

// ─── Reject Booking (atomic) ──────────────────────────────────────────────────
exports.rejectBooking = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        // Ownership verification before atomic update
        const existing = await Booking.findById(id).populate('hostel');
        if (!existing) return error(res, 'NOT_FOUND', 'Booking not found', 404);

        if (req.user.role !== ROLES.SUPERADMIN) {
            const userOwnerId = req.user.role === ROLES.OWNER ? req.user.id : req.user.owner;
            if (existing.hostel?.owner?.toString() !== userOwnerId)
                return error(res, 'FORBIDDEN', 'You do not own this hostel', 403);
        }

        // Atomic: only transitions from pending
        const booking = await Booking.findOneAndUpdate(
            { _id: id, status: 'pending' },
            {
                status: 'rejected',
                rejectionReason: reason || 'No reason provided',
                approvedBy: req.user.id,
                approvedAt: new Date()
            },
            { new: true }
        ).populate('resident', 'name email phone')
            .populate('room')
            .populate('hostel');

        if (!booking)
            return error(res, 'BOOKING_ALREADY_PROCESSED', 'Booking already processed', 409);

        logger.info('Booking rejected', { bookingId: id, userId: req.user.id, requestId: req.id });
        return success(res, booking, 'Booking rejected');
    } catch (err) {
        return serverError(res, err, logger);
    }
};

// ─── Cancel Booking (atomic, resident only) ───────────────────────────────────
exports.cancelBooking = async (req, res) => {
    try {
        const { id } = req.params;

        // Atomic: resident + pending status in single filter — no TOCTOU
        const booking = await Booking.findOneAndUpdate(
            { _id: id, status: 'pending', resident: req.user.id },
            { status: 'cancelled' },
            { new: true }
        );

        if (!booking) {
            // Distinguish "not yours" from "wrong state" — both return 409
            const exists = await Booking.exists({ _id: id, resident: req.user.id });
            if (!exists) return error(res, 'FORBIDDEN', 'Not authorized to cancel this booking', 403);
            return error(res, 'BOOKING_NOT_CANCELLABLE', 'Only pending bookings can be cancelled', 409);
        }

        logger.info('Booking cancelled', { bookingId: id, userId: req.user.id, requestId: req.id });
        return success(res, booking, 'Booking cancelled');
    } catch (err) {
        return serverError(res, err, logger);
    }
};
